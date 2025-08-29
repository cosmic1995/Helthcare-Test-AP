# KMS Key Ring for Customer Managed Encryption Keys (CMEK)
resource "google_kms_key_ring" "healthcare_compliance" {
  count    = var.enable_cmek ? 1 : 0
  name     = "healthcare-compliance-${var.environment}"
  location = var.data_residency_region
}

# Storage encryption key
resource "google_kms_crypto_key" "storage_key" {
  count           = var.enable_cmek ? 1 : 0
  name            = "storage-encryption-key"
  key_ring        = google_kms_key_ring.healthcare_compliance[0].id
  rotation_period = "7776000s" # 90 days

  version_template {
    algorithm = "GOOGLE_SYMMETRIC_ENCRYPTION"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# BigQuery encryption key
resource "google_kms_crypto_key" "bigquery_key" {
  count           = var.enable_cmek ? 1 : 0
  name            = "bigquery-encryption-key"
  key_ring        = google_kms_key_ring.healthcare_compliance[0].id
  rotation_period = "7776000s" # 90 days

  version_template {
    algorithm = "GOOGLE_SYMMETRIC_ENCRYPTION"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Pub/Sub encryption key
resource "google_kms_crypto_key" "pubsub_key" {
  count           = var.enable_cmek ? 1 : 0
  name            = "pubsub-encryption-key"
  key_ring        = google_kms_key_ring.healthcare_compliance[0].id
  rotation_period = "7776000s" # 90 days

  version_template {
    algorithm = "GOOGLE_SYMMETRIC_ENCRYPTION"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# IAM bindings for service accounts to use KMS keys
resource "google_kms_crypto_key_iam_binding" "storage_key_binding" {
  count         = var.enable_cmek ? 1 : 0
  crypto_key_id = google_kms_crypto_key.storage_key[0].id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"

  members = [
    "serviceAccount:service-${local.project_number}@gs-project-accounts.iam.gserviceaccount.com",
    "serviceAccount:${google_service_account.cloud_run_services["ingest-api"].email}",
  ]
}

resource "google_kms_crypto_key_iam_binding" "bigquery_key_binding" {
  count         = var.enable_cmek ? 1 : 0
  crypto_key_id = google_kms_crypto_key.bigquery_key[0].id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"

  members = [
    "serviceAccount:bq-${local.project_number}@bigquery-encryption.iam.gserviceaccount.com",
    "serviceAccount:${google_service_account.cloud_run_services["ai-orchestrator"].email}",
  ]
}

resource "google_kms_crypto_key_iam_binding" "pubsub_key_binding" {
  count         = var.enable_cmek ? 1 : 0
  crypto_key_id = google_kms_crypto_key.pubsub_key[0].id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"

  members = [
    "serviceAccount:service-${local.project_number}@gcp-sa-pubsub.iam.gserviceaccount.com",
  ]
}
