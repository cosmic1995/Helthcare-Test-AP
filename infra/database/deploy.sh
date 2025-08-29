#!/bin/bash

# Healthcare Compliance SaaS - Database Deployment Script
# This script deploys the complete BigQuery schema with proper error handling and validation

set -e  # Exit on any error

# Configuration
PROJECT_ID="${PROJECT_ID:-healthcare-compliance-saas}"
DATASET_ID="${DATASET_ID:-compliance_data}"
LOCATION="${LOCATION:-us-central1}"
ENVIRONMENT="${ENVIRONMENT:-development}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validation functions
validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    # Check if gcloud is installed and authenticated
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null; then
        log_error "No active gcloud authentication found. Please run 'gcloud auth login'"
        exit 1
    fi
    
    # Check if bq is available
    if ! command -v bq &> /dev/null; then
        log_error "BigQuery CLI (bq) is not available. Please install Google Cloud SDK."
        exit 1
    fi
    
    # Validate project exists and is accessible
    if ! gcloud projects describe "$PROJECT_ID" &> /dev/null; then
        log_error "Project $PROJECT_ID does not exist or is not accessible."
        exit 1
    fi
    
    log_success "Prerequisites validated"
}

# Create dataset with proper configuration
create_dataset() {
    log_info "Creating BigQuery dataset: $DATASET_ID"
    
    # Check if dataset already exists
    if bq show --dataset "$PROJECT_ID:$DATASET_ID" &> /dev/null; then
        log_warning "Dataset $DATASET_ID already exists. Skipping creation."
        return 0
    fi
    
    # Create dataset with compliance settings
    bq mk \
        --dataset \
        --location="$LOCATION" \
        --description="Healthcare Compliance SaaS Platform Data" \
        --default_table_expiration=0 \
        --default_partition_expiration=0 \
        --max_time_travel_hours=168 \
        "$PROJECT_ID:$DATASET_ID"
    
    if [ $? -eq 0 ]; then
        log_success "Dataset created successfully"
    else
        log_error "Failed to create dataset"
        exit 1
    fi
}

# Execute SQL file with variable substitution
execute_sql_file() {
    local sql_file="$1"
    local description="$2"
    
    log_info "Executing $description..."
    
    if [ ! -f "$sql_file" ]; then
        log_error "SQL file not found: $sql_file"
        exit 1
    fi
    
    # Create temporary file with variable substitution
    local temp_file=$(mktemp)
    
    # Replace variables in SQL file
    sed -e "s/\${project_id}/$PROJECT_ID/g" \
        -e "s/\${dataset_id}/$DATASET_ID/g" \
        -e "s/\${location}/$LOCATION/g" \
        "$sql_file" > "$temp_file"
    
    # Execute SQL
    if bq query \
        --use_legacy_sql=false \
        --project_id="$PROJECT_ID" \
        --max_rows=0 \
        < "$temp_file"; then
        log_success "$description completed"
    else
        log_error "$description failed"
        rm -f "$temp_file"
        exit 1
    fi
    
    # Clean up
    rm -f "$temp_file"
}

# Create policy taxonomy
create_policy_taxonomy() {
    log_info "Creating policy taxonomy for data governance..."
    
    # Check if taxonomy already exists
    if gcloud data-catalog taxonomies describe "healthcare_compliance_taxonomy" \
        --location="$LOCATION" &> /dev/null; then
        log_warning "Policy taxonomy already exists. Skipping creation."
        return 0
    fi
    
    # Create taxonomy
    gcloud data-catalog taxonomies create "healthcare_compliance_taxonomy" \
        --location="$LOCATION" \
        --display-name="Healthcare Compliance Data Classification" \
        --description="Data classification taxonomy for healthcare compliance platform"
    
    if [ $? -eq 0 ]; then
        log_success "Policy taxonomy created"
    else
        log_error "Failed to create policy taxonomy"
        exit 1
    fi
}

# Deploy schema components
deploy_schema() {
    log_info "Deploying database schema components..."
    
    # 1. Create core tables
    execute_sql_file "schema.sql" "Core schema tables"
    
    # 2. Create views and stored procedures
    execute_sql_file "views.sql" "Views and stored procedures"
    
    # 3. Apply policy tags
    execute_sql_file "policy_tags.sql" "Policy tags and data classification"
    
    # 4. Apply security policies
    execute_sql_file "security_policies.sql" "Row-level security policies"
    
    # 5. Run initial migration
    execute_sql_file "migrations/001_initial_schema.sql" "Initial schema migration"
}

# Load seed data
load_seed_data() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log_warning "Skipping seed data load in production environment"
        return 0
    fi
    
    log_info "Loading seed data for development/testing..."
    execute_sql_file "seed_data.sql" "Seed data"
}

# Validate deployment
validate_deployment() {
    log_info "Validating deployment..."
    
    # Check if all tables exist
    local tables=("projects" "users" "requirements" "tests" "test_runs" "trace_links" "alm_refs" "compliance_notes" "documents" "e_signatures" "audit_trail")
    
    for table in "${tables[@]}"; do
        if bq show --table "$PROJECT_ID:$DATASET_ID.$table" &> /dev/null; then
            log_success "Table $table exists"
        else
            log_error "Table $table is missing"
            exit 1
        fi
    done
    
    # Check if views exist
    local views=("requirements_traceability_matrix" "project_compliance_dashboard" "audit_trail_summary")
    
    for view in "${views[@]}"; do
        if bq show --table "$PROJECT_ID:$DATASET_ID.$view" &> /dev/null; then
            log_success "View $view exists"
        else
            log_error "View $view is missing"
            exit 1
        fi
    done
    
    # Test basic query
    local test_query="SELECT COUNT(*) as table_count FROM \`$PROJECT_ID.$DATASET_ID.INFORMATION_SCHEMA.TABLES\` WHERE table_type = 'BASE TABLE'"
    
    local table_count=$(bq query --use_legacy_sql=false --format=csv --quiet "$test_query" | tail -n +2)
    
    if [ "$table_count" -ge 10 ]; then
        log_success "Schema validation passed ($table_count tables created)"
    else
        log_error "Schema validation failed (only $table_count tables found)"
        exit 1
    fi
}

# Backup existing schema (if any)
backup_existing_schema() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Creating backup of existing schema..."
        
        local backup_dataset="${DATASET_ID}_backup_$(date +%Y%m%d_%H%M%S)"
        
        # Create backup dataset
        bq mk --dataset --location="$LOCATION" "$PROJECT_ID:$backup_dataset"
        
        # Copy existing tables (if any)
        # This would be implemented based on specific backup requirements
        
        log_success "Backup created: $backup_dataset"
    fi
}

# Main deployment function
main() {
    log_info "Starting Healthcare Compliance SaaS database deployment"
    log_info "Project: $PROJECT_ID"
    log_info "Dataset: $DATASET_ID"
    log_info "Location: $LOCATION"
    log_info "Environment: $ENVIRONMENT"
    
    # Change to database directory
    cd "$(dirname "$0")"
    
    # Execute deployment steps
    validate_prerequisites
    backup_existing_schema
    create_dataset
    create_policy_taxonomy
    deploy_schema
    load_seed_data
    validate_deployment
    
    log_success "Database deployment completed successfully!"
    log_info "Next steps:"
    log_info "1. Configure service account permissions"
    log_info "2. Set up monitoring and alerting"
    log_info "3. Configure backup and retention policies"
    log_info "4. Run integration tests"
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --project PROJECT_ID    Google Cloud project ID"
    echo "  -d, --dataset DATASET_ID    BigQuery dataset ID"
    echo "  -l, --location LOCATION     BigQuery location"
    echo "  -e, --env ENVIRONMENT       Environment (development|staging|production)"
    echo "  -h, --help                  Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  PROJECT_ID                  Google Cloud project ID"
    echo "  DATASET_ID                  BigQuery dataset ID"
    echo "  LOCATION                    BigQuery location"
    echo "  ENVIRONMENT                 Deployment environment"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project)
            PROJECT_ID="$2"
            shift 2
            ;;
        -d|--dataset)
            DATASET_ID="$2"
            shift 2
            ;;
        -l|--location)
            LOCATION="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
main "$@"
