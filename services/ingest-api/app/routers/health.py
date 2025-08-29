"""Health check endpoints for the ingest API service."""

from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "healthy", "service": "ingest-api"}


@router.get("/live")
async def liveness_check():
    """Kubernetes liveness probe endpoint."""
    return {"status": "alive", "service": "ingest-api"}


@router.get("/ready")
async def readiness_check(request: Request):
    """Kubernetes readiness probe endpoint."""
    try:
        # Check all service dependencies
        services_status = {}
        
        # Check storage service
        try:
            storage_healthy = await request.app.state.storage_service.health_check()
            services_status["storage"] = "healthy" if storage_healthy else "unhealthy"
        except Exception as e:
            services_status["storage"] = f"error: {str(e)}"
        
        # Check BigQuery service
        try:
            bigquery_healthy = await request.app.state.bigquery_service.health_check()
            services_status["bigquery"] = "healthy" if bigquery_healthy else "unhealthy"
        except Exception as e:
            services_status["bigquery"] = f"error: {str(e)}"
        
        # Check Pub/Sub service
        try:
            pubsub_healthy = await request.app.state.pubsub_service.health_check()
            services_status["pubsub"] = "healthy" if pubsub_healthy else "unhealthy"
        except Exception as e:
            services_status["pubsub"] = f"error: {str(e)}"
        
        # Determine overall status
        all_healthy = all(status == "healthy" for status in services_status.values())
        
        response_data = {
            "status": "ready" if all_healthy else "not_ready",
            "service": "ingest-api",
            "dependencies": services_status,
        }
        
        status_code = status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
        
        return JSONResponse(content=response_data, status_code=status_code)
        
    except Exception as e:
        logger.error("Readiness check failed", error=str(e))
        return JSONResponse(
            content={
                "status": "not_ready",
                "service": "ingest-api",
                "error": str(e),
            },
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
