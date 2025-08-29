# Pub/Sub topics for event-driven processing
resource "google_pubsub_topic" "file_uploaded" {
  name = "file-uploaded-${var.environment}"
  
  dynamic "kms_key_name" {
    for_each = var.enable_cmek ? [1] : []
    content {
      kms_key_name = google_kms_crypto_key.pubsub_key[0].id
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "file_processing"
  }
}

resource "google_pubsub_topic" "document_parsed" {
  name = "document-parsed-${var.environment}"
  
  dynamic "kms_key_name" {
    for_each = var.enable_cmek ? [1] : []
    content {
      kms_key_name = google_kms_crypto_key.pubsub_key[0].id
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "document_processing"
  }
}

resource "google_pubsub_topic" "dlp_completed" {
  name = "dlp-completed-${var.environment}"
  
  dynamic "kms_key_name" {
    for_each = var.enable_cmek ? [1] : []
    content {
      kms_key_name = google_kms_crypto_key.pubsub_key[0].id
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "dlp_processing"
  }
}

resource "google_pubsub_topic" "test_generation_requested" {
  name = "test-generation-requested-${var.environment}"
  
  dynamic "kms_key_name" {
    for_each = var.enable_cmek ? [1] : []
    content {
      kms_key_name = google_kms_crypto_key.pubsub_key[0].id
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "ai_processing"
  }
}

resource "google_pubsub_topic" "test_approved" {
  name = "test-approved-${var.environment}"
  
  dynamic "kms_key_name" {
    for_each = var.enable_cmek ? [1] : []
    content {
      kms_key_name = google_kms_crypto_key.pubsub_key[0].id
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "approval_workflow"
  }
}

resource "google_pubsub_topic" "alm_sync_requested" {
  name = "alm-sync-requested-${var.environment}"
  
  dynamic "kms_key_name" {
    for_each = var.enable_cmek ? [1] : []
    content {
      kms_key_name = google_kms_crypto_key.pubsub_key[0].id
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "alm_integration"
  }
}

# Subscriptions for ingest-api service
resource "google_pubsub_subscription" "ingest_file_uploaded" {
  name  = "ingest-file-uploaded-${var.environment}"
  topic = google_pubsub_topic.file_uploaded.name
  
  ack_deadline_seconds = 600
  message_retention_duration = "604800s" # 7 days
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
  
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }
  
  push_config {
    push_endpoint = "https://${google_cloud_run_service.services["ingest-api"].status[0].url}/webhooks/file-uploaded"
    
    oidc_token {
      service_account_email = google_service_account.cloud_run_services["ingest-api"].email
    }
  }
}

# Subscriptions for ai-orchestrator service
resource "google_pubsub_subscription" "ai_document_parsed" {
  name  = "ai-document-parsed-${var.environment}"
  topic = google_pubsub_topic.document_parsed.name
  
  ack_deadline_seconds = 600
  message_retention_duration = "604800s"
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
  
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }
  
  push_config {
    push_endpoint = "https://${google_cloud_run_service.services["ai-orchestrator"].status[0].url}/webhooks/document-parsed"
    
    oidc_token {
      service_account_email = google_service_account.cloud_run_services["ai-orchestrator"].email
    }
  }
}

resource "google_pubsub_subscription" "ai_dlp_completed" {
  name  = "ai-dlp-completed-${var.environment}"
  topic = google_pubsub_topic.dlp_completed.name
  
  ack_deadline_seconds = 600
  message_retention_duration = "604800s"
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
  
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }
  
  push_config {
    push_endpoint = "https://${google_cloud_run_service.services["ai-orchestrator"].status[0].url}/webhooks/dlp-completed"
    
    oidc_token {
      service_account_email = google_service_account.cloud_run_services["ai-orchestrator"].email
    }
  }
}

resource "google_pubsub_subscription" "ai_test_generation" {
  name  = "ai-test-generation-${var.environment}"
  topic = google_pubsub_topic.test_generation_requested.name
  
  ack_deadline_seconds = 1800 # 30 minutes for AI processing
  message_retention_duration = "604800s"
  
  retry_policy {
    minimum_backoff = "30s"
    maximum_backoff = "1800s"
  }
  
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 3
  }
  
  push_config {
    push_endpoint = "https://${google_cloud_run_service.services["ai-orchestrator"].status[0].url}/webhooks/generate-tests"
    
    oidc_token {
      service_account_email = google_service_account.cloud_run_services["ai-orchestrator"].email
    }
  }
}

# Subscriptions for alm-adapters service
resource "google_pubsub_subscription" "alm_test_approved" {
  name  = "alm-test-approved-${var.environment}"
  topic = google_pubsub_topic.test_approved.name
  
  ack_deadline_seconds = 300
  message_retention_duration = "604800s"
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "300s"
  }
  
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }
  
  push_config {
    push_endpoint = "https://${google_cloud_run_service.services["alm-adapters"].status[0].url}/webhooks/test-approved"
    
    oidc_token {
      service_account_email = google_service_account.cloud_run_services["alm-adapters"].email
    }
  }
}

resource "google_pubsub_subscription" "alm_sync_requested" {
  name  = "alm-sync-requested-${var.environment}"
  topic = google_pubsub_topic.alm_sync_requested.name
  
  ack_deadline_seconds = 600
  message_retention_duration = "604800s"
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
  
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }
  
  push_config {
    push_endpoint = "https://${google_cloud_run_service.services["alm-adapters"].status[0].url}/webhooks/sync-requested"
    
    oidc_token {
      service_account_email = google_service_account.cloud_run_services["alm-adapters"].email
    }
  }
}

# Dead letter topic for failed messages
resource "google_pubsub_topic" "dead_letter" {
  name = "dead-letter-${var.environment}"
  
  dynamic "kms_key_name" {
    for_each = var.enable_cmek ? [1] : []
    content {
      kms_key_name = google_kms_crypto_key.pubsub_key[0].id
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "dead_letter"
  }
}

# Dead letter subscription for monitoring
resource "google_pubsub_subscription" "dead_letter_monitoring" {
  name  = "dead-letter-monitoring-${var.environment}"
  topic = google_pubsub_topic.dead_letter.name
  
  ack_deadline_seconds = 60
  message_retention_duration = "2592000s" # 30 days
  
  # No push config - this will be pulled by monitoring systems
}
