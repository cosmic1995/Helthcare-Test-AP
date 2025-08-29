"""Jira ALM adapter implementation."""

import json
from typing import Dict, List, Optional

import structlog
from jira import JIRA
from jira.exceptions import JIRAError

from app.config import get_settings
from app.services.base_adapter import BaseALMAdapter

logger = structlog.get_logger(__name__)


class JiraAdapter(BaseALMAdapter):
    """Jira ALM tool adapter."""
    
    def __init__(self, config: Dict):
        super().__init__(config)
        self.jira_client: Optional[JIRA] = None
        self.settings = get_settings()
    
    async def initialize(self) -> bool:
        """Initialize the Jira adapter."""
        try:
            required_fields = ["server", "username", "api_token"]
            if not self.validate_config(required_fields):
                return False
            
            # Initialize Jira client
            options = {
                "server": self.config["server"],
                "verify": self.config.get("verify_ssl", True),
            }
            
            self.jira_client = JIRA(
                options=options,
                basic_auth=(self.config["username"], self.config["api_token"]),
            )
            
            # Test connection
            test_result = await self.test_connection()
            if not test_result.get("success"):
                logger.error("Jira connection test failed", error=test_result.get("error"))
                return False
            
            self.initialized = True
            logger.info("Jira adapter initialized successfully")
            return True
            
        except Exception as e:
            logger.error("Failed to initialize Jira adapter", error=str(e))
            return False
    
    async def test_connection(self) -> Dict:
        """Test connection to Jira."""
        try:
            if not self.jira_client:
                return self.format_error_response("Jira client not initialized")
            
            # Test by getting server info
            server_info = self.jira_client.server_info()
            
            return self.format_success_response({
                "server_info": {
                    "version": server_info.get("version"),
                    "server_title": server_info.get("serverTitle"),
                    "base_url": server_info.get("baseUrl"),
                },
                "connection_status": "connected",
            })
            
        except JIRAError as e:
            logger.error("Jira connection test failed", error=str(e))
            return self.format_error_response(f"Jira connection failed: {str(e)}")
        except Exception as e:
            logger.error("Jira connection test error", error=str(e))
            return self.format_error_response(f"Connection test error: {str(e)}")
    
    async def health_check(self) -> Dict:
        """Check health status of Jira connection."""
        try:
            if not self.jira_client:
                return {"healthy": False, "error": "Client not initialized"}
            
            # Quick health check by getting current user
            current_user = self.jira_client.current_user()
            
            return {
                "healthy": True,
                "user": current_user,
                "server": self.config["server"],
            }
            
        except Exception as e:
            logger.error("Jira health check failed", error=str(e))
            return {"healthy": False, "error": str(e)}
    
    async def get_info(self) -> Dict:
        """Get information about Jira and adapter."""
        return {
            "name": "Jira Adapter",
            "version": "1.0.0",
            "alm_type": "jira",
            "server": self.config.get("server", ""),
            "api_version": self.settings.jira_api_version,
            "capabilities": [
                "issues", "projects", "workflows", "fields", "links",
                "attachments", "comments", "transitions"
            ],
        }
    
    async def sync_project(self, project_id: str, sync_config: Dict) -> Dict:
        """Synchronize a project with Jira."""
        try:
            if not self.jira_client:
                return self.format_error_response("Jira client not initialized")
            
            jira_project_key = sync_config.get("jira_project_key")
            if not jira_project_key:
                return self.format_error_response("Jira project key not specified in sync config")
            
            # Get Jira project
            try:
                jira_project = self.jira_client.project(jira_project_key)
            except JIRAError as e:
                return self.format_error_response(f"Jira project not found: {str(e)}")
            
            # Sync requirements as Jira issues
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
                    result = await self._sync_requirement_to_issue(
                        requirement, jira_project_key, sync_config
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
            logger.error("Jira project sync failed", error=str(e))
            return self.format_error_response(f"Project sync failed: {str(e)}")
    
    async def _sync_requirement_to_issue(
        self, requirement: Dict, project_key: str, sync_config: Dict
    ) -> Dict:
        """Sync a requirement to a Jira issue."""
        try:
            # Check if issue already exists
            jira_issue_key = requirement.get("jira_issue_key")
            
            if jira_issue_key:
                # Update existing issue
                return await self._update_jira_issue(jira_issue_key, requirement, sync_config)
            else:
                # Create new issue
                return await self._create_jira_issue(project_key, requirement, sync_config)
            
        except Exception as e:
            logger.error("Requirement sync failed", error=str(e))
            return {"success": False, "error": str(e)}
    
    async def _create_jira_issue(
        self, project_key: str, requirement: Dict, sync_config: Dict
    ) -> Dict:
        """Create a new Jira issue from a requirement."""
        try:
            # Map requirement to Jira issue fields
            issue_data = {
                "project": {"key": project_key},
                "summary": requirement.get("title", requirement.get("text", "")[:100]),
                "description": requirement.get("text", ""),
                "issuetype": {"name": sync_config.get("issue_type", "Story")},
            }
            
            # Add custom fields if configured
            field_mapping = sync_config.get("field_mapping", {})
            for req_field, jira_field in field_mapping.items():
                if req_field in requirement:
                    issue_data[jira_field] = requirement[req_field]
            
            # Create issue
            new_issue = self.jira_client.create_issue(fields=issue_data)
            
            logger.info(
                "Jira issue created",
                issue_key=new_issue.key,
                req_id=requirement.get("req_id"),
            )
            
            return {
                "success": True,
                "created": True,
                "issue_key": new_issue.key,
                "issue_id": new_issue.id,
            }
            
        except JIRAError as e:
            logger.error("Failed to create Jira issue", error=str(e))
            return {"success": False, "error": str(e)}
    
    async def _update_jira_issue(
        self, issue_key: str, requirement: Dict, sync_config: Dict
    ) -> Dict:
        """Update an existing Jira issue."""
        try:
            # Get existing issue
            issue = self.jira_client.issue(issue_key)
            
            # Prepare update data
            update_data = {}
            
            # Update summary if changed
            new_summary = requirement.get("title", requirement.get("text", "")[:100])
            if issue.fields.summary != new_summary:
                update_data["summary"] = new_summary
            
            # Update description if changed
            new_description = requirement.get("text", "")
            if issue.fields.description != new_description:
                update_data["description"] = new_description
            
            # Update custom fields
            field_mapping = sync_config.get("field_mapping", {})
            for req_field, jira_field in field_mapping.items():
                if req_field in requirement:
                    current_value = getattr(issue.fields, jira_field, None)
                    new_value = requirement[req_field]
                    
                    if current_value != new_value:
                        update_data[jira_field] = new_value
            
            # Update issue if there are changes
            if update_data:
                issue.update(fields=update_data)
                
                logger.info(
                    "Jira issue updated",
                    issue_key=issue_key,
                    req_id=requirement.get("req_id"),
                    updated_fields=list(update_data.keys()),
                )
            
            return {
                "success": True,
                "created": False,
                "issue_key": issue_key,
                "updated_fields": list(update_data.keys()),
            }
            
        except JIRAError as e:
            logger.error("Failed to update Jira issue", error=str(e))
            return {"success": False, "error": str(e)}
    
    async def create_item(self, item_type: str, item_data: Dict, project_config: Dict) -> Dict:
        """Create an item in Jira."""
        try:
            if not self.jira_client:
                return self.format_error_response("Jira client not initialized")
            
            project_key = project_config.get("project_key")
            if not project_key:
                return self.format_error_response("Project key not specified")
            
            # Prepare issue data
            issue_data = {
                "project": {"key": project_key},
                "issuetype": {"name": item_type},
            }
            
            # Map item data to Jira fields
            field_mapping = project_config.get("field_mapping", {})
            mapped_data = self.map_fields(item_data, field_mapping)
            issue_data.update(mapped_data)
            
            # Create issue
            new_issue = self.jira_client.create_issue(fields=issue_data)
            
            return self.format_success_response({
                "item_id": new_issue.key,
                "item_key": new_issue.key,
                "item_url": f"{self.config['server']}/browse/{new_issue.key}",
            })
            
        except JIRAError as e:
            logger.error("Failed to create Jira item", error=str(e))
            return self.format_error_response(f"Failed to create item: {str(e)}")
    
    async def update_item(self, item_id: str, item_data: Dict, project_config: Dict) -> Dict:
        """Update an item in Jira."""
        try:
            if not self.jira_client:
                return self.format_error_response("Jira client not initialized")
            
            # Get issue
            issue = self.jira_client.issue(item_id)
            
            # Map item data to Jira fields
            field_mapping = project_config.get("field_mapping", {})
            mapped_data = self.map_fields(item_data, field_mapping)
            
            # Update issue
            issue.update(fields=mapped_data)
            
            return self.format_success_response({
                "item_id": item_id,
                "updated_fields": list(mapped_data.keys()),
            })
            
        except JIRAError as e:
            logger.error("Failed to update Jira item", error=str(e))
            return self.format_error_response(f"Failed to update item: {str(e)}")
    
    async def get_item(self, item_id: str, project_config: Dict) -> Dict:
        """Get an item from Jira."""
        try:
            if not self.jira_client:
                return self.format_error_response("Jira client not initialized")
            
            # Get issue
            issue = self.jira_client.issue(item_id, expand="changelog")
            
            # Convert issue to standard format
            item_data = {
                "id": issue.key,
                "key": issue.key,
                "summary": issue.fields.summary,
                "description": issue.fields.description or "",
                "status": issue.fields.status.name,
                "issue_type": issue.fields.issuetype.name,
                "priority": issue.fields.priority.name if issue.fields.priority else None,
                "assignee": issue.fields.assignee.displayName if issue.fields.assignee else None,
                "reporter": issue.fields.reporter.displayName if issue.fields.reporter else None,
                "created": issue.fields.created,
                "updated": issue.fields.updated,
                "url": f"{self.config['server']}/browse/{issue.key}",
            }
            
            return self.format_success_response({"item": item_data})
            
        except JIRAError as e:
            logger.error("Failed to get Jira item", error=str(e))
            return self.format_error_response(f"Failed to get item: {str(e)}")
    
    async def delete_item(self, item_id: str, project_config: Dict) -> Dict:
        """Delete an item from Jira."""
        try:
            if not self.jira_client:
                return self.format_error_response("Jira client not initialized")
            
            # Get and delete issue
            issue = self.jira_client.issue(item_id)
            issue.delete()
            
            return self.format_success_response({"item_id": item_id})
            
        except JIRAError as e:
            logger.error("Failed to delete Jira item", error=str(e))
            return self.format_error_response(f"Failed to delete item: {str(e)}")
    
    async def query_items(self, query: Dict, project_config: Dict) -> Dict:
        """Query items from Jira."""
        try:
            if not self.jira_client:
                return self.format_error_response("Jira client not initialized")
            
            # Build JQL query
            jql_parts = []
            
            project_key = project_config.get("project_key")
            if project_key:
                jql_parts.append(f"project = {project_key}")
            
            # Add query conditions
            if "issue_type" in query:
                jql_parts.append(f"issuetype = '{query['issue_type']}'")
            
            if "status" in query:
                jql_parts.append(f"status = '{query['status']}'")
            
            if "text_search" in query:
                jql_parts.append(f"text ~ '{query['text_search']}'")
            
            jql_query = " AND ".join(jql_parts) if jql_parts else "project is not EMPTY"
            
            # Execute search
            max_results = query.get("max_results", self.settings.jira_max_results)
            issues = self.jira_client.search_issues(jql_query, maxResults=max_results)
            
            # Convert issues to standard format
            items = []
            for issue in issues:
                item_data = {
                    "id": issue.key,
                    "key": issue.key,
                    "summary": issue.fields.summary,
                    "status": issue.fields.status.name,
                    "issue_type": issue.fields.issuetype.name,
                    "created": issue.fields.created,
                    "updated": issue.fields.updated,
                }
                items.append(item_data)
            
            return self.format_success_response({
                "items": items,
                "total": len(items),
                "jql_query": jql_query,
            })
            
        except JIRAError as e:
            logger.error("Failed to query Jira items", error=str(e))
            return self.format_error_response(f"Failed to query items: {str(e)}")
    
    async def get_projects(self) -> Dict:
        """Get list of available Jira projects."""
        try:
            if not self.jira_client:
                return self.format_error_response("Jira client not initialized")
            
            projects = self.jira_client.projects()
            
            project_list = []
            for project in projects:
                project_data = {
                    "id": project.id,
                    "key": project.key,
                    "name": project.name,
                    "description": getattr(project, "description", ""),
                    "lead": project.lead.displayName if project.lead else None,
                }
                project_list.append(project_data)
            
            return self.format_success_response({"projects": project_list})
            
        except JIRAError as e:
            logger.error("Failed to get Jira projects", error=str(e))
            return self.format_error_response(f"Failed to get projects: {str(e)}")
    
    async def get_item_types(self, project_config: Dict) -> Dict:
        """Get available item types for a Jira project."""
        try:
            if not self.jira_client:
                return self.format_error_response("Jira client not initialized")
            
            project_key = project_config.get("project_key")
            if not project_key:
                return self.format_error_response("Project key not specified")
            
            # Get issue types for project
            project = self.jira_client.project(project_key)
            issue_types = project.issueTypes
            
            types = []
            for issue_type in issue_types:
                type_data = {
                    "id": issue_type.id,
                    "name": issue_type.name,
                    "description": getattr(issue_type, "description", ""),
                    "subtask": getattr(issue_type, "subtask", False),
                }
                types.append(type_data)
            
            return self.format_success_response({"item_types": types})
            
        except JIRAError as e:
            logger.error("Failed to get Jira item types", error=str(e))
            return self.format_error_response(f"Failed to get item types: {str(e)}")
    
    async def get_fields(self, item_type: str, project_config: Dict) -> Dict:
        """Get available fields for a Jira issue type."""
        try:
            if not self.jira_client:
                return self.format_error_response("Jira client not initialized")
            
            # Get all fields
            fields = self.jira_client.fields()
            
            field_list = []
            for field in fields:
                field_data = {
                    "id": field["id"],
                    "name": field["name"],
                    "custom": field.get("custom", False),
                    "schema": field.get("schema", {}),
                }
                field_list.append(field_data)
            
            return self.format_success_response({"fields": field_list})
            
        except JIRAError as e:
            logger.error("Failed to get Jira fields", error=str(e))
            return self.format_error_response(f"Failed to get fields: {str(e)}")
    
    async def get_workflows(self, item_type: str, project_config: Dict) -> Dict:
        """Get available workflows for a Jira issue type."""
        try:
            if not self.jira_client:
                return self.format_error_response("Jira client not initialized")
            
            # Get transitions (workflow steps)
            # This is a simplified implementation
            statuses = self.jira_client.statuses()
            
            workflow_data = []
            for status in statuses:
                status_data = {
                    "id": status.id,
                    "name": status.name,
                    "description": getattr(status, "description", ""),
                    "category": status.statusCategory.name if status.statusCategory else None,
                }
                workflow_data.append(status_data)
            
            return self.format_success_response({"workflows": workflow_data})
            
        except JIRAError as e:
            logger.error("Failed to get Jira workflows", error=str(e))
            return self.format_error_response(f"Failed to get workflows: {str(e)}")
    
    async def create_link(self, source_id: str, target_id: str, link_type: str, project_config: Dict) -> Dict:
        """Create a link between two Jira issues."""
        try:
            if not self.jira_client:
                return self.format_error_response("Jira client not initialized")
            
            # Create issue link
            self.jira_client.create_issue_link(
                type=link_type,
                inwardIssue=source_id,
                outwardIssue=target_id,
            )
            
            return self.format_success_response({
                "source_id": source_id,
                "target_id": target_id,
                "link_type": link_type,
            })
            
        except JIRAError as e:
            logger.error("Failed to create Jira link", error=str(e))
            return self.format_error_response(f"Failed to create link: {str(e)}")
    
    async def get_links(self, item_id: str, project_config: Dict) -> Dict:
        """Get links for a Jira issue."""
        try:
            if not self.jira_client:
                return self.format_error_response("Jira client not initialized")
            
            # Get issue with links
            issue = self.jira_client.issue(item_id, fields="issuelinks")
            
            links = []
            for link in issue.fields.issuelinks:
                link_data = {
                    "id": link.id,
                    "type": link.type.name,
                }
                
                if hasattr(link, "outwardIssue"):
                    link_data["direction"] = "outward"
                    link_data["linked_issue"] = {
                        "key": link.outwardIssue.key,
                        "summary": link.outwardIssue.fields.summary,
                    }
                elif hasattr(link, "inwardIssue"):
                    link_data["direction"] = "inward"
                    link_data["linked_issue"] = {
                        "key": link.inwardIssue.key,
                        "summary": link.inwardIssue.fields.summary,
                    }
                
                links.append(link_data)
            
            return self.format_success_response({"links": links})
            
        except JIRAError as e:
            logger.error("Failed to get Jira links", error=str(e))
            return self.format_error_response(f"Failed to get links: {str(e)}")
    
    async def upload_attachment(self, item_id: str, file_data: bytes, filename: str, project_config: Dict) -> Dict:
        """Upload an attachment to a Jira issue."""
        try:
            if not self.jira_client:
                return self.format_error_response("Jira client not initialized")
            
            # Get issue
            issue = self.jira_client.issue(item_id)
            
            # Upload attachment
            attachment = self.jira_client.add_attachment(
                issue=issue,
                attachment=file_data,
                filename=filename,
            )
            
            return self.format_success_response({
                "attachment_id": attachment.id,
                "filename": attachment.filename,
                "size": attachment.size,
                "content_type": attachment.mimeType,
            })
            
        except JIRAError as e:
            logger.error("Failed to upload Jira attachment", error=str(e))
            return self.format_error_response(f"Failed to upload attachment: {str(e)}")
    
    async def get_attachments(self, item_id: str, project_config: Dict) -> Dict:
        """Get attachments for a Jira issue."""
        try:
            if not self.jira_client:
                return self.format_error_response("Jira client not initialized")
            
            # Get issue with attachments
            issue = self.jira_client.issue(item_id, fields="attachment")
            
            attachments = []
            for attachment in issue.fields.attachment:
                attachment_data = {
                    "id": attachment.id,
                    "filename": attachment.filename,
                    "size": attachment.size,
                    "content_type": attachment.mimeType,
                    "created": attachment.created,
                    "author": attachment.author.displayName,
                    "content_url": attachment.content,
                }
                attachments.append(attachment_data)
            
            return self.format_success_response({"attachments": attachments})
            
        except JIRAError as e:
            logger.error("Failed to get Jira attachments", error=str(e))
            return self.format_error_response(f"Failed to get attachments: {str(e)}")
    
    async def cleanup(self):
        """Cleanup Jira adapter resources."""
        try:
            if self.jira_client:
                # Jira client doesn't require explicit cleanup
                self.jira_client = None
            
            self.initialized = False
            logger.info("Jira adapter cleanup completed")
            
        except Exception as e:
            logger.error("Jira adapter cleanup failed", error=str(e))
