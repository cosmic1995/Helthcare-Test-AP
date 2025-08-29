"""Base class for ALM tool adapters."""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional

import structlog

logger = structlog.get_logger(__name__)


class BaseALMAdapter(ABC):
    """Abstract base class for ALM tool adapters."""
    
    def __init__(self, config: Dict):
        self.config = config
        self.name = self.__class__.__name__
        self.initialized = False
    
    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize the adapter with configuration."""
        pass
    
    @abstractmethod
    async def test_connection(self) -> Dict:
        """Test connection to the ALM tool."""
        pass
    
    @abstractmethod
    async def health_check(self) -> Dict:
        """Check health status of the ALM tool connection."""
        pass
    
    @abstractmethod
    async def get_info(self) -> Dict:
        """Get information about the ALM tool and adapter."""
        pass
    
    @abstractmethod
    async def sync_project(self, project_id: str, sync_config: Dict) -> Dict:
        """Synchronize a project with the ALM tool."""
        pass
    
    @abstractmethod
    async def create_item(self, item_type: str, item_data: Dict, project_config: Dict) -> Dict:
        """Create an item in the ALM tool."""
        pass
    
    @abstractmethod
    async def update_item(self, item_id: str, item_data: Dict, project_config: Dict) -> Dict:
        """Update an item in the ALM tool."""
        pass
    
    @abstractmethod
    async def get_item(self, item_id: str, project_config: Dict) -> Dict:
        """Get an item from the ALM tool."""
        pass
    
    @abstractmethod
    async def delete_item(self, item_id: str, project_config: Dict) -> Dict:
        """Delete an item from the ALM tool."""
        pass
    
    @abstractmethod
    async def query_items(self, query: Dict, project_config: Dict) -> Dict:
        """Query items from the ALM tool."""
        pass
    
    @abstractmethod
    async def get_projects(self) -> Dict:
        """Get list of available projects."""
        pass
    
    @abstractmethod
    async def get_item_types(self, project_config: Dict) -> Dict:
        """Get available item types for a project."""
        pass
    
    @abstractmethod
    async def get_fields(self, item_type: str, project_config: Dict) -> Dict:
        """Get available fields for an item type."""
        pass
    
    @abstractmethod
    async def get_workflows(self, item_type: str, project_config: Dict) -> Dict:
        """Get available workflows for an item type."""
        pass
    
    @abstractmethod
    async def create_link(self, source_id: str, target_id: str, link_type: str, project_config: Dict) -> Dict:
        """Create a link between two items."""
        pass
    
    @abstractmethod
    async def get_links(self, item_id: str, project_config: Dict) -> Dict:
        """Get links for an item."""
        pass
    
    @abstractmethod
    async def upload_attachment(self, item_id: str, file_data: bytes, filename: str, project_config: Dict) -> Dict:
        """Upload an attachment to an item."""
        pass
    
    @abstractmethod
    async def get_attachments(self, item_id: str, project_config: Dict) -> Dict:
        """Get attachments for an item."""
        pass
    
    @abstractmethod
    async def cleanup(self):
        """Cleanup resources and close connections."""
        pass
    
    # Common utility methods
    
    def validate_config(self, required_fields: List[str]) -> bool:
        """Validate that required configuration fields are present."""
        try:
            for field in required_fields:
                if field not in self.config or not self.config[field]:
                    logger.error(f"Missing required configuration field: {field}")
                    return False
            return True
        except Exception as e:
            logger.error("Configuration validation failed", error=str(e))
            return False
    
    def map_fields(self, source_data: Dict, field_mapping: Dict) -> Dict:
        """Map fields from source format to target format."""
        try:
            mapped_data = {}
            
            for source_field, target_field in field_mapping.items():
                if source_field in source_data:
                    value = source_data[source_field]
                    
                    # Handle nested field mapping
                    if isinstance(target_field, dict):
                        if "field" in target_field:
                            mapped_field = target_field["field"]
                            
                            # Apply transformation if specified
                            if "transform" in target_field:
                                transform_func = target_field["transform"]
                                if callable(transform_func):
                                    value = transform_func(value)
                            
                            mapped_data[mapped_field] = value
                    else:
                        mapped_data[target_field] = value
            
            return mapped_data
            
        except Exception as e:
            logger.error("Field mapping failed", error=str(e))
            return {}
    
    def format_error_response(self, error: str, details: Dict = None) -> Dict:
        """Format a standard error response."""
        response = {
            "success": False,
            "error": error,
            "adapter": self.name,
        }
        
        if details:
            response["details"] = details
        
        return response
    
    def format_success_response(self, data: Dict = None, message: str = None) -> Dict:
        """Format a standard success response."""
        response = {
            "success": True,
            "adapter": self.name,
        }
        
        if message:
            response["message"] = message
        
        if data:
            response.update(data)
        
        return response
    
    async def retry_operation(self, operation, max_retries: int = 3, delay: float = 1.0):
        """Retry an operation with exponential backoff."""
        import asyncio
        
        for attempt in range(max_retries):
            try:
                return await operation()
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                
                wait_time = delay * (2 ** attempt)
                logger.warning(
                    f"Operation failed, retrying in {wait_time}s",
                    attempt=attempt + 1,
                    max_retries=max_retries,
                    error=str(e),
                )
                await asyncio.sleep(wait_time)
    
    def sanitize_data(self, data: Dict) -> Dict:
        """Sanitize data by removing sensitive information."""
        sensitive_fields = ["password", "token", "secret", "key", "auth"]
        
        sanitized = {}
        for key, value in data.items():
            if any(sensitive in key.lower() for sensitive in sensitive_fields):
                sanitized[key] = "***REDACTED***"
            elif isinstance(value, dict):
                sanitized[key] = self.sanitize_data(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    self.sanitize_data(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        
        return sanitized
