"""Configuration for ALM Adapters service."""

from typing import Dict, List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    # GCP Configuration
    project_id: str = Field(..., description="Google Cloud Project ID")
    region: str = Field(default="us-central1", description="GCP region")
    
    # Storage Configuration
    storage_bucket_incoming: str = Field(..., description="Incoming files bucket")
    storage_bucket_processed: str = Field(..., description="Processed files bucket")
    
    # BigQuery Configuration
    bigquery_dataset: str = Field(..., description="BigQuery dataset ID")
    
    # Pub/Sub Configuration
    pubsub_topic_alm_sync_requested: str = Field(..., description="ALM sync requested topic")
    pubsub_topic_alm_sync_completed: str = Field(..., description="ALM sync completed topic")
    pubsub_subscription_alm_sync: str = Field(..., description="ALM sync subscription")
    
    # Firebase Configuration
    firebase_config_secret: str = Field(..., description="Firebase config secret name")
    
    # ALM Tool Configurations
    jira_config_secret: str = Field(..., description="Jira configuration secret name")
    azure_devops_config_secret: str = Field(..., description="Azure DevOps config secret name")
    polarion_config_secret: str = Field(..., description="Polarion config secret name")
    
    # ALM Integration Settings
    sync_batch_size: int = Field(default=50, description="Batch size for ALM sync operations")
    sync_timeout_seconds: int = Field(default=300, description="Timeout for ALM operations")
    retry_attempts: int = Field(default=3, description="Number of retry attempts for failed operations")
    retry_delay_seconds: int = Field(default=5, description="Delay between retry attempts")
    
    # Mapping Configuration
    field_mapping_cache_ttl: int = Field(default=3600, description="Field mapping cache TTL in seconds")
    status_mapping_cache_ttl: int = Field(default=1800, description="Status mapping cache TTL in seconds")
    
    # Webhook Configuration
    webhook_secret_key: str = Field(..., description="Webhook signature verification key")
    webhook_timeout_seconds: int = Field(default=30, description="Webhook processing timeout")
    
    # Rate Limiting
    rate_limit_per_minute: int = Field(default=100, description="Rate limit per minute per client")
    rate_limit_burst: int = Field(default=20, description="Rate limit burst capacity")
    
    # Monitoring and Logging
    log_level: str = Field(default="INFO", description="Logging level")
    enable_tracing: bool = Field(default=True, description="Enable distributed tracing")
    metrics_enabled: bool = Field(default=True, description="Enable metrics collection")
    
    # Security
    allowed_origins: List[str] = Field(default=["*"], description="Allowed CORS origins")
    max_request_size: int = Field(default=10485760, description="Maximum request size in bytes (10MB)")
    
    # ALM Tool Specific Settings
    jira_api_version: str = Field(default="3", description="Jira API version")
    jira_max_results: int = Field(default=100, description="Maximum results per Jira API call")
    
    azure_devops_api_version: str = Field(default="7.0", description="Azure DevOps API version")
    azure_devops_max_results: int = Field(default=200, description="Maximum results per Azure DevOps API call")
    
    polarion_api_version: str = Field(default="1.0", description="Polarion API version")
    polarion_max_results: int = Field(default=100, description="Maximum results per Polarion API call")
    
    # Compliance and Audit
    audit_all_operations: bool = Field(default=True, description="Audit all ALM operations")
    data_retention_days: int = Field(default=2555, description="Data retention period in days (7 years)")
    
    # Performance Tuning
    connection_pool_size: int = Field(default=10, description="HTTP connection pool size")
    connection_timeout: int = Field(default=30, description="HTTP connection timeout")
    read_timeout: int = Field(default=60, description="HTTP read timeout")
    
    # Feature Flags
    enable_bidirectional_sync: bool = Field(default=True, description="Enable bidirectional synchronization")
    enable_real_time_webhooks: bool = Field(default=True, description="Enable real-time webhook processing")
    enable_conflict_resolution: bool = Field(default=True, description="Enable automatic conflict resolution")
    enable_field_validation: bool = Field(default=True, description="Enable field validation during sync")


# Global settings instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get application settings singleton."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
