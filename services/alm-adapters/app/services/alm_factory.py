"""ALM Factory for creating and managing ALM tool adapters."""

import json
from typing import Dict, Optional

import structlog
from google.cloud import secretmanager

from app.config import get_settings
from app.services.adapters.azure_devops_adapter import AzureDevOpsAdapter
from app.services.adapters.jira_adapter import JiraAdapter
from app.services.adapters.polarion_adapter import PolarionAdapter
from app.services.base_adapter import BaseALMAdapter

logger = structlog.get_logger(__name__)


class ALMFactory:
    """Factory for creating and managing ALM tool adapters."""
    
    def __init__(self):
        self.settings = get_settings()
        self.secret_client = secretmanager.SecretManagerServiceClient()
        self.adapters: Dict[str, BaseALMAdapter] = {}
        self.configurations: Dict[str, Dict] = {}
    
    async def initialize(self):
        """Initialize the ALM factory and load configurations."""
        try:
            logger.info("Initializing ALM Factory")
            
            # Load configurations for all ALM tools
            await self._load_configurations()
            
            # Initialize adapters for configured tools
            await self._initialize_adapters()
            
            logger.info(
                "ALM Factory initialized successfully",
                available_adapters=list(self.adapters.keys()),
            )
            
        except Exception as e:
            logger.error("Failed to initialize ALM Factory", error=str(e))
            raise
    
    async def _load_configurations(self):
        """Load configurations for all ALM tools from Secret Manager."""
        try:
            # Load Jira configuration
            try:
                jira_config = await self._get_secret(self.settings.jira_config_secret)
                if jira_config:
                    self.configurations["jira"] = jira_config
                    logger.info("Jira configuration loaded")
            except Exception as e:
                logger.warning("Failed to load Jira configuration", error=str(e))
            
            # Load Azure DevOps configuration
            try:
                azure_config = await self._get_secret(self.settings.azure_devops_config_secret)
                if azure_config:
                    self.configurations["azure_devops"] = azure_config
                    logger.info("Azure DevOps configuration loaded")
            except Exception as e:
                logger.warning("Failed to load Azure DevOps configuration", error=str(e))
            
            # Load Polarion configuration
            try:
                polarion_config = await self._get_secret(self.settings.polarion_config_secret)
                if polarion_config:
                    self.configurations["polarion"] = polarion_config
                    logger.info("Polarion configuration loaded")
            except Exception as e:
                logger.warning("Failed to load Polarion configuration", error=str(e))
            
        except Exception as e:
            logger.error("Failed to load ALM configurations", error=str(e))
            raise
    
    async def _get_secret(self, secret_name: str) -> Optional[Dict]:
        """Get secret from Secret Manager."""
        try:
            secret_path = f"projects/{self.settings.project_id}/secrets/{secret_name}/versions/latest"
            response = self.secret_client.access_secret_version(request={"name": secret_path})
            
            secret_data = response.payload.data.decode("UTF-8")
            return json.loads(secret_data)
            
        except Exception as e:
            logger.error(f"Failed to get secret {secret_name}", error=str(e))
            return None
    
    async def _initialize_adapters(self):
        """Initialize adapters for configured ALM tools."""
        try:
            # Initialize Jira adapter
            if "jira" in self.configurations:
                jira_adapter = JiraAdapter(self.configurations["jira"])
                await jira_adapter.initialize()
                self.adapters["jira"] = jira_adapter
                logger.info("Jira adapter initialized")
            
            # Initialize Azure DevOps adapter
            if "azure_devops" in self.configurations:
                azure_adapter = AzureDevOpsAdapter(self.configurations["azure_devops"])
                await azure_adapter.initialize()
                self.adapters["azure_devops"] = azure_adapter
                logger.info("Azure DevOps adapter initialized")
            
            # Initialize Polarion adapter
            if "polarion" in self.configurations:
                polarion_adapter = PolarionAdapter(self.configurations["polarion"])
                await polarion_adapter.initialize()
                self.adapters["polarion"] = polarion_adapter
                logger.info("Polarion adapter initialized")
            
        except Exception as e:
            logger.error("Failed to initialize ALM adapters", error=str(e))
            raise
    
    def get_adapter(self, alm_type: str) -> Optional[BaseALMAdapter]:
        """Get an ALM adapter by type."""
        return self.adapters.get(alm_type.lower())
    
    def get_available_adapters(self) -> Dict[str, str]:
        """Get list of available ALM adapters."""
        return {
            alm_type: adapter.get_info()["name"]
            for alm_type, adapter in self.adapters.items()
        }
    
    async def test_connection(self, alm_type: str) -> Dict:
        """Test connection to an ALM tool."""
        try:
            adapter = self.get_adapter(alm_type)
            if not adapter:
                return {
                    "success": False,
                    "error": f"Adapter for {alm_type} not available",
                }
            
            result = await adapter.test_connection()
            
            logger.info(
                "ALM connection tested",
                alm_type=alm_type,
                success=result.get("success", False),
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to test {alm_type} connection", error=str(e))
            return {
                "success": False,
                "error": str(e),
            }
    
    async def sync_project(
        self,
        alm_type: str,
        project_id: str,
        sync_config: Dict,
    ) -> Dict:
        """Synchronize a project with an ALM tool."""
        try:
            adapter = self.get_adapter(alm_type)
            if not adapter:
                return {
                    "success": False,
                    "error": f"Adapter for {alm_type} not available",
                }
            
            result = await adapter.sync_project(project_id, sync_config)
            
            logger.info(
                "Project synchronized with ALM",
                alm_type=alm_type,
                project_id=project_id,
                success=result.get("success", False),
                synced_items=result.get("synced_items", 0),
            )
            
            return result
            
        except Exception as e:
            logger.error(
                f"Failed to sync project with {alm_type}",
                project_id=project_id,
                error=str(e),
            )
            return {
                "success": False,
                "error": str(e),
            }
    
    async def create_item(
        self,
        alm_type: str,
        item_type: str,
        item_data: Dict,
        project_config: Dict,
    ) -> Dict:
        """Create an item in an ALM tool."""
        try:
            adapter = self.get_adapter(alm_type)
            if not adapter:
                return {
                    "success": False,
                    "error": f"Adapter for {alm_type} not available",
                }
            
            result = await adapter.create_item(item_type, item_data, project_config)
            
            logger.info(
                "Item created in ALM",
                alm_type=alm_type,
                item_type=item_type,
                success=result.get("success", False),
                item_id=result.get("item_id"),
            )
            
            return result
            
        except Exception as e:
            logger.error(
                f"Failed to create item in {alm_type}",
                item_type=item_type,
                error=str(e),
            )
            return {
                "success": False,
                "error": str(e),
            }
    
    async def update_item(
        self,
        alm_type: str,
        item_id: str,
        item_data: Dict,
        project_config: Dict,
    ) -> Dict:
        """Update an item in an ALM tool."""
        try:
            adapter = self.get_adapter(alm_type)
            if not adapter:
                return {
                    "success": False,
                    "error": f"Adapter for {alm_type} not available",
                }
            
            result = await adapter.update_item(item_id, item_data, project_config)
            
            logger.info(
                "Item updated in ALM",
                alm_type=alm_type,
                item_id=item_id,
                success=result.get("success", False),
            )
            
            return result
            
        except Exception as e:
            logger.error(
                f"Failed to update item in {alm_type}",
                item_id=item_id,
                error=str(e),
            )
            return {
                "success": False,
                "error": str(e),
            }
    
    async def get_item(
        self,
        alm_type: str,
        item_id: str,
        project_config: Dict,
    ) -> Dict:
        """Get an item from an ALM tool."""
        try:
            adapter = self.get_adapter(alm_type)
            if not adapter:
                return {
                    "success": False,
                    "error": f"Adapter for {alm_type} not available",
                }
            
            result = await adapter.get_item(item_id, project_config)
            
            logger.info(
                "Item retrieved from ALM",
                alm_type=alm_type,
                item_id=item_id,
                success=result.get("success", False),
            )
            
            return result
            
        except Exception as e:
            logger.error(
                f"Failed to get item from {alm_type}",
                item_id=item_id,
                error=str(e),
            )
            return {
                "success": False,
                "error": str(e),
            }
    
    async def query_items(
        self,
        alm_type: str,
        query: Dict,
        project_config: Dict,
    ) -> Dict:
        """Query items from an ALM tool."""
        try:
            adapter = self.get_adapter(alm_type)
            if not adapter:
                return {
                    "success": False,
                    "error": f"Adapter for {alm_type} not available",
                }
            
            result = await adapter.query_items(query, project_config)
            
            logger.info(
                "Items queried from ALM",
                alm_type=alm_type,
                success=result.get("success", False),
                item_count=len(result.get("items", [])),
            )
            
            return result
            
        except Exception as e:
            logger.error(
                f"Failed to query items from {alm_type}",
                error=str(e),
            )
            return {
                "success": False,
                "error": str(e),
            }
    
    async def get_health_status(self) -> Dict:
        """Get health status of all ALM adapters."""
        try:
            health_status = {
                "overall_healthy": True,
                "adapters": {},
            }
            
            for alm_type, adapter in self.adapters.items():
                try:
                    adapter_health = await adapter.health_check()
                    health_status["adapters"][alm_type] = adapter_health
                    
                    if not adapter_health.get("healthy", False):
                        health_status["overall_healthy"] = False
                        
                except Exception as e:
                    health_status["adapters"][alm_type] = {
                        "healthy": False,
                        "error": str(e),
                    }
                    health_status["overall_healthy"] = False
            
            return health_status
            
        except Exception as e:
            logger.error("Failed to get ALM health status", error=str(e))
            return {
                "overall_healthy": False,
                "error": str(e),
            }
    
    async def cleanup(self):
        """Cleanup resources and close connections."""
        try:
            logger.info("Cleaning up ALM Factory")
            
            for alm_type, adapter in self.adapters.items():
                try:
                    await adapter.cleanup()
                    logger.info(f"Cleaned up {alm_type} adapter")
                except Exception as e:
                    logger.error(f"Failed to cleanup {alm_type} adapter", error=str(e))
            
            self.adapters.clear()
            self.configurations.clear()
            
            logger.info("ALM Factory cleanup completed")
            
        except Exception as e:
            logger.error("Failed to cleanup ALM Factory", error=str(e))
