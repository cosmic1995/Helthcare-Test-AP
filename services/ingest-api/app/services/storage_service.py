"""Google Cloud Storage service for file operations."""

import hashlib
import mimetypes
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple

import structlog
from google.cloud import storage
from google.cloud.exceptions import NotFound

from app.config import get_settings

logger = structlog.get_logger(__name__)


class StorageService:
    """Service for Google Cloud Storage operations."""
    
    def __init__(self):
        self.settings = get_settings()
        self.client = storage.Client()
        
        # Initialize buckets
        self.incoming_bucket = self.client.bucket(self.settings.incoming_bucket)
        self.processed_bucket = self.client.bucket(self.settings.processed_bucket)
        self.deidentified_bucket = self.client.bucket(self.settings.deidentified_bucket)
    
    async def health_check(self) -> bool:
        """Check if storage service is healthy."""
        try:
            # Test bucket access
            self.incoming_bucket.exists()
            self.processed_bucket.exists()
            self.deidentified_bucket.exists()
            return True
        except Exception as e:
            logger.error("Storage health check failed", error=str(e))
            return False
    
    async def generate_signed_upload_url(
        self,
        filename: str,
        content_type: str,
        project_id: str,
        user_id: str,
    ) -> Tuple[str, str]:
        """Generate a signed URL for file upload."""
        try:
            # Generate unique file path
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            file_path = f"{project_id}/{user_id}/{timestamp}_{filename}"
            
            # Create blob
            blob = self.incoming_bucket.blob(file_path)
            
            # Set metadata
            blob.metadata = {
                "project_id": project_id,
                "user_id": user_id,
                "original_filename": filename,
                "upload_timestamp": datetime.utcnow().isoformat(),
            }
            
            # Generate signed URL for upload (valid for 1 hour)
            signed_url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(hours=1),
                method="PUT",
                content_type=content_type,
            )
            
            logger.info(
                "Generated signed upload URL",
                filename=filename,
                file_path=file_path,
                project_id=project_id,
                user_id=user_id,
            )
            
            return signed_url, file_path
            
        except Exception as e:
            logger.error("Failed to generate signed URL", error=str(e))
            raise
    
    async def verify_upload_completion(self, file_path: str) -> bool:
        """Verify that a file upload was completed successfully."""
        try:
            blob = self.incoming_bucket.blob(file_path)
            return blob.exists()
        except Exception as e:
            logger.error("Failed to verify upload", file_path=file_path, error=str(e))
            return False
    
    async def get_file_info(self, file_path: str, bucket_name: str = None) -> Optional[Dict]:
        """Get information about a file."""
        try:
            if bucket_name:
                bucket = self.client.bucket(bucket_name)
            else:
                bucket = self.incoming_bucket
            
            blob = bucket.blob(file_path)
            
            if not blob.exists():
                return None
            
            # Reload to get latest metadata
            blob.reload()
            
            return {
                "name": blob.name,
                "size": blob.size,
                "content_type": blob.content_type,
                "created": blob.time_created.isoformat() if blob.time_created else None,
                "updated": blob.updated.isoformat() if blob.updated else None,
                "etag": blob.etag,
                "md5_hash": blob.md5_hash,
                "metadata": blob.metadata or {},
            }
            
        except Exception as e:
            logger.error("Failed to get file info", file_path=file_path, error=str(e))
            return None
    
    async def calculate_file_hash(self, file_path: str, bucket_name: str = None) -> Optional[str]:
        """Calculate SHA-256 hash of a file."""
        try:
            if bucket_name:
                bucket = self.client.bucket(bucket_name)
            else:
                bucket = self.incoming_bucket
            
            blob = bucket.blob(file_path)
            
            if not blob.exists():
                return None
            
            # Download file content
            content = blob.download_as_bytes()
            
            # Calculate SHA-256 hash
            sha256_hash = hashlib.sha256(content).hexdigest()
            
            logger.info(
                "Calculated file hash",
                file_path=file_path,
                hash=sha256_hash,
                size=len(content),
            )
            
            return sha256_hash
            
        except Exception as e:
            logger.error("Failed to calculate file hash", file_path=file_path, error=str(e))
            return None
    
    async def copy_file(
        self,
        source_path: str,
        dest_path: str,
        source_bucket: str = None,
        dest_bucket: str = None,
    ) -> bool:
        """Copy a file between buckets or within the same bucket."""
        try:
            # Get source bucket
            if source_bucket:
                src_bucket = self.client.bucket(source_bucket)
            else:
                src_bucket = self.incoming_bucket
            
            # Get destination bucket
            if dest_bucket:
                dst_bucket = self.client.bucket(dest_bucket)
            else:
                dst_bucket = self.processed_bucket
            
            # Copy file
            source_blob = src_bucket.blob(source_path)
            dst_bucket.copy_blob(source_blob, dst_bucket, dest_path)
            
            logger.info(
                "File copied successfully",
                source_path=source_path,
                dest_path=dest_path,
                source_bucket=src_bucket.name,
                dest_bucket=dst_bucket.name,
            )
            
            return True
            
        except Exception as e:
            logger.error(
                "Failed to copy file",
                source_path=source_path,
                dest_path=dest_path,
                error=str(e),
            )
            return False
    
    async def move_file(
        self,
        source_path: str,
        dest_path: str,
        source_bucket: str = None,
        dest_bucket: str = None,
    ) -> bool:
        """Move a file between buckets or within the same bucket."""
        try:
            # Copy file first
            success = await self.copy_file(source_path, dest_path, source_bucket, dest_bucket)
            
            if success:
                # Delete source file
                if source_bucket:
                    bucket = self.client.bucket(source_bucket)
                else:
                    bucket = self.incoming_bucket
                
                source_blob = bucket.blob(source_path)
                source_blob.delete()
                
                logger.info(
                    "File moved successfully",
                    source_path=source_path,
                    dest_path=dest_path,
                )
            
            return success
            
        except Exception as e:
            logger.error(
                "Failed to move file",
                source_path=source_path,
                dest_path=dest_path,
                error=str(e),
            )
            return False
    
    async def delete_file(self, file_path: str, bucket_name: str = None) -> bool:
        """Delete a file from storage."""
        try:
            if bucket_name:
                bucket = self.client.bucket(bucket_name)
            else:
                bucket = self.incoming_bucket
            
            blob = bucket.blob(file_path)
            blob.delete()
            
            logger.info("File deleted successfully", file_path=file_path)
            return True
            
        except NotFound:
            logger.warning("File not found for deletion", file_path=file_path)
            return True  # Consider it successful if file doesn't exist
        except Exception as e:
            logger.error("Failed to delete file", file_path=file_path, error=str(e))
            return False
    
    async def generate_signed_download_url(
        self,
        file_path: str,
        bucket_name: str = None,
        expiration_hours: int = 1,
    ) -> Optional[str]:
        """Generate a signed URL for file download."""
        try:
            if bucket_name:
                bucket = self.client.bucket(bucket_name)
            else:
                bucket = self.processed_bucket
            
            blob = bucket.blob(file_path)
            
            if not blob.exists():
                return None
            
            # Generate signed URL for download
            signed_url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(hours=expiration_hours),
                method="GET",
            )
            
            logger.info(
                "Generated signed download URL",
                file_path=file_path,
                expiration_hours=expiration_hours,
            )
            
            return signed_url
            
        except Exception as e:
            logger.error(
                "Failed to generate signed download URL",
                file_path=file_path,
                error=str(e),
            )
            return None
    
    async def list_files(
        self,
        prefix: str = "",
        bucket_name: str = None,
        limit: int = 100,
    ) -> list:
        """List files in a bucket with optional prefix filter."""
        try:
            if bucket_name:
                bucket = self.client.bucket(bucket_name)
            else:
                bucket = self.incoming_bucket
            
            blobs = bucket.list_blobs(prefix=prefix, max_results=limit)
            
            files = []
            for blob in blobs:
                files.append({
                    "name": blob.name,
                    "size": blob.size,
                    "content_type": blob.content_type,
                    "created": blob.time_created.isoformat() if blob.time_created else None,
                    "updated": blob.updated.isoformat() if blob.updated else None,
                })
            
            logger.info(
                "Listed files",
                prefix=prefix,
                bucket=bucket.name,
                count=len(files),
            )
            
            return files
            
        except Exception as e:
            logger.error("Failed to list files", prefix=prefix, error=str(e))
            return []
