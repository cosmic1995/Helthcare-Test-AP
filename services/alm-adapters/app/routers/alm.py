"""ALM integration API routes."""

from typing import Dict, List, Optional

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.middleware import get_current_user
from app.services.alm_factory import ALMFactory

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/alm", tags=["ALM Integration"])

# Pydantic models for request/response
class ALMConnectionTest(BaseModel):
    alm_type: str = Field(..., description="ALM tool type (jira, azure_devops, polarion)")

class ProjectSyncRequest(BaseModel):
    alm_type: str = Field(..., description="ALM tool type")
    project_id: str = Field(..., description="Internal project ID")
    sync_config: Dict = Field(..., description="Synchronization configuration")

class ItemCreateRequest(BaseModel):
    alm_type: str = Field(..., description="ALM tool type")
    item_type: str = Field(..., description="Item type to create")
    item_data: Dict = Field(..., description="Item data")
    project_config: Dict = Field(..., description="Project configuration")

class ItemUpdateRequest(BaseModel):
    alm_type: str = Field(..., description="ALM tool type")
    item_id: str = Field(..., description="Item ID to update")
    item_data: Dict = Field(..., description="Updated item data")
    project_config: Dict = Field(..., description="Project configuration")

class ItemQueryRequest(BaseModel):
    alm_type: str = Field(..., description="ALM tool type")
    query: Dict = Field(..., description="Query parameters")
    project_config: Dict = Field(..., description="Project configuration")

class LinkCreateRequest(BaseModel):
    alm_type: str = Field(..., description="ALM tool type")
    source_id: str = Field(..., description="Source item ID")
    target_id: str = Field(..., description="Target item ID")
    link_type: str = Field(..., description="Link type")
    project_config: Dict = Field(..., description="Project configuration")

# Dependency to get ALM factory
async def get_alm_factory() -> ALMFactory:
    """Get ALM factory from app state."""
    # This would be injected from app state in a real implementation
    return ALMFactory()

@router.get("/adapters")
async def list_available_adapters(
    current_user: Dict = Depends(get_current_user),
    alm_factory: ALMFactory = Depends(get_alm_factory),
):
    """List available ALM adapters."""
    try:
        adapters = alm_factory.get_available_adapters()
        
        logger.info(
            "ALM adapters listed",
            user_id=current_user.get("uid"),
            adapter_count=len(adapters),
        )
        
        return {
            "adapters": adapters,
            "total": len(adapters),
        }
        
    except Exception as e:
        logger.error("Failed to list ALM adapters", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list adapters: {str(e)}",
        )

@router.post("/test-connection")
async def test_alm_connection(
    request: ALMConnectionTest,
    current_user: Dict = Depends(get_current_user),
    alm_factory: ALMFactory = Depends(get_alm_factory),
):
    """Test connection to an ALM tool."""
    try:
        result = await alm_factory.test_connection(request.alm_type)
        
        logger.info(
            "ALM connection tested",
            user_id=current_user.get("uid"),
            alm_type=request.alm_type,
            success=result.get("success", False),
        )
        
        return result
        
    except Exception as e:
        logger.error("Failed to test ALM connection", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test connection: {str(e)}",
        )

@router.post("/sync-project")
async def sync_project_with_alm(
    request: ProjectSyncRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user),
    alm_factory: ALMFactory = Depends(get_alm_factory),
):
    """Synchronize a project with an ALM tool."""
    try:
        # Start background sync task
        background_tasks.add_task(
            _sync_project_background,
            alm_factory=alm_factory,
            alm_type=request.alm_type,
            project_id=request.project_id,
            sync_config=request.sync_config,
            user_id=current_user.get("uid"),
        )
        
        logger.info(
            "Project sync started",
            user_id=current_user.get("uid"),
            alm_type=request.alm_type,
            project_id=request.project_id,
        )
        
        return {
            "message": f"Project sync started for {request.alm_type}",
            "project_id": request.project_id,
            "alm_type": request.alm_type,
        }
        
    except Exception as e:
        logger.error("Failed to start project sync", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start project sync: {str(e)}",
        )

async def _sync_project_background(
    alm_factory: ALMFactory,
    alm_type: str,
    project_id: str,
    sync_config: Dict,
    user_id: str,
):
    """Background task for project synchronization."""
    try:
        result = await alm_factory.sync_project(
            alm_type=alm_type,
            project_id=project_id,
            sync_config=sync_config,
        )
        
        logger.info(
            "Project sync completed",
            user_id=user_id,
            alm_type=alm_type,
            project_id=project_id,
            success=result.get("success", False),
            synced_items=result.get("synced_items", 0),
        )
        
        # In a real implementation, you'd notify the user or update a job status
        
    except Exception as e:
        logger.error(
            "Project sync failed",
            user_id=user_id,
            alm_type=alm_type,
            project_id=project_id,
            error=str(e),
        )

@router.post("/items")
async def create_alm_item(
    request: ItemCreateRequest,
    current_user: Dict = Depends(get_current_user),
    alm_factory: ALMFactory = Depends(get_alm_factory),
):
    """Create an item in an ALM tool."""
    try:
        result = await alm_factory.create_item(
            alm_type=request.alm_type,
            item_type=request.item_type,
            item_data=request.item_data,
            project_config=request.project_config,
        )
        
        logger.info(
            "ALM item created",
            user_id=current_user.get("uid"),
            alm_type=request.alm_type,
            item_type=request.item_type,
            success=result.get("success", False),
            item_id=result.get("item_id"),
        )
        
        return result
        
    except Exception as e:
        logger.error("Failed to create ALM item", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create item: {str(e)}",
        )

@router.put("/items/{item_id}")
async def update_alm_item(
    item_id: str,
    request: ItemUpdateRequest,
    current_user: Dict = Depends(get_current_user),
    alm_factory: ALMFactory = Depends(get_alm_factory),
):
    """Update an item in an ALM tool."""
    try:
        result = await alm_factory.update_item(
            alm_type=request.alm_type,
            item_id=item_id,
            item_data=request.item_data,
            project_config=request.project_config,
        )
        
        logger.info(
            "ALM item updated",
            user_id=current_user.get("uid"),
            alm_type=request.alm_type,
            item_id=item_id,
            success=result.get("success", False),
        )
        
        return result
        
    except Exception as e:
        logger.error("Failed to update ALM item", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update item: {str(e)}",
        )

@router.get("/items/{item_id}")
async def get_alm_item(
    item_id: str,
    alm_type: str,
    project_config: Dict,
    current_user: Dict = Depends(get_current_user),
    alm_factory: ALMFactory = Depends(get_alm_factory),
):
    """Get an item from an ALM tool."""
    try:
        result = await alm_factory.get_item(
            alm_type=alm_type,
            item_id=item_id,
            project_config=project_config,
        )
        
        logger.info(
            "ALM item retrieved",
            user_id=current_user.get("uid"),
            alm_type=alm_type,
            item_id=item_id,
            success=result.get("success", False),
        )
        
        return result
        
    except Exception as e:
        logger.error("Failed to get ALM item", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get item: {str(e)}",
        )

@router.delete("/items/{item_id}")
async def delete_alm_item(
    item_id: str,
    alm_type: str,
    project_config: Dict,
    current_user: Dict = Depends(get_current_user),
    alm_factory: ALMFactory = Depends(get_alm_factory),
):
    """Delete an item from an ALM tool."""
    try:
        adapter = alm_factory.get_adapter(alm_type)
        if not adapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Adapter for {alm_type} not found",
            )
        
        result = await adapter.delete_item(item_id, project_config)
        
        logger.info(
            "ALM item deleted",
            user_id=current_user.get("uid"),
            alm_type=alm_type,
            item_id=item_id,
            success=result.get("success", False),
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete ALM item", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete item: {str(e)}",
        )

@router.post("/query")
async def query_alm_items(
    request: ItemQueryRequest,
    current_user: Dict = Depends(get_current_user),
    alm_factory: ALMFactory = Depends(get_alm_factory),
):
    """Query items from an ALM tool."""
    try:
        result = await alm_factory.query_items(
            alm_type=request.alm_type,
            query=request.query,
            project_config=request.project_config,
        )
        
        logger.info(
            "ALM items queried",
            user_id=current_user.get("uid"),
            alm_type=request.alm_type,
            success=result.get("success", False),
            item_count=len(result.get("items", [])),
        )
        
        return result
        
    except Exception as e:
        logger.error("Failed to query ALM items", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query items: {str(e)}",
        )

@router.get("/projects")
async def get_alm_projects(
    alm_type: str,
    current_user: Dict = Depends(get_current_user),
    alm_factory: ALMFactory = Depends(get_alm_factory),
):
    """Get projects from an ALM tool."""
    try:
        adapter = alm_factory.get_adapter(alm_type)
        if not adapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Adapter for {alm_type} not found",
            )
        
        result = await adapter.get_projects()
        
        logger.info(
            "ALM projects retrieved",
            user_id=current_user.get("uid"),
            alm_type=alm_type,
            success=result.get("success", False),
            project_count=len(result.get("projects", [])),
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get ALM projects", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get projects: {str(e)}",
        )

@router.get("/item-types")
async def get_alm_item_types(
    alm_type: str,
    project_config: Dict,
    current_user: Dict = Depends(get_current_user),
    alm_factory: ALMFactory = Depends(get_alm_factory),
):
    """Get item types from an ALM tool."""
    try:
        adapter = alm_factory.get_adapter(alm_type)
        if not adapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Adapter for {alm_type} not found",
            )
        
        result = await adapter.get_item_types(project_config)
        
        logger.info(
            "ALM item types retrieved",
            user_id=current_user.get("uid"),
            alm_type=alm_type,
            success=result.get("success", False),
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get ALM item types", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get item types: {str(e)}",
        )

@router.get("/fields")
async def get_alm_fields(
    alm_type: str,
    item_type: str,
    project_config: Dict,
    current_user: Dict = Depends(get_current_user),
    alm_factory: ALMFactory = Depends(get_alm_factory),
):
    """Get fields for an ALM item type."""
    try:
        adapter = alm_factory.get_adapter(alm_type)
        if not adapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Adapter for {alm_type} not found",
            )
        
        result = await adapter.get_fields(item_type, project_config)
        
        logger.info(
            "ALM fields retrieved",
            user_id=current_user.get("uid"),
            alm_type=alm_type,
            item_type=item_type,
            success=result.get("success", False),
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get ALM fields", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get fields: {str(e)}",
        )

@router.post("/links")
async def create_alm_link(
    request: LinkCreateRequest,
    current_user: Dict = Depends(get_current_user),
    alm_factory: ALMFactory = Depends(get_alm_factory),
):
    """Create a link between ALM items."""
    try:
        adapter = alm_factory.get_adapter(request.alm_type)
        if not adapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Adapter for {request.alm_type} not found",
            )
        
        result = await adapter.create_link(
            source_id=request.source_id,
            target_id=request.target_id,
            link_type=request.link_type,
            project_config=request.project_config,
        )
        
        logger.info(
            "ALM link created",
            user_id=current_user.get("uid"),
            alm_type=request.alm_type,
            source_id=request.source_id,
            target_id=request.target_id,
            success=result.get("success", False),
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create ALM link", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create link: {str(e)}",
        )

@router.get("/links/{item_id}")
async def get_alm_links(
    item_id: str,
    alm_type: str,
    project_config: Dict,
    current_user: Dict = Depends(get_current_user),
    alm_factory: ALMFactory = Depends(get_alm_factory),
):
    """Get links for an ALM item."""
    try:
        adapter = alm_factory.get_adapter(alm_type)
        if not adapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Adapter for {alm_type} not found",
            )
        
        result = await adapter.get_links(item_id, project_config)
        
        logger.info(
            "ALM links retrieved",
            user_id=current_user.get("uid"),
            alm_type=alm_type,
            item_id=item_id,
            success=result.get("success", False),
            link_count=len(result.get("links", [])),
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get ALM links", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get links: {str(e)}",
        )

@router.get("/health")
async def get_alm_health_status(
    current_user: Dict = Depends(get_current_user),
    alm_factory: ALMFactory = Depends(get_alm_factory),
):
    """Get health status of all ALM adapters."""
    try:
        health_status = await alm_factory.get_health_status()
        
        logger.info(
            "ALM health status retrieved",
            user_id=current_user.get("uid"),
            overall_healthy=health_status.get("overall_healthy", False),
            adapter_count=len(health_status.get("adapters", {})),
        )
        
        return health_status
        
    except Exception as e:
        logger.error("Failed to get ALM health status", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get health status: {str(e)}",
        )
