-- Healthcare Compliance SaaS - Policy Tags and Data Governance
-- This file defines policy tags for column-level security and data classification

-- ==============================================================================
-- POLICY TAG TAXONOMY
-- Create taxonomy for data classification and access control
-- ==============================================================================

-- Create taxonomy for healthcare compliance data classification
CREATE TAXONOMY IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy`
OPTIONS (
  display_name = "Healthcare Compliance Data Classification",
  description = "Data classification taxonomy for healthcare compliance platform with GDPR, HIPAA, and FDA requirements"
);

-- ==============================================================================
-- POLICY TAGS FOR PII/PHI DATA
-- ==============================================================================

-- Personal Identifiable Information (PII) - GDPR Article 4
CREATE POLICY TAG IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy.pii_data`
OPTIONS (
  display_name = "Personal Identifiable Information",
  description = "Data that can identify a natural person directly or indirectly (GDPR Art. 4)"
);

-- Protected Health Information (PHI) - HIPAA
CREATE POLICY TAG IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy.phi_data`
OPTIONS (
  display_name = "Protected Health Information", 
  description = "Individually identifiable health information (HIPAA 45 CFR 160.103)"
);

-- Sensitive Personal Data - GDPR Article 9
CREATE POLICY TAG IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy.sensitive_personal_data`
OPTIONS (
  display_name = "Sensitive Personal Data",
  description = "Special categories of personal data including health data (GDPR Art. 9)"
);

-- ==============================================================================
-- POLICY TAGS FOR COMPLIANCE LEVELS
-- ==============================================================================

-- FDA Regulated Data
CREATE POLICY TAG IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy.fda_regulated`
OPTIONS (
  display_name = "FDA Regulated Data",
  description = "Data subject to FDA regulations (21 CFR Part 11, QSR)"
);

-- ISO 13485 Quality Data
CREATE POLICY TAG IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy.iso13485_quality`
OPTIONS (
  display_name = "ISO 13485 Quality Data",
  description = "Quality management system data per ISO 13485"
);

-- IEC 62304 Software Lifecycle Data
CREATE POLICY TAG IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy.iec62304_software`
OPTIONS (
  display_name = "IEC 62304 Software Data",
  description = "Medical device software lifecycle data per IEC 62304"
);

-- ==============================================================================
-- POLICY TAGS FOR DATA SENSITIVITY
-- ==============================================================================

-- Public Data
CREATE POLICY TAG IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy.public_data`
OPTIONS (
  display_name = "Public Data",
  description = "Data that can be freely shared without restrictions"
);

-- Internal Data
CREATE POLICY TAG IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy.internal_data`
OPTIONS (
  display_name = "Internal Data",
  description = "Data for internal use within the organization"
);

-- Confidential Data
CREATE POLICY TAG IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy.confidential_data`
OPTIONS (
  display_name = "Confidential Data",
  description = "Sensitive business data requiring access controls"
);

-- Restricted Data
CREATE POLICY TAG IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy.restricted_data`
OPTIONS (
  display_name = "Restricted Data",
  description = "Highly sensitive data with strict access requirements"
);

-- ==============================================================================
-- POLICY TAGS FOR AUDIT AND INTEGRITY
-- ==============================================================================

-- Audit Required
CREATE POLICY TAG IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy.audit_required`
OPTIONS (
  display_name = "Audit Required",
  description = "Data that must be audited for compliance (21 CFR Part 11)"
);

-- Immutable Data
CREATE POLICY TAG IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy.immutable_data`
OPTIONS (
  display_name = "Immutable Data",
  description = "Data that cannot be modified after creation (regulatory records)"
);

-- Digital Signature Required
CREATE POLICY TAG IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy.signature_required`
OPTIONS (
  display_name = "Digital Signature Required",
  description = "Data requiring electronic signatures (21 CFR Part 11)"
);

-- ==============================================================================
-- POLICY TAGS FOR DATA RESIDENCY
-- ==============================================================================

-- EU Data Residency
CREATE POLICY TAG IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy.eu_residency`
OPTIONS (
  display_name = "EU Data Residency",
  description = "Data that must remain within EU boundaries (GDPR)"
);

-- US Data Residency
CREATE POLICY TAG IF NOT EXISTS `${project_id}.${location}.healthcare_compliance_taxonomy.us_residency`
OPTIONS (
  display_name = "US Data Residency",
  description = "Data that must remain within US boundaries (HIPAA, FDA)"
);

-- ==============================================================================
-- APPLY POLICY TAGS TO SCHEMA
-- ==============================================================================

-- Apply policy tags to users table
ALTER TABLE `${project_id}.${dataset_id}.users`
ALTER COLUMN email SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.pii_data"]),
ALTER COLUMN first_name SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.pii_data"]),
ALTER COLUMN last_name SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.pii_data"]),
ALTER COLUMN firebase_uid SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.confidential_data"]);

-- Apply policy tags to projects table
ALTER TABLE `${project_id}.${dataset_id}.projects`
ALTER COLUMN name SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.internal_data"]),
ALTER COLUMN compliance_standards SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.fda_regulated"]),
ALTER COLUMN encryption_key_id SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.restricted_data"]);

-- Apply policy tags to requirements table
ALTER TABLE `${project_id}.${dataset_id}.requirements`
ALTER COLUMN text SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.fda_regulated"]),
ALTER COLUMN std_tags SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.iso13485_quality"]),
ALTER COLUMN risk_class SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.audit_required"]);

-- Apply policy tags to tests table
ALTER TABLE `${project_id}.${dataset_id}.tests`
ALTER COLUMN gherkin SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.iec62304_software"]),
ALTER COLUMN std_tags SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.iso13485_quality"]),
ALTER COLUMN quality_score SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.audit_required"]);

-- Apply policy tags to test_runs table
ALTER TABLE `${project_id}.${dataset_id}.test_runs`
ALTER COLUMN result_summary SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.audit_required"]),
ALTER COLUMN evidence_files SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.immutable_data"]);

-- Apply policy tags to audit_trail table
ALTER TABLE `${project_id}.${dataset_id}.audit_trail`
ALTER COLUMN user_id SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.pii_data"]),
ALTER COLUMN ip_address SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.pii_data"]),
ALTER COLUMN old_values SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.audit_required"]),
ALTER COLUMN new_values SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.audit_required"]),
ALTER COLUMN signature SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.immutable_data"]);

-- Apply policy tags to e_signatures table
ALTER TABLE `${project_id}.${dataset_id}.e_signatures`
ALTER COLUMN signer_email SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.pii_data"]),
ALTER COLUMN signature_data SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.signature_required"]),
ALTER COLUMN signature_hash SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.immutable_data"]),
ALTER COLUMN digital_signature SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.immutable_data"]);

-- Apply policy tags to documents table
ALTER TABLE `${project_id}.${dataset_id}.documents`
ALTER COLUMN ai_extracted_text SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.confidential_data"]),
ALTER COLUMN dlp_findings SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.restricted_data"]),
ALTER COLUMN contains_pii SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.pii_data"]),
ALTER COLUMN contains_phi SET OPTIONS (policy_tags = ["${project_id}.${location}.healthcare_compliance_taxonomy.phi_data"]);
