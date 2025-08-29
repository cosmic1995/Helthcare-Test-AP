"""Main FastAPI application for ALM Adapters service."""

import json
import logging
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.middleware import AuthenticationMiddleware, RateLimitingMiddleware, TracingMiddleware
from app.routers import alm, health, webhooks
from app.services.alm_factory import ALMFactory

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

# Global services
alm_factory = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global alm_factory
    
    try:
        settings = get_settings()
        
        logger.info(
            "Starting ALM Adapters service",
            service="alm-adapters",
            version="1.0.0",
            project_id=settings.project_id,
        )
        
        # Initialize ALM factory
        alm_factory = ALMFactory()
        await alm_factory.initialize()
        
        # Store in app state
        app.state.alm_factory = alm_factory
        
        logger.info("ALM Adapters service started successfully")
        
        yield
        
    except Exception as e:
        logger.error("Failed to start ALM Adapters service", error=str(e))
        raise
    finally:
        logger.info("Shutting down ALM Adapters service")
        
        # Cleanup resources
        if alm_factory:
            await alm_factory.cleanup()


# Create FastAPI application
app = FastAPI(
    title="ALM Adapters Service",
    description="Integration adapters for Application Lifecycle Management tools",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.add_middleware(TracingMiddleware)
app.add_middleware(AuthenticationMiddleware)
app.add_middleware(RateLimitingMiddleware)

# Include routers
app.include_router(health.router)
app.include_router(alm.router)
app.include_router(webhooks.router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with structured logging."""
    trace_id = getattr(request.state, "trace_id", "unknown")
    
    logger.error(
        "HTTP exception",
        trace_id=trace_id,
        status_code=exc.status_code,
        detail=exc.detail,
        url=str(request.url),
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "trace_id": trace_id,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions with structured logging."""
    trace_id = getattr(request.state, "trace_id", "unknown")
    
    logger.error(
        "Unhandled exception",
        trace_id=trace_id,
        error=str(exc),
        error_type=type(exc).__name__,
        url=str(request.url),
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "trace_id": trace_id,
        },
    )


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "alm-adapters",
        "version": "1.0.0",
        "status": "running",
        "description": "ALM integration adapters for healthcare compliance",
    }


if __name__ == "__main__":
    import uvicorn
    
    settings = get_settings()
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_config={
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
            },
            "root": {
                "level": "INFO",
                "handlers": ["default"],
            },
        },
    )
