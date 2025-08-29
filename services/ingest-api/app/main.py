"""
Healthcare Compliance SaaS - Ingest API Service

This service handles file upload, processing, and initial data ingestion.
It integrates with Document AI for parsing and DLP for de-identification.
"""

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from google.cloud import logging as cloud_logging

from app.config import get_settings
from app.middleware import (
    AuthMiddleware,
    LoggingMiddleware,
    TracingMiddleware,
)
from app.routers import files, health, webhooks
from app.services.bigquery_service import BigQueryService
from app.services.dlp_service import DLPService
from app.services.document_ai_service import DocumentAIService
from app.services.pubsub_service import PubSubService
from app.services.storage_service import StorageService

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager."""
    settings = get_settings()
    
    # Initialize Google Cloud Logging
    if settings.environment != "development":
        client = cloud_logging.Client()
        client.setup_logging()
    
    logger.info(
        "Starting Healthcare Ingest API",
        environment=settings.environment,
        project_id=settings.project_id,
    )
    
    # Initialize services
    app.state.storage_service = StorageService()
    app.state.bigquery_service = BigQueryService()
    app.state.document_ai_service = DocumentAIService()
    app.state.dlp_service = DLPService()
    app.state.pubsub_service = PubSubService()
    
    # Verify service connections
    try:
        await app.state.storage_service.health_check()
        await app.state.bigquery_service.health_check()
        await app.state.pubsub_service.health_check()
        logger.info("All services initialized successfully")
    except Exception as e:
        logger.error("Failed to initialize services", error=str(e))
        raise
    
    yield
    
    # Cleanup
    logger.info("Shutting down Healthcare Ingest API")


def create_app() -> FastAPI:
    """Create FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title="Healthcare Compliance Ingest API",
        description="File ingestion and processing service for healthcare compliance",
        version="1.0.0",
        docs_url="/docs" if settings.environment == "development" else None,
        redoc_url="/redoc" if settings.environment == "development" else None,
        lifespan=lifespan,
    )
    
    # Security middleware
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )
    
    # Custom middleware
    app.add_middleware(TracingMiddleware)
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(AuthMiddleware)
    
    # Include routers
    app.include_router(health.router, prefix="/health", tags=["Health"])
    app.include_router(files.router, prefix="/files", tags=["Files"])
    app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTP exceptions with structured logging."""
        logger.error(
            "HTTP exception",
            status_code=exc.status_code,
            detail=exc.detail,
            path=request.url.path,
            method=request.method,
        )
        return exc
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle general exceptions with structured logging."""
        logger.error(
            "Unhandled exception",
            error=str(exc),
            path=request.url.path,
            method=request.method,
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )
    
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8080")),
        log_level="info",
        reload=settings.environment == "development",
    )
