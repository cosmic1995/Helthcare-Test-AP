"""Configuration settings for the ingest API service."""

import os
from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Environment
    environment: str = Field(default="development", env="ENVIRONMENT")
    project_id: str = Field(env="PROJECT_ID")
    region: str = Field(default="us-central1", env="REGION")
    
    # Storage
    incoming_bucket: str = Field(env="INCOMING_BUCKET")
    processed_bucket: str = Field(env="PROCESSED_BUCKET")
    deidentified_bucket: str = Field(env="DEIDENTIFIED_BUCKET")
    
    # BigQuery
    bigquery_dataset: str = Field(env="BIGQUERY_DATASET")
    
    # Document AI
    document_ai_processor: str = Field(env="DOCUMENT_AI_PROCESSOR")
    document_ai_location: str = Field(default="us", env="DOCUMENT_AI_LOCATION")
    
    # Pub/Sub Topics
    pubsub_file_uploaded_topic: str = Field(env="PUBSUB_FILE_UPLOADED_TOPIC")
    pubsub_document_parsed_topic: str = Field(env="PUBSUB_DOCUMENT_PARSED_TOPIC")
    pubsub_dlp_completed_topic: str = Field(env="PUBSUB_DLP_COMPLETED_TOPIC")
    
    # Firebase
    firebase_config: str = Field(env="FIREBASE_CONFIG")
    
    # Security
    allowed_hosts: List[str] = Field(
        default=["*"],
        env="ALLOWED_HOSTS",
        description="Comma-separated list of allowed hosts"
    )
    cors_origins: List[str] = Field(
        default=["http://localhost:3000"],
        env="CORS_ORIGINS",
        description="Comma-separated list of CORS origins"
    )
    
    # File processing
    max_file_size: int = Field(default=50 * 1024 * 1024, env="MAX_FILE_SIZE")  # 50MB
    supported_file_types: List[str] = Field(
        default=[
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "text/xml",
            "application/xml",
        ],
        env="SUPPORTED_FILE_TYPES"
    )
    
    # DLP
    enable_dlp: bool = Field(default=True, env="ENABLE_DLP")
    dlp_template_name: str = Field(
        default="projects/{project_id}/inspectTemplates/healthcare-pii-template",
        env="DLP_TEMPLATE_NAME"
    )
    
    # Rate limiting
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=60, env="RATE_LIMIT_WINDOW")  # seconds
    
    # Monitoring
    enable_tracing: bool = Field(default=True, env="ENABLE_TRACING")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        
        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str) -> any:
            """Parse environment variables, especially lists."""
            if field_name in ["allowed_hosts", "cors_origins", "supported_file_types"]:
                return [item.strip() for item in raw_val.split(",")]
            return cls.json_loads(raw_val)


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()
