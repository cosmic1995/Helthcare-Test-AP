"""Custom middleware for the ingest API service."""

import time
import uuid
from typing import Callable

import structlog
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from google.cloud import trace_v1
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.services.auth_service import AuthService

logger = structlog.get_logger(__name__)


class TracingMiddleware(BaseHTTPMiddleware):
    """Middleware for distributed tracing."""
    
    def __init__(self, app, *args, **kwargs):
        super().__init__(app, *args, **kwargs)
        self.settings = get_settings()
        if self.settings.enable_tracing:
            self.trace_client = trace_v1.TraceServiceClient()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add tracing to requests."""
        if not self.settings.enable_tracing:
            return await call_next(request)
        
        # Generate trace ID
        trace_id = str(uuid.uuid4())
        request.state.trace_id = trace_id
        
        # Add trace headers
        request.headers.__dict__["_list"].append(
            (b"x-trace-id", trace_id.encode())
        )
        
        start_time = time.time()
        
        try:
            response = await call_next(request)
            
            # Add trace ID to response headers
            response.headers["X-Trace-ID"] = trace_id
            
            # Log trace information
            duration = time.time() - start_time
            logger.info(
                "Request traced",
                trace_id=trace_id,
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration=duration,
            )
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                "Request failed",
                trace_id=trace_id,
                method=request.method,
                path=request.url.path,
                error=str(e),
                duration=duration,
                exc_info=True,
            )
            raise


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for structured logging."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Log request and response information."""
        start_time = time.time()
        
        # Get trace ID if available
        trace_id = getattr(request.state, "trace_id", str(uuid.uuid4()))
        
        # Log request
        logger.info(
            "Request started",
            trace_id=trace_id,
            method=request.method,
            path=request.url.path,
            query_params=dict(request.query_params),
            client_ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        
        try:
            response = await call_next(request)
            
            # Log response
            duration = time.time() - start_time
            logger.info(
                "Request completed",
                trace_id=trace_id,
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration=duration,
            )
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                "Request failed",
                trace_id=trace_id,
                method=request.method,
                path=request.url.path,
                error=str(e),
                duration=duration,
                exc_info=True,
            )
            raise


class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware for authentication and authorization."""
    
    def __init__(self, app, *args, **kwargs):
        super().__init__(app, *args, **kwargs)
        self.auth_service = AuthService()
        
        # Paths that don't require authentication
        self.public_paths = {
            "/health",
            "/health/ready",
            "/health/live",
            "/docs",
            "/redoc",
            "/openapi.json",
        }
        
        # Webhook paths that use service-to-service auth
        self.webhook_paths = {
            "/webhooks/file-uploaded",
            "/webhooks/document-parsed",
            "/webhooks/dlp-completed",
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Authenticate and authorize requests."""
        path = request.url.path
        
        # Skip auth for public paths
        if path in self.public_paths:
            return await call_next(request)
        
        # Handle webhook authentication
        if path in self.webhook_paths:
            return await self._handle_webhook_auth(request, call_next)
        
        # Handle user authentication
        return await self._handle_user_auth(request, call_next)
    
    async def _handle_webhook_auth(self, request: Request, call_next: Callable) -> Response:
        """Handle service-to-service authentication for webhooks."""
        try:
            # Verify the request comes from Pub/Sub
            auth_header = request.headers.get("authorization")
            if not auth_header:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"error": "Missing authorization header"},
                )
            
            # Verify the JWT token from Pub/Sub
            token = auth_header.replace("Bearer ", "")
            is_valid = await self.auth_service.verify_pubsub_token(token)
            
            if not is_valid:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"error": "Invalid service token"},
                )
            
            return await call_next(request)
            
        except Exception as e:
            logger.error("Webhook authentication failed", error=str(e))
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "Authentication failed"},
            )
    
    async def _handle_user_auth(self, request: Request, call_next: Callable) -> Response:
        """Handle user authentication."""
        try:
            # Get authorization header
            auth_header = request.headers.get("authorization")
            if not auth_header:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"error": "Missing authorization header"},
                )
            
            # Extract and verify Firebase token
            token = auth_header.replace("Bearer ", "")
            user = await self.auth_service.verify_firebase_token(token)
            
            if not user:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"error": "Invalid token"},
                )
            
            # Add user to request state
            request.state.user = user
            
            # Check authorization for the specific endpoint
            if not await self._check_authorization(request, user):
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"error": "Insufficient permissions"},
                )
            
            return await call_next(request)
            
        except Exception as e:
            logger.error("User authentication failed", error=str(e))
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "Authentication failed"},
            )
    
    async def _check_authorization(self, request: Request, user: dict) -> bool:
        """Check if user is authorized for the request."""
        # Basic role-based authorization
        user_roles = user.get("roles", [])
        
        # Admin can access everything
        if "admin" in user_roles:
            return True
        
        # QA and compliance can upload and manage files
        if request.method in ["GET", "POST"] and any(
            role in user_roles for role in ["qa", "compliance"]
        ):
            return True
        
        # Viewers can only read
        if request.method == "GET" and "viewer" in user_roles:
            return True
        
        return False


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting."""
    
    def __init__(self, app, *args, **kwargs):
        super().__init__(app, *args, **kwargs)
        self.settings = get_settings()
        self.requests = {}  # In production, use Redis
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Apply rate limiting."""
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Clean old entries
        self._cleanup_old_entries(current_time)
        
        # Check rate limit
        if client_ip in self.requests:
            request_times = self.requests[client_ip]
            if len(request_times) >= self.settings.rate_limit_requests:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"error": "Rate limit exceeded"},
                    headers={"Retry-After": str(self.settings.rate_limit_window)},
                )
        
        # Record request
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        self.requests[client_ip].append(current_time)
        
        return await call_next(request)
    
    def _cleanup_old_entries(self, current_time: float) -> None:
        """Remove old request entries outside the time window."""
        cutoff_time = current_time - self.settings.rate_limit_window
        
        for client_ip in list(self.requests.keys()):
            self.requests[client_ip] = [
                req_time for req_time in self.requests[client_ip]
                if req_time > cutoff_time
            ]
            
            if not self.requests[client_ip]:
                del self.requests[client_ip]
