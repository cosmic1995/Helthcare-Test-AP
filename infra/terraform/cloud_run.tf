# Cloud Run services
resource "google_cloud_run_service" "services" {
  for_each = toset(local.services)
  
  name     = "healthcare-${each.key}-${var.environment}"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.cloud_run_services[each.key].email
      
      containers {
        image = "gcr.io/${var.project_id}/healthcare-${each.key}:latest"
        
        ports {
          container_port = 8080
        }
        
        resources {
          limits = {
            cpu    = var.cpu_limit
            memory = var.memory_limit
          }
        }
        
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
        
        env {
          name  = "PROJECT_ID"
          value = var.project_id
        }
        
        env {
          name  = "REGION"
          value = var.region
        }
        
        env {
          name  = "BIGQUERY_DATASET"
          value = google_bigquery_dataset.healthcare_compliance.dataset_id
        }
        
        env {
          name = "FIREBASE_CONFIG"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.firebase_config.secret_id
              key  = "latest"
            }
          }
        }
        
        # Service-specific environment variables
        dynamic "env" {
          for_each = each.key == "ingest-api" ? [1] : []
          content {
            name  = "INCOMING_BUCKET"
            value = google_storage_bucket.incoming_files.name
          }
        }
        
        dynamic "env" {
          for_each = each.key == "ingest-api" ? [1] : []
          content {
            name  = "PROCESSED_BUCKET"
            value = google_storage_bucket.processed_files.name
          }
        }
        
        dynamic "env" {
          for_each = each.key == "ingest-api" ? [1] : []
          content {
            name  = "DEIDENTIFIED_BUCKET"
            value = google_storage_bucket.deidentified_files.name
          }
        }
        
        dynamic "env" {
          for_each = each.key == "ingest-api" ? [1] : []
          content {
            name  = "DOCUMENT_AI_PROCESSOR"
            value = google_document_ai_processor.layout_parser.id
          }
        }
        
        dynamic "env" {
          for_each = each.key == "ai-orchestrator" ? [1] : []
          content {
            name  = "VERTEX_AI_LOCATION"
            value = var.vertex_ai_location
          }
        }
        
        dynamic "env" {
          for_each = each.key == "ai-orchestrator" ? [1] : []
          content {
            name  = "VECTOR_SEARCH_ENDPOINT"
            value = google_vertex_ai_index_endpoint.requirements_endpoint.name
          }
        }
        
        dynamic "env" {
          for_each = each.key == "ai-orchestrator" ? [1] : []
          content {
            name  = "DEPLOYED_INDEX_ID"
            value = google_vertex_ai_index_endpoint_deployed_index.requirements_deployed.deployed_index_id
          }
        }
        
        # Pub/Sub topic environment variables
        env {
          name  = "PUBSUB_FILE_UPLOADED_TOPIC"
          value = google_pubsub_topic.file_uploaded.name
        }
        
        env {
          name  = "PUBSUB_DOCUMENT_PARSED_TOPIC"
          value = google_pubsub_topic.document_parsed.name
        }
        
        env {
          name  = "PUBSUB_DLP_COMPLETED_TOPIC"
          value = google_pubsub_topic.dlp_completed.name
        }
        
        env {
          name  = "PUBSUB_TEST_GENERATION_TOPIC"
          value = google_pubsub_topic.test_generation_requested.name
        }
        
        env {
          name  = "PUBSUB_TEST_APPROVED_TOPIC"
          value = google_pubsub_topic.test_approved.name
        }
        
        env {
          name  = "PUBSUB_ALM_SYNC_TOPIC"
          value = google_pubsub_topic.alm_sync_requested.name
        }
      }
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.min_instances
        "autoscaling.knative.dev/maxScale" = var.max_instances
        "run.googleapis.com/execution-environment" = "gen2"
        "run.googleapis.com/cpu-throttling" = "false"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.apis,
    google_service_account.cloud_run_services
  ]
}

# IAM policy for Cloud Run services (allow unauthenticated for webhooks)
resource "google_cloud_run_service_iam_binding" "public_access" {
  for_each = toset(local.services)
  
  location = google_cloud_run_service.services[each.key].location
  project  = google_cloud_run_service.services[each.key].project
  service  = google_cloud_run_service.services[each.key].name
  role     = "roles/run.invoker"

  members = [
    "allUsers",
  ]
}

# API Gateway for unified API endpoint
resource "google_api_gateway_api" "healthcare_api" {
  provider = google-beta
  api_id   = "healthcare-compliance-api-${var.environment}"
  project  = var.project_id
}

resource "google_api_gateway_api_config" "healthcare_api_config" {
  provider      = google-beta
  api           = google_api_gateway_api.healthcare_api.api_id
  api_config_id = "healthcare-api-config-${var.environment}"
  project       = var.project_id

  openapi_documents {
    document {
      path     = "openapi.yaml"
      contents = base64encode(file("../../shared/openapi.yaml"))
    }
  }

  gateway_config {
    backend_config {
      google_service_account = google_service_account.api_gateway.email
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_api_gateway_gateway" "healthcare_gateway" {
  provider   = google-beta
  api_config = google_api_gateway_api_config.healthcare_api_config.id
  gateway_id = "healthcare-gateway-${var.environment}"
  region     = var.region
  project    = var.project_id

  labels = {
    environment = var.environment
    purpose     = "api_gateway"
  }
}

# Service account for API Gateway
resource "google_service_account" "api_gateway" {
  account_id   = "healthcare-api-gateway-${var.environment}"
  display_name = "Healthcare API Gateway Service Account"
  description  = "Service account for API Gateway"
}

resource "google_project_iam_member" "api_gateway_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.api_gateway.email}"
}
