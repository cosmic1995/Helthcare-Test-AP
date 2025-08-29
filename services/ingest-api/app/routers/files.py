"""File upload and management endpoints."""

import uuid
from datetime import datetime
from typing import Dict, List, Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.config import get_settings

logger = structlog.get_logger(__name__)

router = APIRouter()


class UploadRequest(BaseModel):
    """Request model for file upload."""
    filename: str = Field(..., description="Original filename")
    content_type: str = Field(..., description="MIME type of the file")
    size: int = Field(..., description="File size in bytes", gt=0)
    project_id: str = Field(..., description="Project ID")


class UploadResponse(BaseModel):
    """Response model for file upload."""
    upload_id: str = Field(..., description="Unique upload identifier")
    signed_url: str = Field(..., description="Signed URL for upload")
    expires_at: str = Field(..., description="URL expiration time")


class CommitUploadRequest(BaseModel):
    """Request model for committing an upload."""
    upload_id: str = Field(..., description="Upload identifier")
    project_id: str = Field(..., description="Project ID")
    enable_dlp: bool = Field(default=True, description="Enable DLP processing")


class FileInfo(BaseModel):
    """File information model."""
    name: str
    size: int
    content_type: str
    created: Optional[str]
    updated: Optional[str]
    metadata: Dict


def get_current_user(request: Request) -> Dict:
    """Get current user from request state."""
    if not hasattr(request.state, "user"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return request.state.user


@router.post("/upload", response_model=UploadResponse)
async def request_upload(
    upload_request: UploadRequest,
    request: Request,
    current_user: Dict = Depends(get_current_user),
):
    """Request a signed URL for file upload."""
    try:
        settings = get_settings()
        
        # Validate file type
        if upload_request.content_type not in settings.supported_file_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {upload_request.content_type}",
            )
        
        # Validate file size
        if upload_request.size > settings.max_file_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed: {settings.max_file_size} bytes",
            )
        
        # Check user access to project
        user_projects = current_user.get("projects", [])
        if upload_request.project_id not in user_projects and "admin" not in current_user.get("roles", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to project",
            )
        
        # Generate signed URL
        storage_service = request.app.state.storage_service
        signed_url, file_path = await storage_service.generate_signed_upload_url(
            filename=upload_request.filename,
            content_type=upload_request.content_type,
            project_id=upload_request.project_id,
            user_id=current_user["uid"],
        )
        
        # Generate upload ID
        upload_id = str(uuid.uuid4())
        
        # Store upload metadata (in production, use Redis or database)
        # For now, we'll use the file path as the upload ID reference
        
        # Log audit event
        await request.app.state.bigquery_service.insert_audit_record({
            "user_id": current_user["uid"],
            "entity_id": upload_id,
            "entity_type": "upload",
            "action": "upload_requested",
            "details": {
                "filename": upload_request.filename,
                "project_id": upload_request.project_id,
                "file_size": upload_request.size,
            },
            "ip_address": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("user-agent", "unknown"),
        })
        
        logger.info(
            "Upload URL generated",
            upload_id=upload_id,
            filename=upload_request.filename,
            project_id=upload_request.project_id,
            user_id=current_user["uid"],
        )
        
        return UploadResponse(
            upload_id=upload_id,
            signed_url=signed_url,
            expires_at=(datetime.utcnow().replace(microsecond=0).isoformat() + "Z"),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to generate upload URL", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate upload URL",
        )


@router.post("/commit")
async def commit_upload(
    commit_request: CommitUploadRequest,
    request: Request,
    current_user: Dict = Depends(get_current_user),
):
    """Commit an upload and trigger processing."""
    try:
        # Check user access to project
        user_projects = current_user.get("projects", [])
        if commit_request.project_id not in user_projects and "admin" not in current_user.get("roles", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to project",
            )
        
        # For this implementation, we'll derive the file path from upload_id
        # In production, you'd store this mapping in Redis/database
        # This is a simplified approach for the demo
        
        # Find the uploaded file (this is simplified - in production use proper mapping)
        storage_service = request.app.state.storage_service
        
        # List recent files for the user/project to find the uploaded file
        prefix = f"{commit_request.project_id}/{current_user['uid']}/"
        files = await storage_service.list_files(prefix=prefix, limit=10)
        
        if not files:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Upload not found",
            )
        
        # Get the most recent file (simplified approach)
        latest_file = max(files, key=lambda f: f.get("created", ""))
        file_path = latest_file["name"]
        
        # Verify upload completion
        upload_complete = await storage_service.verify_upload_completion(file_path)
        if not upload_complete:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Upload not completed",
            )
        
        # Get file info
        file_info = await storage_service.get_file_info(file_path)
        if not file_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found",
            )
        
        # Calculate file hash for duplicate detection
        file_hash = await storage_service.calculate_file_hash(file_path)
        
        # Check for duplicates
        bigquery_service = request.app.state.bigquery_service
        existing_req_id = await bigquery_service.check_duplicate_file(
            file_hash, commit_request.project_id
        )
        
        if existing_req_id:
            logger.info(
                "Duplicate file detected",
                file_path=file_path,
                existing_req_id=existing_req_id,
                project_id=commit_request.project_id,
            )
            return {
                "status": "duplicate",
                "message": "File already processed",
                "existing_req_id": existing_req_id,
            }
        
        # Publish file uploaded event
        pubsub_service = request.app.state.pubsub_service
        await pubsub_service.publish_file_uploaded(
            file_path=file_path,
            project_id=commit_request.project_id,
            user_id=current_user["uid"],
            file_info=file_info,
        )
        
        # Log audit event
        await bigquery_service.insert_audit_record({
            "user_id": current_user["uid"],
            "entity_id": commit_request.upload_id,
            "entity_type": "upload",
            "action": "upload_committed",
            "details": {
                "file_path": file_path,
                "project_id": commit_request.project_id,
                "enable_dlp": commit_request.enable_dlp,
                "file_hash": file_hash,
            },
            "ip_address": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("user-agent", "unknown"),
        })
        
        logger.info(
            "Upload committed",
            upload_id=commit_request.upload_id,
            file_path=file_path,
            project_id=commit_request.project_id,
            user_id=current_user["uid"],
        )
        
        return {
            "status": "processing",
            "message": "File processing initiated",
            "file_path": file_path,
            "enable_dlp": commit_request.enable_dlp,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to commit upload", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to commit upload",
        )


@router.get("/")
async def list_files(
    request: Request,
    project_id: str,
    limit: int = 20,
    offset: int = 0,
    current_user: Dict = Depends(get_current_user),
):
    """List files for a project."""
    try:
        # Check user access to project
        user_projects = current_user.get("projects", [])
        if project_id not in user_projects and "admin" not in current_user.get("roles", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to project",
            )
        
        # Get requirements from BigQuery (which represent processed files)
        bigquery_service = request.app.state.bigquery_service
        requirements = await bigquery_service.get_requirements(
            project_id=project_id,
            limit=limit,
            offset=offset,
        )
        
        # Transform to file list format
        files = []
        for req in requirements:
            files.append({
                "req_id": req["req_id"],
                "source_uri": req["source_uri"],
                "section_path": req["section_path"],
                "created_at": req["created_at"],
                "risk_class": req["risk_class"],
                "std_tags": req["std_tags"],
                "confidence": req["confidence"],
            })
        
        return {
            "files": files,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": len(files),
                "has_more": len(files) == limit,
            },
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list files", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list files",
        )


@router.get("/{file_id}")
async def get_file(
    file_id: str,
    request: Request,
    current_user: Dict = Depends(get_current_user),
):
    """Get file details."""
    try:
        # Get file info from BigQuery
        bigquery_service = request.app.state.bigquery_service
        query = f"""
        SELECT *
        FROM `{request.app.state.bigquery_service.settings.project_id}.{request.app.state.bigquery_service.dataset_id}.requirements`
        WHERE req_id = @req_id
        LIMIT 1
        """
        
        from google.cloud import bigquery
        parameters = [
            bigquery.ScalarQueryParameter("req_id", "STRING", file_id)
        ]
        
        results = await bigquery_service.execute_query(query, parameters)
        
        if not results:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found",
            )
        
        file_data = results[0]
        
        # Check user access to project
        user_projects = current_user.get("projects", [])
        if file_data["project_id"] not in user_projects and "admin" not in current_user.get("roles", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to file",
            )
        
        return file_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get file", file_id=file_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get file",
        )
