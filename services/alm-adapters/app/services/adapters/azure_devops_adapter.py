"""Azure DevOps ALM adapter implementation."""

import json
from typing import Dict, List, Optional

import structlog
from azure.devops.connection import Connection
from azure.devops.credentials import BasicAuthentication
from azure.devops.v7_0.work_item_tracking.models import JsonPatchOperation, Wiql
from msrest.exceptions import ClientException

from app.config import get_settings
from app.services.base_adapter import BaseALMAdapter

logger = structlog.get_logger(__name__)


class AzureDevOpsAdapter(BaseALMAdapter):
    """Azure DevOps ALM tool adapter."""
    
    def __init__(self, config: Dict):
        super().__init__(config)
        self.connection: Optional[Connection] = None
        self.wit_client = None
        self.core_client = None
        self.settings = get_settings()
    
    async def initialize(self) -> bool:
        """Initialize the Azure DevOps adapter."""
        try:
            required_fields = ["organization_url", "personal_access_token"]
            if not self.validate_config(required_fields):
                return False
            
            # Create credentials
            credentials = BasicAuthentication('', self.config["personal_access_token"])
            
            # Create connection
            self.connection = Connection(
                base_url=self.config["organization_url"],
                creds=credentials
            )
            
            # Get clients
            self.wit_client = self.connection.clients.get_work_item_tracking_client()
            self.core_client = self.connection.clients.get_core_client()
            
            # Test connection
            test_result = await self.test_connection()
            if not test_result.get("success"):
                logger.error("Azure DevOps connection test failed", error=test_result.get("error"))
                return False
            
            self.initialized = True
            logger.info("Azure DevOps adapter initialized successfully")
            return True
            
        except Exception as e:
            logger.error("Failed to initialize Azure DevOps adapter", error=str(e))
            return False
    
    async def test_connection(self) -> Dict:
        """Test connection to Azure DevOps."""
        try:
            if not self.core_client:
                return self.format_error_response("Azure DevOps client not initialized")
            
            # Test by getting projects
            projects = self.core_client.get_projects()
            
            return self.format_success_response({
                "connection_status": "connected",
                "organization": self.config["organization_url"],
                "projects_count": len(projects),
            })
            
        except ClientException as e:
            logger.error("Azure DevOps connection test failed", error=str(e))
            return self.format_error_response(f"Azure DevOps connection failed: {str(e)}")
        except Exception as e:
            logger.error("Azure DevOps connection test error", error=str(e))
            return self.format_error_response(f"Connection test error: {str(e)}")
    
    async def health_check(self) -> Dict:
        """Check health status of Azure DevOps connection."""
        try:
            if not self.core_client:
                return {"healthy": False, "error": "Client not initialized"}
            
            # Quick health check by getting organization info
            projects = self.core_client.get_projects(top=1)
            
            return {
                "healthy": True,
                "organization": self.config["organization_url"],
                "accessible_projects": len(projects) > 0,
            }
            
        except Exception as e:
            logger.error("Azure DevOps health check failed", error=str(e))
            return {"healthy": False, "error": str(e)}
    
    async def get_info(self) -> Dict:
        """Get information about Azure DevOps and adapter."""
        return {
            "name": "Azure DevOps Adapter",
            "version": "1.0.0",
            "alm_type": "azure_devops",
            "organization": self.config.get("organization_url", ""),
            "api_version": self.settings.azure_devops_api_version,
            "capabilities": [
                "work_items", "projects", "queries", "fields", "relations",
                "attachments", "comments", "iterations", "areas"
            ],
        }
    
    async def sync_project(self, project_id: str, sync_config: Dict) -> Dict:
        """Synchronize a project with Azure DevOps."""
        try:
            if not self.wit_client:
                return self.format_error_response("Azure DevOps client not initialized")
            
            ado_project = sync_config.get("ado_project")
            if not ado_project:
                return self.format_error_response("Azure DevOps project not specified in sync config")
            
            # Verify project exists
            try:
                project = self.core_client.get_project(ado_project)
            except ClientException as e:
                return self.format_error_response(f"Azure DevOps project not found: {str(e)}")
            
            # Sync requirements as work items
            sync_results = {
                "synced_items": 0,
                "created_items": 0,
                "updated_items": 0,
                "errors": [],
            }
            
            # Get requirements from sync config
            requirements = sync_config.get("requirements", [])
            
            for requirement in requirements:
                try:
                    result = await self._sync_requirement_to_work_item(
                        requirement, ado_project, sync_config
                    )
                    
                    if result.get("success"):
                        sync_results["synced_items"] += 1
                        if result.get("created"):
                            sync_results["created_items"] += 1
                        else:
                            sync_results["updated_items"] += 1
                    else:
                        sync_results["errors"].append({
                            "req_id": requirement.get("req_id"),
                            "error": result.get("error"),
                        })
                
                except Exception as e:
                    sync_results["errors"].append({
                        "req_id": requirement.get("req_id"),
                        "error": str(e),
                    })
            
            return self.format_success_response(sync_results)
            
        except Exception as e:
            logger.error("Azure DevOps project sync failed", error=str(e))
            return self.format_error_response(f"Project sync failed: {str(e)}")
    
    async def _sync_requirement_to_work_item(
        self, requirement: Dict, project: str, sync_config: Dict
    ) -> Dict:
        """Sync a requirement to an Azure DevOps work item."""
        try:
            # Check if work item already exists
            ado_work_item_id = requirement.get("ado_work_item_id")
            
            if ado_work_item_id:
                # Update existing work item
                return await self._update_work_item(ado_work_item_id, requirement, sync_config)
            else:
                # Create new work item
                return await self._create_work_item(project, requirement, sync_config)
            
        except Exception as e:
            logger.error("Requirement sync failed", error=str(e))
            return {"success": False, "error": str(e)}
    
    async def _create_work_item(
        self, project: str, requirement: Dict, sync_config: Dict
    ) -> Dict:
        """Create a new Azure DevOps work item from a requirement."""
        try:
            work_item_type = sync_config.get("work_item_type", "User Story")
            
            # Prepare patch operations
            patch_ops = [
                JsonPatchOperation(
                    op="add",
                    path="/fields/System.Title",
                    value=requirement.get("title", requirement.get("text", "")[:100])
                ),
                JsonPatchOperation(
                    op="add",
                    path="/fields/System.Description",
                    value=requirement.get("text", "")
                ),
            ]
            
            # Add custom fields if configured
            field_mapping = sync_config.get("field_mapping", {})
            for req_field, ado_field in field_mapping.items():
                if req_field in requirement:
                    patch_ops.append(JsonPatchOperation(
                        op="add",
                        path=f"/fields/{ado_field}",
                        value=requirement[req_field]
                    ))
            
            # Create work item
            work_item = self.wit_client.create_work_item(
                document=patch_ops,
                project=project,
                type=work_item_type
            )
            
            logger.info(
                "Azure DevOps work item created",
                work_item_id=work_item.id,
                req_id=requirement.get("req_id"),
            )
            
            return {
                "success": True,
                "created": True,
                "work_item_id": work_item.id,
                "work_item_url": work_item.url,
            }
            
        except ClientException as e:
            logger.error("Failed to create Azure DevOps work item", error=str(e))
            return {"success": False, "error": str(e)}
    
    async def _update_work_item(
        self, work_item_id: int, requirement: Dict, sync_config: Dict
    ) -> Dict:
        """Update an existing Azure DevOps work item."""
        try:
            # Get existing work item
            work_item = self.wit_client.get_work_item(work_item_id)
            
            # Prepare update operations
            patch_ops = []
            
            # Update title if changed
            new_title = requirement.get("title", requirement.get("text", "")[:100])
            current_title = work_item.fields.get("System.Title", "")
            if current_title != new_title:
                patch_ops.append(JsonPatchOperation(
                    op="replace",
                    path="/fields/System.Title",
                    value=new_title
                ))
            
            # Update description if changed
            new_description = requirement.get("text", "")
            current_description = work_item.fields.get("System.Description", "")
            if current_description != new_description:
                patch_ops.append(JsonPatchOperation(
                    op="replace",
                    path="/fields/System.Description",
                    value=new_description
                ))
            
            # Update custom fields
            field_mapping = sync_config.get("field_mapping", {})
            for req_field, ado_field in field_mapping.items():
                if req_field in requirement:
                    current_value = work_item.fields.get(ado_field)
                    new_value = requirement[req_field]
                    
                    if current_value != new_value:
                        patch_ops.append(JsonPatchOperation(
                            op="replace",
                            path=f"/fields/{ado_field}",
                            value=new_value
                        ))
            
            # Update work item if there are changes
            if patch_ops:
                updated_work_item = self.wit_client.update_work_item(
                    document=patch_ops,
                    id=work_item_id
                )
                
                logger.info(
                    "Azure DevOps work item updated",
                    work_item_id=work_item_id,
                    req_id=requirement.get("req_id"),
                    updated_fields=len(patch_ops),
                )
            
            return {
                "success": True,
                "created": False,
                "work_item_id": work_item_id,
                "updated_fields": len(patch_ops),
            }
            
        except ClientException as e:
            logger.error("Failed to update Azure DevOps work item", error=str(e))
            return {"success": False, "error": str(e)}
    
    async def create_item(self, item_type: str, item_data: Dict, project_config: Dict) -> Dict:
        """Create an item in Azure DevOps."""
        try:
            if not self.wit_client:
                return self.format_error_response("Azure DevOps client not initialized")
            
            project = project_config.get("project")
            if not project:
                return self.format_error_response("Project not specified")
            
            # Map item data to Azure DevOps fields
            field_mapping = project_config.get("field_mapping", {})
            mapped_data = self.map_fields(item_data, field_mapping)
            
            # Prepare patch operations
            patch_ops = []
            for field_path, value in mapped_data.items():
                patch_ops.append(JsonPatchOperation(
                    op="add",
                    path=f"/fields/{field_path}",
                    value=value
                ))
            
            # Create work item
            work_item = self.wit_client.create_work_item(
                document=patch_ops,
                project=project,
                type=item_type
            )
            
            return self.format_success_response({
                "item_id": str(work_item.id),
                "item_url": work_item.url,
            })
            
        except ClientException as e:
            logger.error("Failed to create Azure DevOps item", error=str(e))
            return self.format_error_response(f"Failed to create item: {str(e)}")
    
    async def update_item(self, item_id: str, item_data: Dict, project_config: Dict) -> Dict:
        """Update an item in Azure DevOps."""
        try:
            if not self.wit_client:
                return self.format_error_response("Azure DevOps client not initialized")
            
            # Map item data to Azure DevOps fields
            field_mapping = project_config.get("field_mapping", {})
            mapped_data = self.map_fields(item_data, field_mapping)
            
            # Prepare patch operations
            patch_ops = []
            for field_path, value in mapped_data.items():
                patch_ops.append(JsonPatchOperation(
                    op="replace",
                    path=f"/fields/{field_path}",
                    value=value
                ))
            
            # Update work item
            work_item = self.wit_client.update_work_item(
                document=patch_ops,
                id=int(item_id)
            )
            
            return self.format_success_response({
                "item_id": item_id,
                "updated_fields": len(patch_ops),
            })
            
        except ClientException as e:
            logger.error("Failed to update Azure DevOps item", error=str(e))
            return self.format_error_response(f"Failed to update item: {str(e)}")
    
    async def get_item(self, item_id: str, project_config: Dict) -> Dict:
        """Get an item from Azure DevOps."""
        try:
            if not self.wit_client:
                return self.format_error_response("Azure DevOps client not initialized")
            
            # Get work item
            work_item = self.wit_client.get_work_item(int(item_id), expand="All")
            
            # Convert work item to standard format
            item_data = {
                "id": str(work_item.id),
                "title": work_item.fields.get("System.Title", ""),
                "description": work_item.fields.get("System.Description", ""),
                "state": work_item.fields.get("System.State", ""),
                "work_item_type": work_item.fields.get("System.WorkItemType", ""),
                "assigned_to": work_item.fields.get("System.AssignedTo", {}).get("displayName") if work_item.fields.get("System.AssignedTo") else None,
                "created_by": work_item.fields.get("System.CreatedBy", {}).get("displayName") if work_item.fields.get("System.CreatedBy") else None,
                "created_date": work_item.fields.get("System.CreatedDate"),
                "changed_date": work_item.fields.get("System.ChangedDate"),
                "url": work_item.url,
            }
            
            return self.format_success_response({"item": item_data})
            
        except ClientException as e:
            logger.error("Failed to get Azure DevOps item", error=str(e))
            return self.format_error_response(f"Failed to get item: {str(e)}")
    
    async def delete_item(self, item_id: str, project_config: Dict) -> Dict:
        """Delete an item from Azure DevOps."""
        try:
            if not self.wit_client:
                return self.format_error_response("Azure DevOps client not initialized")
            
            # Delete work item
            self.wit_client.delete_work_item(int(item_id))
            
            return self.format_success_response({"item_id": item_id})
            
        except ClientException as e:
            logger.error("Failed to delete Azure DevOps item", error=str(e))
            return self.format_error_response(f"Failed to delete item: {str(e)}")
    
    async def query_items(self, query: Dict, project_config: Dict) -> Dict:
        """Query items from Azure DevOps."""
        try:
            if not self.wit_client:
                return self.format_error_response("Azure DevOps client not initialized")
            
            project = project_config.get("project")
            if not project:
                return self.format_error_response("Project not specified")
            
            # Build WIQL query
            wiql_parts = [f"SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.TeamProject] = '{project}'"]
            
            # Add query conditions
            conditions = []
            
            if "work_item_type" in query:
                conditions.append(f"[System.WorkItemType] = '{query['work_item_type']}'")
            
            if "state" in query:
                conditions.append(f"[System.State] = '{query['state']}'")
            
            if "text_search" in query:
                conditions.append(f"[System.Title] CONTAINS '{query['text_search']}'")
            
            if conditions:
                wiql_parts.append(" AND " + " AND ".join(conditions))
            
            wiql_query = "".join(wiql_parts)
            
            # Execute query
            wiql = Wiql(query=wiql_query)
            query_result = self.wit_client.query_by_wiql(wiql)
            
            # Get work item details
            if query_result.work_items:
                work_item_ids = [wi.id for wi in query_result.work_items]
                work_items = self.wit_client.get_work_items(work_item_ids)
                
                items = []
                for work_item in work_items:
                    item_data = {
                        "id": str(work_item.id),
                        "title": work_item.fields.get("System.Title", ""),
                        "state": work_item.fields.get("System.State", ""),
                        "work_item_type": work_item.fields.get("System.WorkItemType", ""),
                        "created_date": work_item.fields.get("System.CreatedDate"),
                        "changed_date": work_item.fields.get("System.ChangedDate"),
                    }
                    items.append(item_data)
            else:
                items = []
            
            return self.format_success_response({
                "items": items,
                "total": len(items),
                "wiql_query": wiql_query,
            })
            
        except ClientException as e:
            logger.error("Failed to query Azure DevOps items", error=str(e))
            return self.format_error_response(f"Failed to query items: {str(e)}")
    
    async def get_projects(self) -> Dict:
        """Get list of available Azure DevOps projects."""
        try:
            if not self.core_client:
                return self.format_error_response("Azure DevOps client not initialized")
            
            projects = self.core_client.get_projects()
            
            project_list = []
            for project in projects:
                project_data = {
                    "id": project.id,
                    "name": project.name,
                    "description": project.description or "",
                    "state": project.state,
                    "visibility": project.visibility,
                }
                project_list.append(project_data)
            
            return self.format_success_response({"projects": project_list})
            
        except ClientException as e:
            logger.error("Failed to get Azure DevOps projects", error=str(e))
            return self.format_error_response(f"Failed to get projects: {str(e)}")
    
    async def get_item_types(self, project_config: Dict) -> Dict:
        """Get available item types for an Azure DevOps project."""
        try:
            if not self.wit_client:
                return self.format_error_response("Azure DevOps client not initialized")
            
            project = project_config.get("project")
            if not project:
                return self.format_error_response("Project not specified")
            
            # Get work item types
            work_item_types = self.wit_client.get_work_item_types(project)
            
            types = []
            for wit_type in work_item_types:
                type_data = {
                    "name": wit_type.name,
                    "description": wit_type.description or "",
                    "color": wit_type.color,
                    "icon": wit_type.icon.id if wit_type.icon else None,
                }
                types.append(type_data)
            
            return self.format_success_response({"item_types": types})
            
        except ClientException as e:
            logger.error("Failed to get Azure DevOps item types", error=str(e))
            return self.format_error_response(f"Failed to get item types: {str(e)}")
    
    async def get_fields(self, item_type: str, project_config: Dict) -> Dict:
        """Get available fields for an Azure DevOps work item type."""
        try:
            if not self.wit_client:
                return self.format_error_response("Azure DevOps client not initialized")
            
            project = project_config.get("project")
            if not project:
                return self.format_error_response("Project not specified")
            
            # Get work item type definition
            work_item_type = self.wit_client.get_work_item_type(project, item_type)
            
            fields = []
            for field_ref in work_item_type.field_instances:
                field_data = {
                    "reference_name": field_ref.reference_name,
                    "name": field_ref.name,
                    "type": field_ref.type,
                    "required": field_ref.always_required,
                    "read_only": field_ref.read_only,
                }
                fields.append(field_data)
            
            return self.format_success_response({"fields": fields})
            
        except ClientException as e:
            logger.error("Failed to get Azure DevOps fields", error=str(e))
            return self.format_error_response(f"Failed to get fields: {str(e)}")
    
    async def get_workflows(self, item_type: str, project_config: Dict) -> Dict:
        """Get available workflows for an Azure DevOps work item type."""
        try:
            if not self.wit_client:
                return self.format_error_response("Azure DevOps client not initialized")
            
            project = project_config.get("project")
            if not project:
                return self.format_error_response("Project not specified")
            
            # Get work item type definition
            work_item_type = self.wit_client.get_work_item_type(project, item_type)
            
            # Get states from transitions
            states = []
            if work_item_type.transitions:
                for transition in work_item_type.transitions:
                    if transition.to not in [s["name"] for s in states]:
                        states.append({
                            "name": transition.to,
                            "category": getattr(transition, "category", ""),
                        })
            
            return self.format_success_response({"workflows": states})
            
        except ClientException as e:
            logger.error("Failed to get Azure DevOps workflows", error=str(e))
            return self.format_error_response(f"Failed to get workflows: {str(e)}")
    
    async def create_link(self, source_id: str, target_id: str, link_type: str, project_config: Dict) -> Dict:
        """Create a link between two Azure DevOps work items."""
        try:
            if not self.wit_client:
                return self.format_error_response("Azure DevOps client not initialized")
            
            # Create relation patch operation
            patch_ops = [JsonPatchOperation(
                op="add",
                path="/relations/-",
                value={
                    "rel": link_type,
                    "url": f"{self.config['organization_url']}/_apis/wit/workItems/{target_id}",
                }
            )]
            
            # Update source work item with relation
            self.wit_client.update_work_item(
                document=patch_ops,
                id=int(source_id)
            )
            
            return self.format_success_response({
                "source_id": source_id,
                "target_id": target_id,
                "link_type": link_type,
            })
            
        except ClientException as e:
            logger.error("Failed to create Azure DevOps link", error=str(e))
            return self.format_error_response(f"Failed to create link: {str(e)}")
    
    async def get_links(self, item_id: str, project_config: Dict) -> Dict:
        """Get links for an Azure DevOps work item."""
        try:
            if not self.wit_client:
                return self.format_error_response("Azure DevOps client not initialized")
            
            # Get work item with relations
            work_item = self.wit_client.get_work_item(int(item_id), expand="Relations")
            
            links = []
            if work_item.relations:
                for relation in work_item.relations:
                    # Extract work item ID from URL
                    url_parts = relation.url.split("/")
                    linked_id = url_parts[-1] if url_parts else None
                    
                    link_data = {
                        "type": relation.rel,
                        "linked_item_id": linked_id,
                        "url": relation.url,
                    }
                    links.append(link_data)
            
            return self.format_success_response({"links": links})
            
        except ClientException as e:
            logger.error("Failed to get Azure DevOps links", error=str(e))
            return self.format_error_response(f"Failed to get links: {str(e)}")
    
    async def upload_attachment(self, item_id: str, file_data: bytes, filename: str, project_config: Dict) -> Dict:
        """Upload an attachment to an Azure DevOps work item."""
        try:
            if not self.wit_client:
                return self.format_error_response("Azure DevOps client not initialized")
            
            project = project_config.get("project")
            if not project:
                return self.format_error_response("Project not specified")
            
            # Upload attachment
            attachment_ref = self.wit_client.create_attachment(
                upload_stream=file_data,
                project=project,
                file_name=filename
            )
            
            # Add attachment to work item
            patch_ops = [JsonPatchOperation(
                op="add",
                path="/relations/-",
                value={
                    "rel": "AttachedFile",
                    "url": attachment_ref.url,
                    "attributes": {
                        "name": filename,
                    }
                }
            )]
            
            self.wit_client.update_work_item(
                document=patch_ops,
                id=int(item_id)
            )
            
            return self.format_success_response({
                "attachment_id": attachment_ref.id,
                "filename": filename,
                "url": attachment_ref.url,
            })
            
        except ClientException as e:
            logger.error("Failed to upload Azure DevOps attachment", error=str(e))
            return self.format_error_response(f"Failed to upload attachment: {str(e)}")
    
    async def get_attachments(self, item_id: str, project_config: Dict) -> Dict:
        """Get attachments for an Azure DevOps work item."""
        try:
            if not self.wit_client:
                return self.format_error_response("Azure DevOps client not initialized")
            
            # Get work item with relations
            work_item = self.wit_client.get_work_item(int(item_id), expand="Relations")
            
            attachments = []
            if work_item.relations:
                for relation in work_item.relations:
                    if relation.rel == "AttachedFile":
                        attachment_data = {
                            "url": relation.url,
                            "name": relation.attributes.get("name", "") if relation.attributes else "",
                        }
                        attachments.append(attachment_data)
            
            return self.format_success_response({"attachments": attachments})
            
        except ClientException as e:
            logger.error("Failed to get Azure DevOps attachments", error=str(e))
            return self.format_error_response(f"Failed to get attachments: {str(e)}")
    
    async def cleanup(self):
        """Cleanup Azure DevOps adapter resources."""
        try:
            if self.connection:
                # Azure DevOps connection doesn't require explicit cleanup
                self.connection = None
                self.wit_client = None
                self.core_client = None
            
            self.initialized = False
            logger.info("Azure DevOps adapter cleanup completed")
            
        except Exception as e:
            logger.error("Azure DevOps adapter cleanup failed", error=str(e))
