"""Middleware for ALM Adapters service."""

import json
import time
from typing import Dict, Optional

import structlog
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer
from google.cloud import secretmanager
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings

logger = structlog.get_logger(__name__)

# Security scheme for API documentation
security = HTTPBearer()


class TracingMiddleware(BaseHTTPMiddleware):
    """Middleware for distributed tracing and request logging."""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Generate trace ID
        import uuid
        trace_id = str(uuid.uuid4())
        
        # Add trace context to request state
        request.state.trace_id = trace_id
        
        # Log request start
        logger.info(
            "Request started",
            trace_id=trace_id,
            method=request.method,
            url=str(request.url),
            user_agent=request.headers.get("user-agent"),
        )
        
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log request completion
            logger.info(
                "Request completed",
                trace_id=trace_id,
                method=request.method,
                url=str(request.url),
                status_code=response.status_code,
                duration_ms=round(duration * 1000, 2),
            )
            
            # Add trace ID to response headers
            response.headers["X-Trace-ID"] = trace_id
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            
            logger.error(
                "Request failed",
                trace_id=trace_id,
                method=request.method,
                url=str(request.url),
                error=str(e),
                duration_ms=round(duration * 1000, 2),
            )
            
            raise


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """Middleware for Firebase authentication and service-to-service auth."""
    
    def __init__(self, app):
        super().__init__(app)
        self.settings = get_settings()
        self.firebase_app = None
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK."""
        try:
            import firebase_admin
            from firebase_admin import auth, credentials
            
            if not firebase_admin._apps:
                # Get Firebase config from Secret Manager
                client = secretmanager.SecretManagerServiceClient()
                secret_name = f"projects/{self.settings.project_id}/secrets/{self.settings.firebase_config_secret}/versions/latest"
                
                try:
                    response = client.access_secret_version(request={"name": secret_name})
                    firebase_config = json.loads(response.payload.data.decode("UTF-8"))
                    
                    cred = credentials.Certificate(firebase_config)
                    self.firebase_app = firebase_admin.initialize_app(cred)
                    
                    logger.info("Firebase Admin SDK initialized")
                    
                except Exception as e:
                    logger.error("Failed to initialize Firebase", error=str(e))
                    
        except ImportError:
            logger.warning("Firebase Admin SDK not available")
    
    async def dispatch(self, request: Request, call_next):
        # Skip auth for health endpoints
        if request.url.path.startswith("/health"):
            return await call_next(request)
        
        # Skip auth for OpenAPI docs
        if request.url.path in ["/docs", "/openapi.json", "/redoc"]:
            return await call_next(request)
        
        try:
            # Get authorization header
            auth_header = request.headers.get("authorization")
            
            if not auth_header:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authorization header required",
                )
            
            # Check for Bearer token
            if not auth_header.startswith("Bearer "):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authorization header format",
                )
            
            token = auth_header.split("Bearer ")[1]
            
            # Verify token
            user_info = await self._verify_token(token, request)
            
            if not user_info:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token",
                )
            
            # Add user info to request state
            request.state.current_user = user_info
            
            return await call_next(request)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Authentication middleware error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication error",
            )
    
    async def _verify_token(self, token: str, request: Request) -> Optional[Dict]:
        """Verify Firebase ID token or service token."""
        try:
            # Check if it's a Pub/Sub push token
            if self._is_pubsub_request(request):
                return await self._verify_pubsub_token(token, request)
            
            # Verify Firebase ID token
            if self.firebase_app:
                from firebase_admin import auth
                
                decoded_token = auth.verify_id_token(token)
                
                return {
                    "uid": decoded_token["uid"],
                    "email": decoded_token.get("email"),
                    "email_verified": decoded_token.get("email_verified", False),
                    "roles": decoded_token.get("roles", []),
                    "auth_type": "firebase",
                }
            
            return None
            
        except Exception as e:
            logger.error("Token verification failed", error=str(e))
            return None
    
    def _is_pubsub_request(self, request: Request) -> bool:
        """Check if request is from Pub/Sub."""
        user_agent = request.headers.get("user-agent", "")
        return "Google-Cloud-Pub-Sub" in user_agent
    
    async def _verify_pubsub_token(self, token: str, request: Request) -> Optional[Dict]:
        """Verify Pub/Sub push token."""
        try:
            # This would implement proper Pub/Sub token verification
            # For now, return a service account identity
            return {
                "uid": "pubsub-service",
                "service": "pubsub",
                "auth_type": "service",
            }
            
        except Exception as e:
            logger.error("Pub/Sub token verification failed", error=str(e))
            return None


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting API requests."""
    
    def __init__(self, app):
        super().__init__(app)
        self.settings = get_settings()
        self.request_counts = {}  # In production, use Redis
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health endpoints
        if request.url.path.startswith("/health"):
            return await call_next(request)
        
        try:
            # Get client identifier
            client_id = self._get_client_id(request)
            
            # Check rate limit
            if self._is_rate_limited(client_id):
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded",
                    headers={"Retry-After": "60"},
                )
            
            # Record request
            self._record_request(client_id)
            
            return await call_next(request)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Rate limiting middleware error", error=str(e))
            return await call_next(request)
    
    def _get_client_id(self, request: Request) -> str:
        """Get client identifier for rate limiting."""
        # Use user ID if available
        if hasattr(request.state, "current_user"):
            user = request.state.current_user
            if user and user.get("uid"):
                return f"user:{user['uid']}"
        
        # Fall back to IP address
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("x-forwarded-for")
        
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        return f"ip:{client_ip}"
    
    def _is_rate_limited(self, client_id: str) -> bool:
        """Check if client has exceeded rate limit."""
        current_time = int(time.time())
        window_start = current_time - 60  # 1-minute window
        
        # Clean old entries
        if client_id in self.request_counts:
            self.request_counts[client_id] = [
                timestamp for timestamp in self.request_counts[client_id]
                if timestamp > window_start
            ]
        
        # Check current count
        current_count = len(self.request_counts.get(client_id, []))
        
        return current_count >= self.settings.rate_limit_per_minute
    
    def _record_request(self, client_id: str):
        """Record a request for rate limiting."""
        current_time = int(time.time())
        
        if client_id not in self.request_counts:
            self.request_counts[client_id] = []
        
        self.request_counts[client_id].append(current_time)


# Dependency for getting current user
async def get_current_user(request: Request) -> Dict:
    """Dependency to get current authenticated user."""
    if not hasattr(request.state, "current_user"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    
    return request.state.current_user


# Dependency for getting trace ID
async def get_trace_id(request: Request) -> str:
    """Dependency to get current trace ID."""
    return getattr(request.state, "trace_id", "unknown")
