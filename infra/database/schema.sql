-- Healthcare Compliance SaaS - BigQuery Schema DDL
-- This file contains the complete database schema for the healthcare compliance platform
-- Includes all tables, views, and stored procedures with proper compliance controls

-- ==============================================================================
-- PROJECTS TABLE
-- Core project information with compliance and organizational data
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `${project_id}.${dataset_id}.projects` (
  project_id STRING NOT NULL,
  name STRING NOT NULL,
  description STRING,
  organization_id STRING NOT NULL,
  compliance_standards ARRAY<STRING> NOT NULL,
  data_residency STRING NOT NULL DEFAULT 'US',
  encryption_key_id STRING,
  
  -- Project metadata
  project_type STRING NOT NULL DEFAULT 'medical_device',
  regulatory_class STRING, -- Class I, II, III for FDA
  risk_classification STRING, -- A, B, C, D per ISO 14971
  
  -- Lifecycle management
  lifecycle_stage STRING NOT NULL DEFAULT 'planning',
  approval_status STRING NOT NULL DEFAULT 'draft',
  approved_by STRING,
  approved_at TIMESTAMP,
  
  -- Access control
  owner_id STRING NOT NULL,
  visibility STRING NOT NULL DEFAULT 'private',
  allowed_domains ARRAY<STRING>,
  
  -- Audit fields
  created_by STRING NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  updated_by STRING NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Compliance tracking
  last_compliance_review TIMESTAMP,
  next_compliance_review TIMESTAMP,
  compliance_officer STRING,
  
  -- Soft delete
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_by STRING,
  deleted_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY organization_id, compliance_standards[OFFSET(0)];

-- ==============================================================================
-- USERS TABLE
-- User management with roles and compliance training tracking
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `${project_id}.${dataset_id}.users` (
  user_id STRING NOT NULL,
  firebase_uid STRING NOT NULL,
  email STRING NOT NULL,
  display_name STRING,
  
  -- Profile information
  first_name STRING,
  last_name STRING,
  job_title STRING,
  department STRING,
  organization_id STRING NOT NULL,
  
  -- Authentication and access
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  account_status STRING NOT NULL DEFAULT 'active',
  roles ARRAY<STRING> NOT NULL,
  permissions ARRAY<STRING>,
  
  -- Compliance training
  training_records ARRAY<STRUCT<
    training_type STRING,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP,
    certificate_id STRING
  >>,
  
  -- Security settings
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  last_login TIMESTAMP,
  login_count INTEGER NOT NULL DEFAULT 0,
  password_changed_at TIMESTAMP,
  
  -- Preferences
  timezone STRING DEFAULT 'UTC',
  language STRING DEFAULT 'en',
  notification_preferences JSON,
  
  -- Audit fields
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  
  -- Account lifecycle
  deactivated BOOLEAN NOT NULL DEFAULT FALSE,
  deactivated_by STRING,
  deactivated_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY organization_id, account_status;

-- ==============================================================================
-- REQUIREMENTS TABLE
-- Requirements with full traceability and compliance mapping
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `${project_id}.${dataset_id}.requirements` (
  req_id STRING NOT NULL,
  project_id STRING NOT NULL,
  
  -- Requirement content
  title STRING NOT NULL,
  text STRING NOT NULL,
  description STRING,
  
  -- Hierarchical structure
  parent_req_id STRING,
  section_path STRING,
  level INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER,
  
  -- Classification
  req_type STRING NOT NULL DEFAULT 'functional',
  category STRING,
  priority STRING NOT NULL DEFAULT 'medium',
  
  -- Risk and compliance
  risk_class STRING NOT NULL DEFAULT 'C',
  risk_level STRING,
  risk_rationale STRING,
  std_tags ARRAY<STRING> NOT NULL,
  normative BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Verification and validation
  verification_method STRING,
  validation_criteria STRING,
  acceptance_criteria STRING,
  
  -- Source information
  source_document STRING,
  source_section STRING,
  source_page INTEGER,
  external_id STRING,
  
  -- Status and workflow
  status STRING NOT NULL DEFAULT 'draft',
  review_status STRING NOT NULL DEFAULT 'pending',
  approval_status STRING NOT NULL DEFAULT 'pending',
  
  -- Assignees and reviewers
  assigned_to STRING,
  reviewed_by ARRAY<STRING>,
  approved_by STRING,
  
  -- Dates
  due_date DATE,
  review_date DATE,
  approval_date DATE,
  
  -- Change management
  change_reason STRING,
  impact_assessment STRING,
  
  -- AI processing metadata
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  ai_confidence_score FLOAT64,
  ai_processing_version STRING,
  
  -- Audit fields
  created_by STRING NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  updated_by STRING NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Soft delete
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_by STRING,
  deleted_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY project_id, std_tags[OFFSET(0)], risk_class;

-- ==============================================================================
-- TESTS TABLE
-- Test cases with full compliance and traceability information
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `${project_id}.${dataset_id}.tests` (
  test_id STRING NOT NULL,
  req_id STRING NOT NULL,
  project_id STRING NOT NULL,
  
  -- Test content
  title STRING NOT NULL,
  description STRING,
  gherkin STRING,
  
  -- Test structure
  preconditions ARRAY<STRING>,
  steps ARRAY<STRUCT<
    step_number INTEGER,
    action STRING,
    expected STRING,
    notes STRING
  >>,
  expected_summary STRING,
  postconditions ARRAY<STRING>,
  
  -- Test metadata
  test_type STRING NOT NULL DEFAULT 'functional',
  test_method STRING,
  test_level STRING,
  priority STRING NOT NULL DEFAULT 'medium',
  
  -- Execution information
  estimated_duration STRING,
  automation_level STRING NOT NULL DEFAULT 'manual',
  test_data_requirements STRING,
  environment_requirements STRING,
  
  -- Risk and compliance
  risk_refs ARRAY<STRING>,
  std_tags ARRAY<STRING> NOT NULL,
  compliance_notes STRING,
  
  -- Quality metrics
  quality_score FLOAT64,
  complexity_score FLOAT64,
  coverage_score FLOAT64,
  
  -- Status and workflow
  review_status STRING NOT NULL DEFAULT 'pending',
  approval_status STRING NOT NULL DEFAULT 'pending',
  
  -- Assignees and reviewers
  assigned_to STRING,
  reviewed_by ARRAY<STRING>,
  approved_by STRING,
  
  -- Dates
  review_date DATE,
  approval_date DATE,
  
  -- AI generation metadata
  generated_by_model STRING,
  generation_prompt STRING,
  ai_confidence_score FLOAT64,
  enhanced BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Audit fields
  created_by STRING NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  updated_by STRING NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Soft delete
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_by STRING,
  deleted_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY project_id, req_id, std_tags[OFFSET(0)];

-- ==============================================================================
-- TRACE_LINKS TABLE
-- Traceability matrix with bidirectional relationships
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `${project_id}.${dataset_id}.trace_links` (
  link_id STRING NOT NULL,
  project_id STRING NOT NULL,
  
  -- Link endpoints
  source_type STRING NOT NULL, -- requirement, test, defect, etc.
  source_id STRING NOT NULL,
  target_type STRING NOT NULL,
  target_id STRING NOT NULL,
  
  -- Link metadata
  link_type STRING NOT NULL, -- satisfies, verifies, derives, etc.
  relationship STRING,
  strength FLOAT64, -- confidence in the link
  
  -- Validation
  validated BOOLEAN NOT NULL DEFAULT FALSE,
  validation_method STRING,
  validation_confidence FLOAT64,
  
  -- Status
  status STRING NOT NULL DEFAULT 'active',
  
  -- Audit fields
  created_by STRING NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  updated_by STRING,
  updated_at TIMESTAMP,
  
  -- Soft delete
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_by STRING,
  deleted_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY project_id, source_type, target_type;

-- ==============================================================================
-- ALM_REFS TABLE
-- External ALM tool references and synchronization tracking
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `${project_id}.${dataset_id}.alm_refs` (
  ref_id STRING NOT NULL,
  project_id STRING NOT NULL,
  
  -- Internal reference
  internal_type STRING NOT NULL, -- requirement, test, etc.
  internal_id STRING NOT NULL,
  
  -- External ALM reference
  alm_type STRING NOT NULL, -- jira, azure_devops, polarion
  alm_project STRING NOT NULL,
  alm_item_id STRING NOT NULL,
  alm_item_key STRING,
  alm_item_url STRING,
  
  -- Synchronization metadata
  sync_status STRING NOT NULL DEFAULT 'pending',
  last_sync_at TIMESTAMP,
  sync_direction STRING NOT NULL DEFAULT 'bidirectional',
  
  -- Field mapping
  field_mapping JSON,
  
  -- Conflict resolution
  conflict_resolution_strategy STRING DEFAULT 'manual',
  last_conflict_at TIMESTAMP,
  conflict_resolved_by STRING,
  
  -- Audit fields
  created_by STRING NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  updated_by STRING,
  updated_at TIMESTAMP,
  
  -- Soft delete
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_by STRING,
  deleted_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY project_id, alm_type, sync_status;

-- ==============================================================================
-- TEST_RUNS TABLE
-- Test execution results and compliance evidence
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `${project_id}.${dataset_id}.test_runs` (
  run_id STRING NOT NULL,
  test_id STRING NOT NULL,
  project_id STRING NOT NULL,
  
  -- Execution metadata
  run_name STRING,
  run_description STRING,
  test_plan_id STRING,
  test_cycle_id STRING,
  
  -- Environment and setup
  environment STRING,
  test_data_version STRING,
  configuration JSON,
  
  -- Execution details
  executed_by STRING NOT NULL,
  executed_at TIMESTAMP NOT NULL,
  execution_duration INTEGER, -- seconds
  
  -- Results
  status STRING NOT NULL, -- passed, failed, blocked, skipped
  result_summary STRING,
  
  -- Step results
  step_results ARRAY<STRUCT<
    step_number INTEGER,
    status STRING,
    actual_result STRING,
    notes STRING,
    screenshot_url STRING,
    execution_time INTEGER
  >>,
  
  -- Evidence and attachments
  evidence_files ARRAY<STRING>,
  screenshots ARRAY<STRING>,
  logs ARRAY<STRING>,
  
  -- Defects and issues
  defects_found ARRAY<STRING>,
  issues_raised ARRAY<STRING>,
  
  -- Compliance and approval
  reviewed_by STRING,
  reviewed_at TIMESTAMP,
  approved_by STRING,
  approved_at TIMESTAMP,
  
  -- Audit fields
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  
  -- Soft delete
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_by STRING,
  deleted_at TIMESTAMP
)
PARTITION BY DATE(executed_at)
CLUSTER BY project_id, test_id, status;

-- ==============================================================================
-- COMPLIANCE_NOTES TABLE
-- Compliance annotations and regulatory comments
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `${project_id}.${dataset_id}.compliance_notes` (
  note_id STRING NOT NULL,
  project_id STRING NOT NULL,
  
  -- Reference to annotated item
  item_type STRING NOT NULL, -- requirement, test, run, etc.
  item_id STRING NOT NULL,
  
  -- Note content
  title STRING,
  content STRING NOT NULL,
  note_type STRING NOT NULL, -- compliance, risk, regulatory, etc.
  
  -- Compliance context
  standard STRING, -- ISO_13485, IEC_62304, etc.
  clause STRING,
  severity STRING,
  
  -- Regulatory information
  regulatory_authority STRING, -- FDA, CE, Health_Canada, etc.
  regulation_reference STRING,
  guidance_document STRING,
  
  -- Status and workflow
  status STRING NOT NULL DEFAULT 'active',
  priority STRING NOT NULL DEFAULT 'medium',
  
  -- Resolution
  resolution STRING,
  resolved_by STRING,
  resolved_at TIMESTAMP,
  
  -- Audit fields
  created_by STRING NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  updated_by STRING,
  updated_at TIMESTAMP,
  
  -- Soft delete
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_by STRING,
  deleted_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY project_id, standard, item_type;

-- ==============================================================================
-- AUDIT_TRAIL TABLE
-- Comprehensive audit logging for compliance and security
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `${project_id}.${dataset_id}.audit_trail` (
  audit_id STRING NOT NULL,
  
  -- Event identification
  event_type STRING NOT NULL,
  event_category STRING NOT NULL, -- security, compliance, data, system
  event_source STRING NOT NULL, -- service name
  
  -- User and session
  user_id STRING,
  session_id STRING,
  ip_address STRING,
  user_agent STRING,
  
  -- Resource information
  resource_type STRING,
  resource_id STRING,
  project_id STRING,
  
  -- Action details
  action STRING NOT NULL,
  outcome STRING NOT NULL, -- success, failure, error
  
  -- Data changes
  old_values JSON,
  new_values JSON,
  changed_fields ARRAY<STRING>,
  
  -- Context and metadata
  context JSON,
  metadata JSON,
  
  -- Risk and compliance
  risk_level STRING,
  compliance_impact STRING,
  
  -- Error information
  error_code STRING,
  error_message STRING,
  
  -- Timing
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  processing_time_ms INTEGER,
  
  -- Tracing
  trace_id STRING,
  span_id STRING,
  
  -- Data integrity
  checksum STRING,
  signature STRING
)
PARTITION BY DATE(timestamp)
CLUSTER BY event_category, user_id, project_id;

-- ==============================================================================
-- DOCUMENTS TABLE
-- Document management with version control and compliance tracking
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `${project_id}.${dataset_id}.documents` (
  document_id STRING NOT NULL,
  project_id STRING NOT NULL,
  
  -- Document metadata
  filename STRING NOT NULL,
  original_filename STRING NOT NULL,
  mime_type STRING NOT NULL,
  file_size INTEGER NOT NULL,
  
  -- Storage information
  storage_bucket STRING NOT NULL,
  storage_path STRING NOT NULL,
  encryption_key_id STRING,
  
  -- Document classification
  document_type STRING NOT NULL,
  classification STRING NOT NULL DEFAULT 'internal',
  sensitivity_level STRING,
  
  -- Version control
  version STRING NOT NULL DEFAULT '1.0',
  is_latest_version BOOLEAN NOT NULL DEFAULT TRUE,
  parent_document_id STRING,
  
  -- Processing status
  processing_status STRING NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMP,
  processing_error STRING,
  
  -- AI processing results
  ai_extracted_text STRING,
  ai_confidence_score FLOAT64,
  ai_processing_metadata JSON,
  
  -- DLP and security
  dlp_status STRING,
  dlp_findings JSON,
  contains_pii BOOLEAN NOT NULL DEFAULT FALSE,
  contains_phi BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Access control
  access_level STRING NOT NULL DEFAULT 'project',
  allowed_roles ARRAY<STRING>,
  
  -- Compliance and retention
  retention_period INTEGER, -- days
  retention_reason STRING,
  legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Audit fields
  uploaded_by STRING NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  updated_by STRING,
  updated_at TIMESTAMP,
  
  -- Soft delete
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_by STRING,
  deleted_at TIMESTAMP
)
PARTITION BY DATE(uploaded_at)
CLUSTER BY project_id, document_type, processing_status;

-- ==============================================================================
-- E_SIGNATURES TABLE
-- Electronic signatures for 21 CFR Part 11 compliance
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `${project_id}.${dataset_id}.e_signatures` (
  signature_id STRING NOT NULL,
  
  -- Signed item reference
  item_type STRING NOT NULL,
  item_id STRING NOT NULL,
  project_id STRING NOT NULL,
  
  -- Signer information
  signer_id STRING NOT NULL,
  signer_name STRING NOT NULL,
  signer_email STRING NOT NULL,
  signer_role STRING NOT NULL,
  
  -- Signature metadata
  signature_type STRING NOT NULL, -- approval, review, witness, etc.
  signature_method STRING NOT NULL, -- biometric, typed, drawn, etc.
  
  -- Signature data
  signature_data STRING, -- encrypted signature image/data
  signature_hash STRING NOT NULL,
  certificate_id STRING,
  
  -- Authentication
  authentication_method STRING NOT NULL,
  authentication_factors ARRAY<STRING>,
  
  -- Context and meaning
  signature_meaning STRING NOT NULL,
  signature_reason STRING,
  
  -- Timestamp and location
  signed_at TIMESTAMP NOT NULL,
  timezone STRING NOT NULL,
  ip_address STRING,
  location JSON,
  
  -- Verification
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_method STRING,
  verified_at TIMESTAMP,
  verified_by STRING,
  
  -- Legal and compliance
  legal_framework STRING NOT NULL DEFAULT 'CFR_PART_11',
  compliance_statement STRING,
  
  -- Integrity protection
  checksum STRING NOT NULL,
  digital_signature STRING,
  
  -- Audit fields
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(signed_at)
CLUSTER BY project_id, signer_id, signature_type;
