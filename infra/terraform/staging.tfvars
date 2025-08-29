# Healthcare Compliance SaaS - Staging Environment Configuration

# Project Configuration
project_id = "healthcare-compliance-staging"
region     = "us-central1"
zone       = "us-central1-a"
environment = "staging"

# Organization Configuration
organization_name = "Healthcare Compliance SaaS - Staging"
organization_domain = "staging.healthcarecompliance.dev"

# Network Configuration
vpc_name = "healthcare-compliance-vpc-staging"
subnet_name = "healthcare-compliance-subnet-staging"
subnet_cidr = "10.1.0.0/24"

# Security Configuration
enable_private_google_access = true
enable_flow_logs = true
enable_vpc_sc = false  # Disabled for staging to reduce costs

# Cloud Run Configuration
cloud_run_config = {
  web = {
    name = "healthcare-compliance-web"
    min_instances = 0
    max_instances = 10
    cpu_limit = "1"
    memory_limit = "2Gi"
    concurrency = 100
    timeout = "300s"
  }
  ingest_api = {
    name = "healthcare-compliance-ingest-api"
    min_instances = 0
    max_instances = 5
    cpu_limit = "1"
    memory_limit = "2Gi"
    concurrency = 100
    timeout = "300s"
  }
  ai_orchestrator = {
    name = "healthcare-compliance-ai-orchestrator"
    min_instances = 0
    max_instances = 3
    cpu_limit = "2"
    memory_limit = "4Gi"
    concurrency = 10
    timeout = "900s"
  }
  alm_adapters = {
    name = "healthcare-compliance-alm-adapters"
    min_instances = 0
    max_instances = 3
    cpu_limit = "1"
    memory_limit = "2Gi"
    concurrency = 50
    timeout = "300s"
  }
}

# BigQuery Configuration
bigquery_config = {
  dataset_id = "healthcare_compliance_staging"
  location = "US"
  delete_contents_on_destroy = true
  default_table_expiration_ms = 2592000000  # 30 days
  
  # Data governance
  enable_policy_tags = true
  enable_column_security = true
  enable_row_security = true
}

# AI Services Configuration
ai_services_config = {
  vertex_ai_region = "us-central1"
  document_ai_location = "us"
  
  # Gemini configuration for staging
  gemini_model = "gemini-1.5-pro"
  gemini_temperature = 0.1
  gemini_max_tokens = 8192
  
  # Document AI processors
  document_processors = [
    {
      type = "FORM_PARSER_PROCESSOR"
      display_name = "Healthcare Forms Parser - Staging"
    },
    {
      type = "OCR_PROCESSOR"
      display_name = "Healthcare OCR - Staging"
    }
  ]
}

# Storage Configuration
storage_config = {
  documents_bucket = "healthcare-compliance-documents-staging"
  exports_bucket = "healthcare-compliance-exports-staging"
  backups_bucket = "healthcare-compliance-backups-staging"
  
  # Lifecycle policies for staging
  document_retention_days = 90
  export_retention_days = 30
  backup_retention_days = 30
  
  # Storage class
  storage_class = "STANDARD"
  enable_versioning = true
}

# Monitoring Configuration
monitoring_config = {
  enable_uptime_checks = true
  enable_alerting = true
  notification_channels = ["email"]
  
  # Alerting thresholds for staging
  error_rate_threshold = 0.1
  latency_threshold_ms = 5000
  availability_threshold = 0.95
}

# Security Configuration
security_config = {
  # KMS
  kms_key_rotation_period = "7776000s"  # 90 days
  
  # DLP
  enable_dlp = true
  dlp_inspect_templates = [
    "HIPAA_PHI_TEMPLATE",
    "PII_TEMPLATE",
    "HEALTHCARE_TEMPLATE"
  ]
  
  # IAM
  enable_audit_logs = true
  log_retention_days = 90
  
  # Security scanning
  enable_container_scanning = true
  enable_web_security_scanner = false  # Disabled for staging
}

# Compliance Configuration
compliance_config = {
  # Regulatory frameworks
  frameworks = [
    "FDA_QMSR",
    "ISO_13485",
    "IEC_62304",
    "ISO_14971",
    "ISO_27001",
    "HIPAA",
    "GDPR",
    "CFR_PART_11"
  ]
  
  # Audit configuration
  audit_log_retention_days = 2555  # 7 years for healthcare compliance
  enable_immutable_audit_logs = true
  
  # Data residency
  data_residency_region = "us-central1"
  cross_region_replication = false  # Disabled for staging
}

# Development Configuration
development_config = {
  enable_debug_logging = true
  enable_test_endpoints = true
  enable_mock_data = true
  
  # Feature flags for staging
  feature_flags = {
    ai_test_generation = true
    document_ai_parsing = true
    alm_integrations = true
    advanced_analytics = false
    enterprise_sso = false
  }
}

# Cost Optimization for Staging
cost_optimization = {
  # Preemptible instances where possible
  use_preemptible = true
  
  # Scheduled scaling
  enable_scheduled_scaling = true
  scale_down_schedule = "0 18 * * 1-5"  # Scale down at 6 PM weekdays
  scale_up_schedule = "0 8 * * 1-5"     # Scale up at 8 AM weekdays
  
  # Resource limits
  max_cpu_per_service = "2"
  max_memory_per_service = "4Gi"
  max_storage_gb = 100
}

# Tags and Labels
labels = {
  environment = "staging"
  project = "healthcare-compliance-saas"
  team = "platform-engineering"
  compliance = "healthcare"
  cost-center = "engineering"
  data-classification = "restricted"
}
