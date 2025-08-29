variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment (staging, prod)"
  type        = string
  default     = "staging"
}

variable "data_residency_region" {
  description = "Data residency region for compliance"
  type        = string
  default     = "us-central1"
  validation {
    condition     = contains(["us-central1", "europe-west1"], var.data_residency_region)
    error_message = "Data residency region must be us-central1 or europe-west1."
  }
}

variable "enable_cmek" {
  description = "Enable Customer Managed Encryption Keys"
  type        = bool
  default     = true
}

variable "enable_dlp" {
  description = "Enable Data Loss Prevention"
  type        = bool
  default     = true
}

variable "retention_days" {
  description = "Data retention period in days"
  type        = number
  default     = 2555  # 7 years for healthcare compliance
}

variable "allowed_domains" {
  description = "Allowed domains for CORS and authentication"
  type        = list(string)
  default     = ["localhost:3000", "*.healthcare-compliance.com"]
}

variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
}

variable "cpu_limit" {
  description = "CPU limit for Cloud Run services"
  type        = string
  default     = "2"
}

variable "memory_limit" {
  description = "Memory limit for Cloud Run services"
  type        = string
  default     = "4Gi"
}

variable "document_ai_location" {
  description = "Document AI processor location"
  type        = string
  default     = "us"
}

variable "vertex_ai_location" {
  description = "Vertex AI location"
  type        = string
  default     = "us-central1"
}
