# Document AI processor for parsing uploaded documents
resource "google_document_ai_processor" "layout_parser" {
  location     = var.document_ai_location
  display_name = "Healthcare Document Layout Parser"
  type         = "LAYOUT_PARSER_PROCESSOR"
  
  depends_on = [google_project_service.apis]
}

# Vertex AI Vector Search index for RAG
resource "google_vertex_ai_index" "requirements_embeddings" {
  region       = var.vertex_ai_location
  display_name = "Requirements Embeddings Index"
  description  = "Vector search index for requirements embeddings"
  
  metadata {
    contents_delta_uri = "gs://${google_storage_bucket.processed_files.name}/embeddings/"
    config {
      dimensions = 768
      approximate_neighbors_count = 150
      distance_measure_type = "DOT_PRODUCT_DISTANCE"
      algorithm_config {
        tree_ah_config {
          leaf_node_embedding_count = 500
          leaf_nodes_to_search_percent = 7
        }
      }
    }
  }
  
  labels = {
    environment = var.environment
    purpose     = "rag"
  }
}

# Vertex AI Index Endpoint
resource "google_vertex_ai_index_endpoint" "requirements_endpoint" {
  region       = var.vertex_ai_location
  display_name = "Requirements Search Endpoint"
  description  = "Endpoint for requirements vector search"
  
  labels = {
    environment = var.environment
    purpose     = "rag"
  }
}

# Deploy index to endpoint
resource "google_vertex_ai_index_endpoint_deployed_index" "requirements_deployed" {
  index_endpoint = google_vertex_ai_index_endpoint.requirements_endpoint.id
  index          = google_vertex_ai_index.requirements_embeddings.id
  deployed_index_id = "requirements_index_${var.environment}"
  
  display_name = "Deployed Requirements Index"
  
  dedicated_resources {
    machine_spec {
      machine_type = "n1-standard-2"
    }
    min_replica_count = 1
    max_replica_count = 3
  }
}

# Vertex AI Feature Store for model features
resource "google_vertex_ai_featurestore" "compliance_features" {
  name     = "compliance-features-${var.environment}"
  region   = var.vertex_ai_location
  
  labels = {
    environment = var.environment
    purpose     = "ml_features"
  }
  
  online_serving_config {
    fixed_node_count = 1
  }
  
  dynamic "encryption_spec" {
    for_each = var.enable_cmek ? [1] : []
    content {
      kms_key_name = google_kms_crypto_key.storage_key[0].id
    }
  }
}

# Feature store entity type for requirements
resource "google_vertex_ai_featurestore_entitytype" "requirements" {
  name         = "requirements"
  featurestore = google_vertex_ai_featurestore.compliance_features.id
  
  labels = {
    environment = var.environment
  }
  
  monitoring_config {
    snapshot_analysis {
      disabled = false
      monitoring_interval_days = 1
    }
    
    categorical_threshold_config {
      value = 0.3
    }
    
    numerical_threshold_config {
      value = 0.3
    }
  }
}

# Features for requirements entity
resource "google_vertex_ai_featurestore_entitytype_feature" "requirement_features" {
  for_each = toset([
    "text_length",
    "complexity_score", 
    "risk_score",
    "compliance_tags_count",
    "normative_indicator"
  ])
  
  name       = each.key
  entitytype = google_vertex_ai_featurestore_entitytype.requirements.id
  
  value_type = each.key == "normative_indicator" ? "BOOL" : "DOUBLE"
  
  labels = {
    environment = var.environment
    feature_type = "requirement"
  }
}
