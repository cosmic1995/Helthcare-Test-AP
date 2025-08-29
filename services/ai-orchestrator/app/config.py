"""Configuration settings for the AI orchestrator service."""

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
    
    # Vertex AI
    vertex_ai_location: str = Field(default="us-central1", env="VERTEX_AI_LOCATION")
    vector_search_endpoint: str = Field(env="VECTOR_SEARCH_ENDPOINT")
    deployed_index_id: str = Field(env="DEPLOYED_INDEX_ID")
    
    # Storage
    processed_bucket: str = Field(env="PROCESSED_BUCKET")
    deidentified_bucket: str = Field(env="DEIDENTIFIED_BUCKET")
    
    # BigQuery
    bigquery_dataset: str = Field(env="BIGQUERY_DATASET")
    
    # Pub/Sub Topics
    pubsub_document_parsed_topic: str = Field(env="PUBSUB_DOCUMENT_PARSED_TOPIC")
    pubsub_dlp_completed_topic: str = Field(env="PUBSUB_DLP_COMPLETED_TOPIC")
    pubsub_test_generation_topic: str = Field(env="PUBSUB_TEST_GENERATION_TOPIC")
    pubsub_test_approved_topic: str = Field(env="PUBSUB_TEST_APPROVED_TOPIC")
    
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
    
    # AI Model Configuration
    gemini_model: str = Field(default="gemini-1.5-pro", env="GEMINI_MODEL")
    embedding_model: str = Field(default="textembedding-gecko@003", env="EMBEDDING_MODEL")
    max_tokens: int = Field(default=8192, env="MAX_TOKENS")
    temperature: float = Field(default=0.1, env="TEMPERATURE")
    
    # RAG Configuration
    chunk_size: int = Field(default=1000, env="CHUNK_SIZE")
    chunk_overlap: int = Field(default=200, env="CHUNK_OVERLAP")
    max_retrieved_chunks: int = Field(default=10, env="MAX_RETRIEVED_CHUNKS")
    similarity_threshold: float = Field(default=0.7, env="SIMILARITY_THRESHOLD")
    
    # Test Generation Configuration
    max_tests_per_requirement: int = Field(default=3, env="MAX_TESTS_PER_REQUIREMENT")
    min_confidence_score: float = Field(default=0.6, env="MIN_CONFIDENCE_SCORE")
    enable_test_validation: bool = Field(default=True, env="ENABLE_TEST_VALIDATION")
    
    # Batch Processing
    batch_size: int = Field(default=10, env="BATCH_SIZE")
    max_concurrent_jobs: int = Field(default=5, env="MAX_CONCURRENT_JOBS")
    job_timeout_minutes: int = Field(default=30, env="JOB_TIMEOUT_MINUTES")
    
    # Evaluation Configuration
    enable_evaluation: bool = Field(default=True, env="ENABLE_EVALUATION")
    evaluation_model: str = Field(default="gemini-1.5-pro", env="EVALUATION_MODEL")
    quality_threshold: float = Field(default=0.7, env="QUALITY_THRESHOLD")
    
    # Compliance Standards
    supported_standards: List[str] = Field(
        default=[
            "ISO_13485",
            "IEC_62304", 
            "FDA_QMSR",
            "ISO_27001",
            "CFR_PART_11",
            "GDPR",
            "HIPAA",
        ],
        env="SUPPORTED_STANDARDS"
    )
    
    # Rate limiting
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=60, env="RATE_LIMIT_WINDOW")  # seconds
    
    # Monitoring
    enable_tracing: bool = Field(default=True, env="ENABLE_TRACING")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Caching
    enable_embedding_cache: bool = Field(default=True, env="ENABLE_EMBEDDING_CACHE")
    cache_ttl_hours: int = Field(default=24, env="CACHE_TTL_HOURS")
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        
        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str) -> any:
            """Parse environment variables, especially lists."""
            if field_name in ["allowed_hosts", "cors_origins", "supported_standards"]:
                return [item.strip() for item in raw_val.split(",")]
            return cls.json_loads(raw_val)


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()
