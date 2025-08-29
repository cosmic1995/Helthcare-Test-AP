# Secret Manager secrets for application configuration
resource "google_secret_manager_secret" "firebase_config" {
  secret_id = "firebase-config-${var.environment}"
  
  replication {
    user_managed {
      replicas {
        location = var.data_residency_region
        dynamic "customer_managed_encryption" {
          for_each = var.enable_cmek ? [1] : []
          content {
            kms_key_name = google_kms_crypto_key.storage_key[0].id
          }
        }
      }
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "firebase_auth"
  }
}

resource "google_secret_manager_secret" "jira_api_token" {
  secret_id = "jira-api-token-${var.environment}"
  
  replication {
    user_managed {
      replicas {
        location = var.data_residency_region
        dynamic "customer_managed_encryption" {
          for_each = var.enable_cmek ? [1] : []
          content {
            kms_key_name = google_kms_crypto_key.storage_key[0].id
          }
        }
      }
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "alm_integration"
  }
}

resource "google_secret_manager_secret" "ado_pat" {
  secret_id = "ado-pat-${var.environment}"
  
  replication {
    user_managed {
      replicas {
        location = var.data_residency_region
        dynamic "customer_managed_encryption" {
          for_each = var.enable_cmek ? [1] : []
          content {
            kms_key_name = google_kms_crypto_key.storage_key[0].id
          }
        }
      }
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "alm_integration"
  }
}

resource "google_secret_manager_secret" "polarion_credentials" {
  secret_id = "polarion-credentials-${var.environment}"
  
  replication {
    user_managed {
      replicas {
        location = var.data_residency_region
        dynamic "customer_managed_encryption" {
          for_each = var.enable_cmek ? [1] : []
          content {
            kms_key_name = google_kms_crypto_key.storage_key[0].id
          }
        }
      }
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "alm_integration"
  }
}

resource "google_secret_manager_secret" "jwt_signing_key" {
  secret_id = "jwt-signing-key-${var.environment}"
  
  replication {
    user_managed {
      replicas {
        location = var.data_residency_region
        dynamic "customer_managed_encryption" {
          for_each = var.enable_cmek ? [1] : []
          content {
            kms_key_name = google_kms_crypto_key.storage_key[0].id
          }
        }
      }
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "jwt_auth"
  }
}

resource "google_secret_manager_secret" "database_encryption_key" {
  secret_id = "database-encryption-key-${var.environment}"
  
  replication {
    user_managed {
      replicas {
        location = var.data_residency_region
        dynamic "customer_managed_encryption" {
          for_each = var.enable_cmek ? [1] : []
          content {
            kms_key_name = google_kms_crypto_key.storage_key[0].id
          }
        }
      }
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "database_encryption"
  }
}

# IAM bindings for secrets access
resource "google_secret_manager_secret_iam_binding" "firebase_config_access" {
  secret_id = google_secret_manager_secret.firebase_config.secret_id
  role      = "roles/secretmanager.secretAccessor"

  members = [
    "serviceAccount:${google_service_account.cloud_run_services["ingest-api"].email}",
    "serviceAccount:${google_service_account.cloud_run_services["ai-orchestrator"].email}",
    "serviceAccount:${google_service_account.cloud_run_services["alm-adapters"].email}",
  ]
}

resource "google_secret_manager_secret_iam_binding" "alm_secrets_access" {
  for_each = toset([
    google_secret_manager_secret.jira_api_token.secret_id,
    google_secret_manager_secret.ado_pat.secret_id,
    google_secret_manager_secret.polarion_credentials.secret_id
  ])
  
  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"

  members = [
    "serviceAccount:${google_service_account.cloud_run_services["alm-adapters"].email}",
  ]
}

resource "google_secret_manager_secret_iam_binding" "jwt_key_access" {
  secret_id = google_secret_manager_secret.jwt_signing_key.secret_id
  role      = "roles/secretmanager.secretAccessor"

  members = [
    "serviceAccount:${google_service_account.cloud_run_services["ingest-api"].email}",
    "serviceAccount:${google_service_account.cloud_run_services["ai-orchestrator"].email}",
    "serviceAccount:${google_service_account.cloud_run_services["alm-adapters"].email}",
  ]
}
