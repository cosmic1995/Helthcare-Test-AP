# Healthcare Compliance SaaS - Production Environment Configuration

# Project Configuration
project_id = "healthcare-genai"
project_name = "Healthcare GenAI"
project_number = "199648335966"
region = "us-central1"
zone = "us-central1-a"
environment = "production"

# Organization Configuration
organization_name = "Healthcare Compliance SaaS"
organization_domain = "app.healthcarecompliance.com"

# Network Configuration
vpc_name = "healthcare-compliance-vpc-prod"
subnet_name = "healthcare-compliance-subnet-prod"
subnet_cidr = "10.0.0.0/24"

# Security Configuration - Production Hardened
enable_private_google_access = true
enable_flow_logs = true
enable_vpc_sc = true  # VPC Service Controls for production
enable_private_cluster = true
enable_network_policy = true

# Cloud Run Configuration - Production Scale
cloud_run_config = {
  web = {
    name = "healthcare-compliance-web"
    min_instances = 2
    max_instances = 100
    cpu_limit = "2"
    memory_limit = "4Gi"
    concurrency = 1000
    timeout = "300s"
  }
  ingest_api = {
    name = "healthcare-compliance-ingest-api"
    min_instances = 2
    max_instances = 50
    cpu_limit = "2"
    memory_limit = "4Gi"
    concurrency = 500
    timeout = "300s"
  }
  ai_orchestrator = {
    name = "healthcare-compliance-ai-orchestrator"
    min_instances = 1
    max_instances = 20
    cpu_limit = "4"
    memory_limit = "8Gi"
    concurrency = 10
    timeout = "900s"
  }
  alm_adapters = {
    name = "healthcare-compliance-alm-adapters"
    min_instances = 1
    max_instances = 10
    cpu_limit = "2"
    memory_limit = "4Gi"
    concurrency = 100
    timeout = "300s"
  }
}

# BigQuery Configuration - Production
bigquery_config = {
  dataset_id = "healthcare_compliance_prod"
  location = "US"
  delete_contents_on_destroy = false
  default_table_expiration_ms = null  # No expiration for production
  
  # Data governance - Full security
  enable_policy_tags = true
  enable_column_security = true
  enable_row_security = true
  enable_cmek_encryption = true
  
  # Backup and disaster recovery
  enable_backup = true
  backup_schedule = "0 2 * * *"  # Daily at 2 AM
  cross_region_backup = true
  backup_retention_days = 2555  # 7 years for healthcare compliance
}

# AI Services Configuration - Production
ai_services_config = {
  vertex_ai_region = "us-central1"
  document_ai_location = "us"
  
  # Gemini configuration for production
  gemini_model = "gemini-1.5-pro"
  gemini_temperature = 0.0  # Deterministic for production
  gemini_max_tokens = 8192
  
  # Production-grade Document AI processors
  document_processors = [
    {
      type = "FORM_PARSER_PROCESSOR"
      display_name = "Healthcare Forms Parser - Production"
    },
    {
      type = "OCR_PROCESSOR"
      display_name = "Healthcare OCR - Production"
    },
    {
      type = "SPECIALIZED_PARSER"
      display_name = "Medical Device Documentation Parser"
    }
  ]
  
  # AI safety and compliance
  enable_ai_content_filtering = true
  enable_ai_audit_logging = true
  ai_model_monitoring = true
}

# Storage Configuration - Production
storage_config = {
  documents_bucket = "healthcare-compliance-documents-prod"
  exports_bucket = "healthcare-compliance-exports-prod"
  backups_bucket = "healthcare-compliance-backups-prod"
  
  # Long-term retention for healthcare compliance
  document_retention_days = 2555  # 7 years
  export_retention_days = 365     # 1 year
  backup_retention_days = 2555    # 7 years
  
  # Production storage settings
  storage_class = "STANDARD"
  enable_versioning = true
  enable_object_lock = true
  enable_cmek_encryption = true
  
  # Multi-region for disaster recovery
  enable_multi_region = true
  replication_regions = ["us-east1", "us-west1"]
}

# Monitoring Configuration - Production
monitoring_config = {
  enable_uptime_checks = true
  enable_alerting = true
  notification_channels = ["email", "slack", "pagerduty"]
  
  # Strict SLA thresholds for production
  error_rate_threshold = 0.01      # 1% error rate
  latency_threshold_ms = 2000      # 2 second latency
  availability_threshold = 0.999   # 99.9% availability
  
  # Advanced monitoring
  enable_apm = true
  enable_profiling = true
  enable_trace_sampling = true
  
  # Healthcare compliance monitoring
  enable_hipaa_monitoring = true
  enable_audit_monitoring = true
  enable_security_monitoring = true
}

# Security Configuration - Production Hardened
security_config = {
  # KMS - Customer Managed Encryption Keys
  kms_key_rotation_period = "2592000s"  # 30 days
  enable_cmek = true
  
  # DLP - Comprehensive data protection
  enable_dlp = true
  dlp_inspect_templates = [
    "HIPAA_PHI_TEMPLATE",
    "PII_TEMPLATE",
    "HEALTHCARE_TEMPLATE",
    "FINANCIAL_TEMPLATE",
    "CUSTOM_MEDICAL_DEVICE_TEMPLATE"
  ]
  
  # Advanced DLP policies
  enable_dlp_api_scanning = true
  enable_dlp_storage_scanning = true
  dlp_action_on_violation = "BLOCK"
  
  # IAM and Access Control
  enable_audit_logs = true
  log_retention_days = 2555  # 7 years
  enable_access_transparency = true
  enable_access_approval = true
  
  # Security scanning and monitoring
  enable_container_scanning = true
  enable_web_security_scanner = true
  enable_security_command_center = true
  
  # Network security
  enable_cloud_armor = true
  enable_ddos_protection = true
  enable_waf = true
  
  # Certificate management
  enable_managed_ssl = true
  ssl_policy = "MODERN"
}

# Compliance Configuration - Full Healthcare Compliance
compliance_config = {
  # All regulatory frameworks
  frameworks = [
    "FDA_QMSR",
    "ISO_13485",
    "IEC_62304",
    "ISO_14971",
    "ISO_27001",
    "HIPAA",
    "GDPR",
    "CFR_PART_11",
    "SOC2_TYPE2",
    "HITRUST_CSF"
  ]
  
  # Audit configuration - 21 CFR Part 11 compliant
  audit_log_retention_days = 2555  # 7 years minimum
  enable_immutable_audit_logs = true
  enable_digital_signatures = true
  enable_audit_trail_encryption = true
  
  # Data residency and sovereignty
  data_residency_region = "us-central1"
  cross_region_replication = true
  enable_data_sovereignty = true
  
  # Compliance reporting
  enable_compliance_dashboard = true
  compliance_report_schedule = "0 6 1 * *"  # Monthly on 1st at 6 AM
  
  # Regulatory validation
  enable_regulatory_validation = true
  validation_schedule = "0 0 * * 0"  # Weekly on Sunday
}

# High Availability Configuration
high_availability_config = {
  # Multi-zone deployment
  enable_multi_zone = true
  zones = ["us-central1-a", "us-central1-b", "us-central1-c"]
  
  # Load balancing
  enable_global_load_balancer = true
  enable_cdn = true
  cdn_cache_mode = "CACHE_ALL_STATIC"
  
  # Disaster recovery
  enable_disaster_recovery = true
  rto_minutes = 60   # Recovery Time Objective: 1 hour
  rpo_minutes = 15   # Recovery Point Objective: 15 minutes
  
  # Backup strategy
  backup_frequency = "HOURLY"
  cross_region_backup = true
  backup_encryption = true
}

# Performance Configuration
performance_config = {
  # Auto-scaling
  enable_horizontal_pod_autoscaling = true
  enable_vertical_pod_autoscaling = true
  
  # Caching
  enable_redis_cache = true
  redis_memory_size_gb = 4
  redis_tier = "STANDARD_HA"
  
  # CDN and edge optimization
  enable_cloud_cdn = true
  enable_edge_caching = true
  cache_ttl_seconds = 3600
  
  # Database optimization
  enable_connection_pooling = true
  max_connections = 100
  connection_timeout_seconds = 30
}

# Production Feature Configuration
production_config = {
  enable_debug_logging = false
  enable_test_endpoints = false
  enable_mock_data = false
  
  # Production feature flags
  feature_flags = {
    ai_test_generation = true
    document_ai_parsing = true
    alm_integrations = true
    advanced_analytics = true
    enterprise_sso = true
    real_time_compliance = true
    predictive_analytics = true
    automated_reporting = true
  }
  
  # Rate limiting
  enable_rate_limiting = true
  rate_limit_requests_per_minute = 1000
  
  # API versioning
  api_version = "v1"
  enable_api_versioning = true
}

# Cost Management for Production
cost_management = {
  # Resource optimization
  enable_committed_use_discounts = true
  enable_sustained_use_discounts = true
  
  # Monitoring and alerting
  enable_billing_alerts = true
  monthly_budget_usd = 10000
  budget_alert_thresholds = [0.5, 0.8, 0.9, 1.0]
  
  # Resource scheduling (non-critical services only)
  enable_scheduled_scaling = false  # Always on for production
  
  # Resource limits (generous for production)
  max_cpu_per_service = "8"
  max_memory_per_service = "16Gi"
  max_storage_tb = 10
}

# Regulatory and Legal Configuration
regulatory_config = {
  # Data classification
  data_classification = "HIGHLY_RESTRICTED"
  
  # Geographic restrictions
  allowed_regions = ["us-central1", "us-east1", "us-west1"]
  prohibited_regions = []  # All non-US regions prohibited
  
  # Legal holds and e-discovery
  enable_legal_hold = true
  enable_ediscovery = true
  
  # Privacy controls
  enable_right_to_be_forgotten = true
  enable_data_portability = true
  enable_consent_management = true
}

# Tags and Labels - Production
labels = {
  environment = "production"
  project = "healthcare-compliance-saas"
  team = "platform-engineering"
  compliance = "healthcare"
  cost-center = "production"
  data-classification = "highly-restricted"
  regulatory-scope = "fda-iso-hipaa-gdpr"
  backup-required = "true"
  monitoring-level = "critical"
  sla-tier = "premium"
}
