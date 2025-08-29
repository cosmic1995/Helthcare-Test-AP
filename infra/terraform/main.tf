terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudkms.googleapis.com",
    "storage.googleapis.com",
    "bigquery.googleapis.com",
    "aiplatform.googleapis.com",
    "documentai.googleapis.com",
    "dlp.googleapis.com",
    "workflows.googleapis.com",
    "pubsub.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "cloudtrace.googleapis.com",
    "firebase.googleapis.com",
    "firestore.googleapis.com",
  ])

  service = each.value
  disable_on_destroy = false
}

# Data sources
data "google_project" "project" {}

# Local values
locals {
  project_number = data.google_project.project.number
  services = [
    "ingest-api",
    "ai-orchestrator", 
    "alm-adapters"
  ]
}
