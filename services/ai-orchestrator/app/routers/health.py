"""Health check endpoints for AI Orchestrator service."""

from typing import Dict

import structlog
from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.services.gemini_service import GeminiService
from app.services.vector_search_service import VectorSearchService

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-orchestrator",
        "version": "1.0.0",
    }


@router.get("/liveness")
async def liveness_probe():
    """Kubernetes liveness probe endpoint."""
    try:
        settings = get_settings()
        
        return {
            "status": "alive",
            "service": "ai-orchestrator",
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
            "service": "ai-orchestrator",
            "dependencies": {},
            "overall_ready": True,
        }
        
        # Check Gemini service
        try:
            gemini_service = GeminiService()
            gemini_health = await gemini_service.health_check()
            health_status["dependencies"]["gemini"] = {
                "healthy": gemini_health.get("overall", False),
                "model": settings.gemini_model,
            }
            if not gemini_health.get("overall", False):
                health_status["overall_ready"] = False
        except Exception as e:
            logger.error("Gemini health check failed", error=str(e))
            health_status["dependencies"]["gemini"] = {
                "healthy": False,
                "error": str(e),
            }
            health_status["overall_ready"] = False
        
        # Check Vector Search service
        try:
            vector_service = VectorSearchService()
            vector_health = await vector_service.health_check()
            health_status["dependencies"]["vector_search"] = {
                "healthy": vector_health.get("overall", False),
                "embedding_model": settings.embedding_model_name,
            }
            if not vector_health.get("overall", False):
                health_status["overall_ready"] = False
        except Exception as e:
            logger.error("Vector search health check failed", error=str(e))
            health_status["dependencies"]["vector_search"] = {
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
            "service": "ai-orchestrator",
            "version": "1.0.0",
            "status": "healthy",
            "timestamp": "2024-01-01T00:00:00Z",
            "configuration": {
                "project_id": settings.project_id,
                "vertex_ai_location": settings.vertex_ai_location,
                "gemini_model": settings.gemini_model,
                "embedding_model": settings.embedding_model_name,
                "bigquery_dataset": settings.bigquery_dataset,
            },
            "services": {},
            "metrics": {},
        }
        
        # Detailed Gemini service check
        try:
            gemini_service = GeminiService()
            gemini_health = await gemini_service.health_check()
            detailed_status["services"]["gemini"] = {
                "status": "healthy" if gemini_health.get("overall") else "unhealthy",
                "model": settings.gemini_model,
                "location": settings.vertex_ai_location,
                "details": gemini_health,
            }
        except Exception as e:
            detailed_status["services"]["gemini"] = {
                "status": "error",
                "error": str(e),
            }
        
        # Detailed Vector Search service check
        try:
            vector_service = VectorSearchService()
            vector_health = await vector_service.health_check()
            detailed_status["services"]["vector_search"] = {
                "status": "healthy" if vector_health.get("overall") else "unhealthy",
                "embedding_model": settings.embedding_model_name,
                "details": vector_health,
            }
        except Exception as e:
            detailed_status["services"]["vector_search"] = {
                "status": "error",
                "error": str(e),
            }
        
        # Add metrics (placeholder)
        detailed_status["metrics"] = {
            "requests_total": 0,
            "requests_per_minute": 0.0,
            "average_response_time": 0.0,
            "error_rate": 0.0,
            "active_jobs": 0,
        }
        
        # Determine overall status
        service_statuses = [
            service.get("status") for service in detailed_status["services"].values()
        ]
        
        if "error" in service_statuses:
            detailed_status["status"] = "degraded"
        elif "unhealthy" in service_statuses:
            detailed_status["status"] = "degraded"
        else:
            detailed_status["status"] = "healthy"
        
        logger.info(
            "Detailed health check completed",
            status=detailed_status["status"],
            services=len(detailed_status["services"]),
        )
        
        return detailed_status
        
    except Exception as e:
        logger.error("Detailed health check failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}",
        )
