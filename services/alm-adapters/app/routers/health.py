"""Health check endpoints for ALM Adapters service."""

from typing import Dict

import structlog
from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.services.alm_factory import ALMFactory

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "alm-adapters",
        "version": "1.0.0",
    }


@router.get("/liveness")
async def liveness_probe():
    """Kubernetes liveness probe endpoint."""
    try:
        settings = get_settings()
        
        return {
            "status": "alive",
            "service": "alm-adapters",
            "project_id": settings.project_id,
            "timestamp": "2024-01-01T00:00:00Z",  # Would use datetime.utcnow()
        }
        
    except Exception as e:
        logger.error("Liveness probe failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service not alive",
        )


@router.get("/readiness")
async def readiness_probe():
    """Kubernetes readiness probe endpoint with dependency checks."""
    try:
        settings = get_settings()
        health_status = {
            "status": "ready",
            "service": "alm-adapters",
            "dependencies": {},
            "overall_ready": True,
        }
        
        # Check ALM adapters
        try:
            alm_factory = ALMFactory()
            alm_health = await alm_factory.get_health_status()
            health_status["dependencies"]["alm_adapters"] = {
                "healthy": alm_health.get("overall_healthy", False),
                "adapters": list(alm_health.get("adapters", {}).keys()),
            }
            if not alm_health.get("overall_healthy", False):
                health_status["overall_ready"] = False
        except Exception as e:
            logger.error("ALM adapters health check failed", error=str(e))
            health_status["dependencies"]["alm_adapters"] = {
                "healthy": False,
                "error": str(e),
            }
            health_status["overall_ready"] = False
        
        # Check BigQuery connectivity (simplified)
        try:
            # This would test BigQuery connection
            health_status["dependencies"]["bigquery"] = {
                "healthy": True,  # Placeholder
                "dataset": settings.bigquery_dataset,
            }
        except Exception as e:
            logger.error("BigQuery health check failed", error=str(e))
            health_status["dependencies"]["bigquery"] = {
                "healthy": False,
                "error": str(e),
            }
            health_status["overall_ready"] = False
        
        # Check Pub/Sub connectivity (simplified)
        try:
            # This would test Pub/Sub connection
            health_status["dependencies"]["pubsub"] = {
                "healthy": True,  # Placeholder
            }
        except Exception as e:
            logger.error("Pub/Sub health check failed", error=str(e))
            health_status["dependencies"]["pubsub"] = {
                "healthy": False,
                "error": str(e),
            }
            health_status["overall_ready"] = False
        
        if not health_status["overall_ready"]:
            health_status["status"] = "not_ready"
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=health_status,
            )
        
        logger.info("Readiness probe successful", dependencies=health_status["dependencies"])
        return health_status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Readiness probe failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service not ready",
        )


@router.get("/detailed")
async def detailed_health_check():
    """Detailed health check with comprehensive service status."""
    try:
        settings = get_settings()
        
        detailed_status = {
            "service": "alm-adapters",
            "version": "1.0.0",
            "status": "healthy",
            "timestamp": "2024-01-01T00:00:00Z",
            "configuration": {
                "project_id": settings.project_id,
                "bigquery_dataset": settings.bigquery_dataset,
                "sync_batch_size": settings.sync_batch_size,
                "retry_attempts": settings.retry_attempts,
            },
            "adapters": {},
            "metrics": {},
        }
        
        # Detailed ALM adapters check
        try:
            alm_factory = ALMFactory()
            alm_health = await alm_factory.get_health_status()
            
            for alm_type, adapter_health in alm_health.get("adapters", {}).items():
                detailed_status["adapters"][alm_type] = {
                    "status": "healthy" if adapter_health.get("healthy") else "unhealthy",
                    "details": adapter_health,
                }
        except Exception as e:
            detailed_status["adapters"]["error"] = {
                "status": "error",
                "error": str(e),
            }
        
        # Add metrics (placeholder)
        detailed_status["metrics"] = {
            "requests_total": 0,
            "requests_per_minute": 0.0,
            "sync_operations_total": 0,
            "sync_success_rate": 0.0,
            "average_response_time": 0.0,
            "error_rate": 0.0,
        }
        
        # Determine overall status
        adapter_statuses = [
            adapter.get("status") for adapter in detailed_status["adapters"].values()
        ]
        
        if "error" in adapter_statuses:
            detailed_status["status"] = "degraded"
        elif "unhealthy" in adapter_statuses:
            detailed_status["status"] = "degraded"
        else:
            detailed_status["status"] = "healthy"
        
        logger.info(
            "Detailed health check completed",
            status=detailed_status["status"],
            adapters=len(detailed_status["adapters"]),
        )
        
        return detailed_status
        
    except Exception as e:
        logger.error("Detailed health check failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}",
        )
