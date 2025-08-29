# Service accounts for Cloud Run services
resource "google_service_account" "cloud_run_services" {
  for_each = toset(local.services)
  
  account_id   = "healthcare-${each.key}-${var.environment}"
  display_name = "Healthcare ${title(replace(each.key, "-", " "))} Service Account"
  description  = "Service account for ${each.key} Cloud Run service"
}

# IAM roles for ingest-api service
resource "google_project_iam_member" "ingest_api_roles" {
  for_each = toset([
    "roles/storage.objectAdmin",
    "roles/bigquery.dataEditor",
    "roles/bigquery.jobUser",
    "roles/documentai.apiUser",
    "roles/dlp.user",
    "roles/pubsub.publisher",
    "roles/secretmanager.secretAccessor",
    "roles/cloudtrace.agent",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run_services["ingest-api"].email}"
}

# IAM roles for ai-orchestrator service
resource "google_project_iam_member" "ai_orchestrator_roles" {
  for_each = toset([
    "roles/storage.objectViewer",
    "roles/bigquery.dataEditor",
    "roles/bigquery.jobUser",
    "roles/aiplatform.user",
    "roles/pubsub.subscriber",
    "roles/pubsub.publisher",
    "roles/secretmanager.secretAccessor",
    "roles/cloudtrace.agent",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run_services["ai-orchestrator"].email}"
}

# IAM roles for alm-adapters service
resource "google_project_iam_member" "alm_adapters_roles" {
  for_each = toset([
    "roles/bigquery.dataEditor",
    "roles/bigquery.jobUser",
    "roles/secretmanager.secretAccessor",
    "roles/cloudtrace.agent",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run_services["alm-adapters"].email}"
}

# Custom IAM role for audit trail access (read-only)
resource "google_project_iam_custom_role" "audit_reader" {
  role_id     = "healthcare_audit_reader_${var.environment}"
  title       = "Healthcare Audit Reader"
  description = "Read-only access to audit trail data"
  permissions = [
    "bigquery.tables.get",
    "bigquery.tables.getData",
    "bigquery.jobs.create"
  ]
}

# Custom IAM role for compliance officer
resource "google_project_iam_custom_role" "compliance_officer" {
  role_id     = "healthcare_compliance_officer_${var.environment}"
  title       = "Healthcare Compliance Officer"
  description = "Full access to compliance data and audit trails"
  permissions = [
    "bigquery.datasets.get",
    "bigquery.tables.get",
    "bigquery.tables.getData",
    "bigquery.tables.list",
    "bigquery.jobs.create",
    "storage.objects.get",
    "storage.objects.list",
    "logging.logs.list",
    "logging.entries.list"
  ]
}

# Row-level security policies for BigQuery
resource "google_bigquery_datapolicy_data_policy" "project_isolation" {
  location         = var.data_residency_region
  data_policy_id   = "project_isolation_${var.environment}"
  policy_tag       = google_data_catalog_policy_tag.compliance_data.name
  data_policy_type = "DATA_MASKING_POLICY"

  data_masking_policy {
    predefined_expression = "SHA256"
  }
}

resource "google_bigquery_datapolicy_data_policy" "pii_masking" {
  location         = var.data_residency_region
  data_policy_id   = "pii_masking_${var.environment}"
  policy_tag       = google_data_catalog_policy_tag.pii_data.name
  data_policy_type = "DATA_MASKING_POLICY"

  data_masking_policy {
    predefined_expression = "DEFAULT_MASKING_VALUE"
  }
}

# Firebase project setup for authentication
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id
}

resource "google_firebase_web_app" "default" {
  provider     = google-beta
  project      = var.project_id
  display_name = "Healthcare Compliance SaaS"
  
  depends_on = [google_firebase_project.default]
}

# Identity Platform configuration for SSO
resource "google_identity_platform_config" "default" {
  provider = google-beta
  project  = var.project_id
  
  sign_in {
    allow_duplicate_emails = false
    
    anonymous {
      enabled = false
    }
    
    email {
      enabled           = true
      password_required = true
    }
  }
  
  depends_on = [google_firebase_project.default]
}

# Identity Platform SAML provider for enterprise SSO
resource "google_identity_platform_inbound_saml_config" "saml_provider" {
  provider     = google-beta
  project      = var.project_id
  name         = "saml.enterprise"
  display_name = "Enterprise SAML Provider"
  
  idp_config {
    idp_entity_id = "https://enterprise.example.com/saml"
    sso_url       = "https://enterprise.example.com/saml/sso"
    
    idp_certificates {
      x509_certificate = "LS0tLS1CRUdJTi..." # Placeholder - replace with actual cert
    }
  }
  
  sp_config {
    sp_entity_id = "https://healthcare-compliance.com/saml"
    callback_uri = "https://healthcare-compliance.com/auth/callback"
  }
  
  depends_on = [google_identity_platform_config.default]
}
