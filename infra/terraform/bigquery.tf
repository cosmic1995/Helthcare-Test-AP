# BigQuery dataset for healthcare compliance data
resource "google_bigquery_dataset" "healthcare_compliance" {
  dataset_id                  = "healthcare_compliance_${var.environment}"
  friendly_name               = "Healthcare Compliance Data"
  description                 = "Dataset for requirements, tests, and compliance data"
  location                    = var.data_residency_region
  default_table_expiration_ms = var.retention_days * 24 * 60 * 60 * 1000

  dynamic "default_encryption_configuration" {
    for_each = var.enable_cmek ? [1] : []
    content {
      kms_key_name = google_kms_crypto_key.bigquery_key[0].id
    }
  }

  labels = {
    environment = var.environment
    compliance  = "healthcare"
  }
}

# Policy tags for data classification
resource "google_data_catalog_policy_tag_taxonomy" "healthcare_taxonomy" {
  region               = var.data_residency_region
  display_name         = "Healthcare Data Classification"
  description          = "Taxonomy for healthcare data classification and access control"
  activated_policy_types = ["FINE_GRAINED_ACCESS_CONTROL"]
}

resource "google_data_catalog_policy_tag" "pii_data" {
  taxonomy     = google_data_catalog_policy_tag_taxonomy.healthcare_taxonomy.id
  display_name = "PII Data"
  description  = "Personally Identifiable Information"
}

resource "google_data_catalog_policy_tag" "phi_data" {
  taxonomy     = google_data_catalog_policy_tag_taxonomy.healthcare_taxonomy.id
  display_name = "PHI Data"
  description  = "Protected Health Information"
}

resource "google_data_catalog_policy_tag" "compliance_data" {
  taxonomy     = google_data_catalog_policy_tag_taxonomy.healthcare_taxonomy.id
  display_name = "Compliance Data"
  description  = "Regulatory compliance information"
}

resource "google_data_catalog_policy_tag" "audit_data" {
  taxonomy     = google_data_catalog_policy_tag_taxonomy.healthcare_taxonomy.id
  display_name = "Audit Data"
  description  = "Audit trail and signature data"
}

# Requirements table
resource "google_bigquery_table" "requirements" {
  dataset_id = google_bigquery_dataset.healthcare_compliance.dataset_id
  table_id   = "requirements"

  time_partitioning {
    type  = "DAY"
    field = "created_at"
  }

  clustering = ["project_id", "risk_class"]

  schema = jsonencode([
    {
      name = "req_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "project_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "source_uri"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "section_path"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "text"
      type = "STRING"
      mode = "REQUIRED"
      policyTags = {
        names = [google_data_catalog_policy_tag.compliance_data.name]
      }
    },
    {
      name = "normative"
      type = "BOOLEAN"
      mode = "REQUIRED"
    },
    {
      name = "risk_class"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "std_tags"
      type = "STRING"
      mode = "REPEATED"
    },
    {
      name = "ingest_hash"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "confidence"
      type = "FLOAT64"
      mode = "REQUIRED"
    },
    {
      name = "created_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "updated_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    }
  ])

  labels = {
    environment = var.environment
    table_type  = "requirements"
  }
}

# Tests table
resource "google_bigquery_table" "tests" {
  dataset_id = google_bigquery_dataset.healthcare_compliance.dataset_id
  table_id   = "tests"

  time_partitioning {
    type  = "DAY"
    field = "created_at"
  }

  clustering = ["project_id", "review_status"]

  schema = jsonencode([
    {
      name = "test_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "req_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "project_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "title"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "gherkin"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "preconditions"
      type = "STRING"
      mode = "REPEATED"
    },
    {
      name = "steps"
      type = "RECORD"
      mode = "REPEATED"
      fields = [
        {
          name = "action"
          type = "STRING"
          mode = "REQUIRED"
        },
        {
          name = "expected"
          type = "STRING"
          mode = "REQUIRED"
        }
      ]
    },
    {
      name = "expected_summary"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "risk_refs"
      type = "STRING"
      mode = "REPEATED"
    },
    {
      name = "std_tags"
      type = "STRING"
      mode = "REPEATED"
    },
    {
      name = "generated_by_model"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "quality_score"
      type = "FLOAT64"
      mode = "REQUIRED"
    },
    {
      name = "review_status"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "reviewer"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "reviewed_at"
      type = "TIMESTAMP"
      mode = "NULLABLE"
    },
    {
      name = "signature_evidence"
      type = "STRING"
      mode = "NULLABLE"
      policyTags = {
        names = [google_data_catalog_policy_tag.audit_data.name]
      }
    },
    {
      name = "created_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "updated_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    }
  ])

  labels = {
    environment = var.environment
    table_type  = "tests"
  }
}

# Trace links table
resource "google_bigquery_table" "trace_links" {
  dataset_id = google_bigquery_dataset.healthcare_compliance.dataset_id
  table_id   = "trace_links"

  time_partitioning {
    type  = "DAY"
    field = "created_at"
  }

  clustering = ["req_id", "test_id"]

  schema = jsonencode([
    {
      name = "req_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "test_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "link_type"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "rationale"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "confidence"
      type = "FLOAT64"
      mode = "REQUIRED"
    },
    {
      name = "created_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    }
  ])

  labels = {
    environment = var.environment
    table_type  = "trace_links"
  }
}

# ALM references table
resource "google_bigquery_table" "alm_refs" {
  dataset_id = google_bigquery_dataset.healthcare_compliance.dataset_id
  table_id   = "alm_refs"

  time_partitioning {
    type  = "DAY"
    field = "created_at"
  }

  clustering = ["system", "entity_type"]

  schema = jsonencode([
    {
      name = "local_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "external_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "system"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "entity_type"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "url"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "created_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    }
  ])

  labels = {
    environment = var.environment
    table_type  = "alm_refs"
  }
}

# Test runs table
resource "google_bigquery_table" "runs" {
  dataset_id = google_bigquery_dataset.healthcare_compliance.dataset_id
  table_id   = "runs"

  time_partitioning {
    type  = "DAY"
    field = "timestamp"
  }

  clustering = ["test_id", "status"]

  schema = jsonencode([
    {
      name = "run_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "test_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "status"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "evidence_uri"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "tester"
      type = "STRING"
      mode = "REQUIRED"
      policyTags = {
        names = [google_data_catalog_policy_tag.pii_data.name]
      }
    },
    {
      name = "timestamp"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    }
  ])

  labels = {
    environment = var.environment
    table_type  = "runs"
  }
}

# Compliance notes table
resource "google_bigquery_table" "compliance_notes" {
  dataset_id = google_bigquery_dataset.healthcare_compliance.dataset_id
  table_id   = "compliance_notes"

  time_partitioning {
    type  = "DAY"
    field = "created_at"
  }

  clustering = ["entity_type", "clause"]

  schema = jsonencode([
    {
      name = "entity_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "entity_type"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "clause"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "note"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "model_explanation"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "created_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    }
  ])

  labels = {
    environment = var.environment
    table_type  = "compliance_notes"
  }
}

# Audit trail table (immutable)
resource "google_bigquery_table" "audit_trail" {
  dataset_id = google_bigquery_dataset.healthcare_compliance.dataset_id
  table_id   = "audit_trail"

  time_partitioning {
    type  = "DAY"
    field = "timestamp"
  }

  clustering = ["user_id", "action"]

  schema = jsonencode([
    {
      name = "audit_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "user_id"
      type = "STRING"
      mode = "REQUIRED"
      policyTags = {
        names = [google_data_catalog_policy_tag.pii_data.name]
      }
    },
    {
      name = "entity_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "entity_type"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "action"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "details"
      type = "JSON"
      mode = "NULLABLE"
    },
    {
      name = "ip_address"
      type = "STRING"
      mode = "REQUIRED"
      policyTags = {
        names = [google_data_catalog_policy_tag.pii_data.name]
      }
    },
    {
      name = "user_agent"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "signature_hash"
      type = "STRING"
      mode = "NULLABLE"
      policyTags = {
        names = [google_data_catalog_policy_tag.audit_data.name]
      }
    },
    {
      name = "timestamp"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    }
  ])

  labels = {
    environment = var.environment
    table_type  = "audit_trail"
  }
}

# IAM for BigQuery dataset
resource "google_bigquery_dataset_iam_binding" "data_editor" {
  dataset_id = google_bigquery_dataset.healthcare_compliance.dataset_id
  role       = "roles/bigquery.dataEditor"

  members = [
    "serviceAccount:${google_service_account.cloud_run_services["ingest-api"].email}",
    "serviceAccount:${google_service_account.cloud_run_services["ai-orchestrator"].email}",
    "serviceAccount:${google_service_account.cloud_run_services["alm-adapters"].email}",
  ]
}

resource "google_bigquery_dataset_iam_binding" "job_user" {
  dataset_id = google_bigquery_dataset.healthcare_compliance.dataset_id
  role       = "roles/bigquery.jobUser"

  members = [
    "serviceAccount:${google_service_account.cloud_run_services["ingest-api"].email}",
    "serviceAccount:${google_service_account.cloud_run_services["ai-orchestrator"].email}",
    "serviceAccount:${google_service_account.cloud_run_services["alm-adapters"].email}",
  ]
}
