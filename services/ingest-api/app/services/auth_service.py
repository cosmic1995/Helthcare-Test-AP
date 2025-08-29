"""Authentication service for Firebase and service-to-service auth."""

import json
from typing import Dict, Optional

import firebase_admin
import structlog
from firebase_admin import auth, credentials
from google.auth import jwt
from google.cloud import secretmanager

from app.config import get_settings

logger = structlog.get_logger(__name__)


class AuthService:
    """Service for handling authentication and authorization."""
    
    def __init__(self):
        self.settings = get_settings()
        self._firebase_app = None
        self._secret_client = secretmanager.SecretManagerServiceClient()
        self._initialize_firebase()
    
    def _initialize_firebase(self) -> None:
        """Initialize Firebase Admin SDK."""
        try:
            # Get Firebase config from Secret Manager
            secret_name = f"projects/{self.settings.project_id}/secrets/{self.settings.firebase_config}/versions/latest"
            response = self._secret_client.access_secret_version(request={"name": secret_name})
            firebase_config = json.loads(response.payload.data.decode("UTF-8"))
            
            # Initialize Firebase app
            cred = credentials.Certificate(firebase_config)
            self._firebase_app = firebase_admin.initialize_app(cred)
            
            logger.info("Firebase Admin SDK initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize Firebase Admin SDK", error=str(e))
            raise
    
    async def verify_firebase_token(self, token: str) -> Optional[Dict]:
        """Verify Firebase ID token and return user information."""
        try:
            # Verify the token
            decoded_token = auth.verify_id_token(token, app=self._firebase_app)
            
            # Extract user information
            user_info = {
                "uid": decoded_token["uid"],
                "email": decoded_token.get("email"),
                "email_verified": decoded_token.get("email_verified", False),
                "name": decoded_token.get("name"),
                "picture": decoded_token.get("picture"),
                "roles": decoded_token.get("roles", ["viewer"]),  # Default role
                "projects": decoded_token.get("projects", []),
            }
            
            logger.info(
                "Firebase token verified successfully",
                uid=user_info["uid"],
                email=user_info["email"],
            )
            
            return user_info
            
        except auth.InvalidIdTokenError:
            logger.warning("Invalid Firebase ID token")
            return None
        except auth.ExpiredIdTokenError:
            logger.warning("Expired Firebase ID token")
            return None
        except Exception as e:
            logger.error("Error verifying Firebase token", error=str(e))
            return None
    
    async def verify_pubsub_token(self, token: str) -> bool:
        """Verify Pub/Sub push token."""
        try:
            # Verify the JWT token from Pub/Sub
            # This validates that the request comes from Google Pub/Sub
            decoded_token = jwt.decode(token, verify=True)
            
            # Check issuer
            if decoded_token.get("iss") != "https://accounts.google.com":
                logger.warning("Invalid token issuer", issuer=decoded_token.get("iss"))
                return False
            
            # Check audience (should be the service URL)
            expected_audience = f"https://{self.settings.project_id}.appspot.com"
            if decoded_token.get("aud") != expected_audience:
                logger.warning(
                    "Invalid token audience",
                    audience=decoded_token.get("aud"),
                    expected=expected_audience,
                )
                return False
            
            logger.info("Pub/Sub token verified successfully")
            return True
            
        except Exception as e:
            logger.error("Error verifying Pub/Sub token", error=str(e))
            return False
    
    async def get_user_roles(self, uid: str) -> list:
        """Get user roles from Firebase custom claims."""
        try:
            user = auth.get_user(uid, app=self._firebase_app)
            custom_claims = user.custom_claims or {}
            return custom_claims.get("roles", ["viewer"])
            
        except Exception as e:
            logger.error("Error getting user roles", uid=uid, error=str(e))
            return ["viewer"]
    
    async def set_user_roles(self, uid: str, roles: list) -> bool:
        """Set user roles in Firebase custom claims."""
        try:
            auth.set_custom_user_claims(uid, {"roles": roles}, app=self._firebase_app)
            logger.info("User roles updated", uid=uid, roles=roles)
            return True
            
        except Exception as e:
            logger.error("Error setting user roles", uid=uid, roles=roles, error=str(e))
            return False
    
    async def get_user_projects(self, uid: str) -> list:
        """Get projects accessible to user."""
        try:
            user = auth.get_user(uid, app=self._firebase_app)
            custom_claims = user.custom_claims or {}
            return custom_claims.get("projects", [])
            
        except Exception as e:
            logger.error("Error getting user projects", uid=uid, error=str(e))
            return []
    
    async def add_user_to_project(self, uid: str, project_id: str) -> bool:
        """Add user to project access list."""
        try:
            user = auth.get_user(uid, app=self._firebase_app)
            custom_claims = user.custom_claims or {}
            projects = custom_claims.get("projects", [])
            
            if project_id not in projects:
                projects.append(project_id)
                custom_claims["projects"] = projects
                auth.set_custom_user_claims(uid, custom_claims, app=self._firebase_app)
                
                logger.info("User added to project", uid=uid, project_id=project_id)
            
            return True
            
        except Exception as e:
            logger.error(
                "Error adding user to project",
                uid=uid,
                project_id=project_id,
                error=str(e),
            )
            return False
