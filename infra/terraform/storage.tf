# Cloud Storage buckets for file storage
resource "google_storage_bucket" "incoming_files" {
  name          = "${var.project_id}-incoming-files-${var.environment}"
  location      = var.data_residency_region
  force_destroy = false

  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = var.retention_days
    }
    action {
      type = "Delete"
    }
  }

  dynamic "encryption" {
    for_each = var.enable_cmek ? [1] : []
    content {
      default_kms_key_name = google_kms_crypto_key.storage_key[0].id
    }
  }

  labels = {
    environment = var.environment
    purpose     = "incoming-files"
    compliance  = "healthcare"
  }
}

resource "google_storage_bucket" "processed_files" {
  name          = "${var.project_id}-processed-files-${var.environment}"
  location      = var.data_residency_region
  force_destroy = false

  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = var.retention_days
    }
    action {
      type = "Delete"
    }
  }

  dynamic "encryption" {
    for_each = var.enable_cmek ? [1] : []
    content {
      default_kms_key_name = google_kms_crypto_key.storage_key[0].id
    }
  }

  labels = {
    environment = var.environment
    purpose     = "processed-files"
    compliance  = "healthcare"
  }
}

resource "google_storage_bucket" "deidentified_files" {
  name          = "${var.project_id}-deidentified-files-${var.environment}"
  location      = var.data_residency_region
  force_destroy = false

  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = var.retention_days
    }
    action {
      type = "Delete"
    }
  }

  dynamic "encryption" {
    for_each = var.enable_cmek ? [1] : []
    content {
      default_kms_key_name = google_kms_crypto_key.storage_key[0].id
    }
  }

  labels = {
    environment = var.environment
    purpose     = "deidentified-files"
    compliance  = "healthcare"
  }
}

# IAM for storage buckets
resource "google_storage_bucket_iam_binding" "incoming_files_admin" {
  bucket = google_storage_bucket.incoming_files.name
  role   = "roles/storage.objectAdmin"

  members = [
    "serviceAccount:${google_service_account.cloud_run_services["ingest-api"].email}",
  ]
}

resource "google_storage_bucket_iam_binding" "processed_files_admin" {
  bucket = google_storage_bucket.processed_files.name
  role   = "roles/storage.objectAdmin"

  members = [
    "serviceAccount:${google_service_account.cloud_run_services["ingest-api"].email}",
    "serviceAccount:${google_service_account.cloud_run_services["ai-orchestrator"].email}",
  ]
}

resource "google_storage_bucket_iam_binding" "deidentified_files_admin" {
  bucket = google_storage_bucket.deidentified_files.name
  role   = "roles/storage.objectAdmin"

  members = [
    "serviceAccount:${google_service_account.cloud_run_services["ingest-api"].email}",
    "serviceAccount:${google_service_account.cloud_run_services["ai-orchestrator"].email}",
  ]
}
