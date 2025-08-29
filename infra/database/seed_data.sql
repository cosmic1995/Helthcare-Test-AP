-- Healthcare Compliance SaaS - Seed Data
-- This file contains initial seed data for development and demo purposes

-- ==============================================================================
-- DEMO ORGANIZATIONS AND USERS
-- ==============================================================================

-- Insert demo organizations
INSERT INTO `${project_id}.${dataset_id}.projects` (
  project_id,
  name,
  description,
  organization_id,
  compliance_standards,
  data_residency,
  project_type,
  regulatory_class,
  risk_classification,
  lifecycle_stage,
  approval_status,
  owner_id,
  visibility,
  created_by,
  updated_by
) VALUES
-- MedTech Innovations Demo Project
(
  'proj_medtech_001',
  'CardioMonitor Pro - Class II Medical Device',
  'Continuous cardiac monitoring system with AI-powered arrhythmia detection for hospital and home use',
  'org_medtech_innovations',
  ['FDA_QMSR', 'ISO_13485', 'IEC_62304', 'ISO_14971', 'IEC_60601'],
  'US',
  'medical_device',
  'Class_II',
  'B',
  'development',
  'approved',
  'user_medtech_pm',
  'private',
  'user_medtech_pm',
  'user_medtech_pm'
),
-- Digital Health Solutions Demo Project
(
  'proj_dighealth_001',
  'TherapyTracker Mobile App - SaMD Class IIa',
  'Mobile application for tracking therapy compliance and patient outcomes in clinical trials',
  'org_digital_health_solutions',
  ['FDA_QMSR', 'ISO_13485', 'IEC_62304', 'GDPR', 'ISO_27001'],
  'EU',
  'software_medical_device',
  'Class_IIa',
  'B',
  'validation',
  'under_review',
  'user_dighealth_lead',
  'private',
  'user_dighealth_lead',
  'user_dighealth_lead'
),
-- BioTech Research Demo Project
(
  'proj_biotech_001',
  'GenomeSeq Analyzer - Class I Device',
  'Laboratory equipment for genetic sequencing analysis with cloud-based reporting platform',
  'org_biotech_research',
  ['FDA_QMSR', 'ISO_13485', 'ISO_15189', 'CLIA'],
  'US',
  'medical_device',
  'Class_I',
  'A',
  'planning',
  'draft',
  'user_biotech_director',
  'private',
  'user_biotech_director',
  'user_biotech_director'
);

-- Insert demo users
INSERT INTO `${project_id}.${dataset_id}.users` (
  user_id,
  firebase_uid,
  email,
  display_name,
  first_name,
  last_name,
  job_title,
  department,
  organization_id,
  email_verified,
  account_status,
  roles,
  training_records,
  mfa_enabled,
  timezone,
  language
) VALUES
-- MedTech Innovations Users
(
  'user_medtech_pm',
  'firebase_medtech_pm_001',
  'sarah.johnson@medtechinnovations.com',
  'Sarah Johnson',
  'Sarah',
  'Johnson',
  'Senior Project Manager',
  'Product Development',
  'org_medtech_innovations',
  TRUE,
  'active',
  ['project_manager', 'quality_reviewer'],
  [
    STRUCT('ISO_13485_Training' as training_type, TIMESTAMP('2024-01-15 10:00:00') as completed_at, TIMESTAMP('2025-01-15 10:00:00') as expires_at, 'CERT_ISO13485_001' as certificate_id),
    STRUCT('FDA_QSR_Training' as training_type, TIMESTAMP('2024-02-20 14:30:00') as completed_at, TIMESTAMP('2025-02-20 14:30:00') as expires_at, 'CERT_FDA_QSR_001' as certificate_id)
  ],
  TRUE,
  'America/New_York',
  'en'
),
(
  'user_medtech_qa',
  'firebase_medtech_qa_001',
  'mike.chen@medtechinnovations.com',
  'Mike Chen',
  'Mike',
  'Chen',
  'Quality Assurance Manager',
  'Quality Assurance',
  'org_medtech_innovations',
  TRUE,
  'active',
  ['quality_manager', 'compliance_officer', 'test_reviewer'],
  [
    STRUCT('ISO_13485_Training' as training_type, TIMESTAMP('2024-01-10 09:00:00') as completed_at, TIMESTAMP('2025-01-10 09:00:00') as expires_at, 'CERT_ISO13485_002' as certificate_id),
    STRUCT('Risk_Management_Training' as training_type, TIMESTAMP('2024-03-05 11:00:00') as completed_at, TIMESTAMP('2025-03-05 11:00:00') as expires_at, 'CERT_RISK_001' as certificate_id)
  ],
  TRUE,
  'America/Los_Angeles',
  'en'
),
-- Digital Health Solutions Users
(
  'user_dighealth_lead',
  'firebase_dighealth_lead_001',
  'anna.mueller@digitalhealthsolutions.eu',
  'Anna Mueller',
  'Anna',
  'Mueller',
  'Technical Lead',
  'Software Engineering',
  'org_digital_health_solutions',
  TRUE,
  'active',
  ['technical_lead', 'software_architect'],
  [
    STRUCT('IEC_62304_Training' as training_type, TIMESTAMP('2024-01-20 13:00:00') as completed_at, TIMESTAMP('2025-01-20 13:00:00') as expires_at, 'CERT_IEC62304_001' as certificate_id),
    STRUCT('GDPR_Training' as training_type, TIMESTAMP('2024-02-15 16:00:00') as completed_at, TIMESTAMP('2025-02-15 16:00:00') as expires_at, 'CERT_GDPR_001' as certificate_id)
  ],
  TRUE,
  'Europe/Berlin',
  'de'
),
-- BioTech Research Users
(
  'user_biotech_director',
  'firebase_biotech_director_001',
  'david.kim@biotechresearch.com',
  'David Kim',
  'David',
  'Kim',
  'Research Director',
  'Research & Development',
  'org_biotech_research',
  TRUE,
  'active',
  ['admin', 'research_director', 'compliance_officer'],
  [
    STRUCT('CLIA_Training' as training_type, TIMESTAMP('2024-01-25 10:30:00') as completed_at, TIMESTAMP('2025-01-25 10:30:00') as expires_at, 'CERT_CLIA_001' as certificate_id),
    STRUCT('ISO_15189_Training' as training_type, TIMESTAMP('2024-03-10 14:00:00') as completed_at, TIMESTAMP('2025-03-10 14:00:00') as expires_at, 'CERT_ISO15189_001' as certificate_id)
  ],
  TRUE,
  'America/New_York',
  'en'
);

-- ==============================================================================
-- DEMO REQUIREMENTS
-- ==============================================================================

-- CardioMonitor Pro Requirements
INSERT INTO `${project_id}.${dataset_id}.requirements` (
  req_id,
  project_id,
  title,
  text,
  description,
  section_path,
  level,
  order_index,
  req_type,
  category,
  priority,
  risk_class,
  std_tags,
  normative,
  verification_method,
  status,
  review_status,
  approval_status,
  assigned_to,
  created_by,
  updated_by
) VALUES
(
  'req_cardio_001',
  'proj_medtech_001',
  'Heart Rate Monitoring Accuracy',
  'The system shall monitor heart rate with an accuracy of ±2 BPM or ±2% (whichever is greater) for heart rates between 30-300 BPM.',
  'Critical requirement for accurate cardiac monitoring to ensure patient safety and clinical efficacy.',
  'System Requirements/Performance/Accuracy',
  2,
  1,
  'functional',
  'performance',
  'high',
  'A',
  ['IEC_60601_2_27', 'ISO_13485', 'FDA_QMSR'],
  TRUE,
  'testing',
  'approved',
  'approved',
  'approved',
  'user_medtech_qa',
  'user_medtech_pm',
  'user_medtech_pm'
),
(
  'req_cardio_002',
  'proj_medtech_001',
  'Arrhythmia Detection Algorithm',
  'The system shall detect and classify common arrhythmias (atrial fibrillation, ventricular tachycardia, bradycardia, tachycardia) with a sensitivity ≥95% and specificity ≥90%.',
  'AI-powered arrhythmia detection is the core differentiating feature requiring high accuracy.',
  'System Requirements/AI Algorithm/Detection',
  2,
  2,
  'functional',
  'algorithm',
  'high',
  'A',
  ['IEC_62304', 'ISO_14971', 'FDA_QMSR'],
  TRUE,
  'testing',
  'approved',
  'approved',
  'approved',
  'user_medtech_qa',
  'user_medtech_pm',
  'user_medtech_pm'
),
(
  'req_cardio_003',
  'proj_medtech_001',
  'Data Storage and Encryption',
  'All patient data shall be encrypted at rest using AES-256 encryption and in transit using TLS 1.3 or higher.',
  'Essential security requirement to protect patient health information and comply with HIPAA.',
  'System Requirements/Security/Data Protection',
  2,
  3,
  'security',
  'data_protection',
  'high',
  'B',
  ['ISO_27001', 'HIPAA', 'FDA_QMSR'],
  TRUE,
  'inspection',
  'approved',
  'approved',
  'approved',
  'user_medtech_qa',
  'user_medtech_pm',
  'user_medtech_pm'
);

-- TherapyTracker App Requirements
INSERT INTO `${project_id}.${dataset_id}.requirements` (
  req_id,
  project_id,
  title,
  text,
  description,
  section_path,
  level,
  order_index,
  req_type,
  category,
  priority,
  risk_class,
  std_tags,
  normative,
  verification_method,
  status,
  review_status,
  approval_status,
  assigned_to,
  created_by,
  updated_by
) VALUES
(
  'req_therapy_001',
  'proj_dighealth_001',
  'Medication Adherence Tracking',
  'The application shall track medication adherence by recording user-confirmed doses and calculating adherence percentage over configurable time periods.',
  'Core functionality for therapy compliance monitoring in clinical trials.',
  'Functional Requirements/Tracking/Medication',
  2,
  1,
  'functional',
  'tracking',
  'high',
  'B',
  ['IEC_62304', 'ISO_13485', 'GDPR'],
  TRUE,
  'testing',
  'approved',
  'under_review',
  'pending',
  'user_dighealth_lead',
  'user_dighealth_lead',
  'user_dighealth_lead'
),
(
  'req_therapy_002',
  'proj_dighealth_001',
  'GDPR Consent Management',
  'The application shall implement explicit consent mechanisms for data processing, allowing users to grant, withdraw, and modify consent for different data processing purposes.',
  'Legal requirement for GDPR compliance in EU markets.',
  'Legal Requirements/Privacy/GDPR',
  2,
  2,
  'legal',
  'privacy',
  'high',
  'A',
  ['GDPR', 'ISO_27001'],
  TRUE,
  'inspection',
  'approved',
  'under_review',
  'pending',
  'user_dighealth_lead',
  'user_dighealth_lead',
  'user_dighealth_lead'
);

-- ==============================================================================
-- DEMO TEST CASES
-- ==============================================================================

-- Test cases for CardioMonitor Pro
INSERT INTO `${project_id}.${dataset_id}.tests` (
  test_id,
  req_id,
  project_id,
  title,
  description,
  gherkin,
  steps,
  test_type,
  test_method,
  priority,
  std_tags,
  quality_score,
  complexity_score,
  coverage_score,
  review_status,
  approval_status,
  assigned_to,
  generated_by_model,
  ai_confidence_score,
  created_by,
  updated_by
) VALUES
(
  'test_cardio_001',
  'req_cardio_001',
  'proj_medtech_001',
  'Heart Rate Accuracy Validation - Normal Range',
  'Validate heart rate monitoring accuracy within normal physiological range (60-100 BPM)',
  'Feature: Heart Rate Monitoring Accuracy\n  Scenario: Measure heart rate in normal range\n    Given the CardioMonitor is properly attached to patient\n    And the reference ECG shows heart rate of 75 BPM\n    When the system measures heart rate for 60 seconds\n    Then the displayed heart rate should be within 73-77 BPM\n    And the accuracy should be within ±2 BPM tolerance',
  [
    STRUCT(1 as step_number, 'Attach CardioMonitor device to patient chest using standard electrode placement' as action, 'Device shows "Connected" status and good signal quality' as expected, 'Ensure proper skin preparation and electrode adhesion' as notes),
    STRUCT(2 as step_number, 'Connect reference ECG monitor and verify 75 BPM reading' as action, 'Reference ECG displays stable 75 BPM with normal sinus rhythm' as expected, 'Use calibrated reference equipment' as notes),
    STRUCT(3 as step_number, 'Start CardioMonitor heart rate measurement for 60 seconds' as action, 'System begins continuous heart rate monitoring and displays real-time values' as expected, 'Record all displayed values during measurement period' as notes),
    STRUCT(4 as step_number, 'Compare CardioMonitor reading with reference ECG' as action, 'CardioMonitor displays heart rate between 73-77 BPM (±2 BPM tolerance)' as expected, 'Calculate percentage error and document results' as notes)
  ],
  'functional',
  'manual',
  'high',
  ['IEC_60601_2_27', 'ISO_13485'],
  0.92,
  0.75,
  0.88,
  'approved',
  'approved',
  'user_medtech_qa',
  'gemini-pro',
  0.89,
  'user_medtech_pm',
  'user_medtech_qa'
),
(
  'test_cardio_002',
  'req_cardio_002',
  'proj_medtech_001',
  'Atrial Fibrillation Detection Sensitivity',
  'Validate AI algorithm sensitivity for detecting atrial fibrillation episodes',
  'Feature: Arrhythmia Detection\n  Scenario: Detect atrial fibrillation with high sensitivity\n    Given the system is monitoring a patient with known atrial fibrillation\n    And the reference diagnosis confirms atrial fibrillation episode\n    When the AI algorithm analyzes the cardiac rhythm for 5 minutes\n    Then the system should detect and classify the arrhythmia as atrial fibrillation\n    And the detection should occur within 30 seconds of episode onset',
  [
    STRUCT(1 as step_number, 'Load patient data with confirmed atrial fibrillation episodes from cardiology database' as action, 'System loads ECG data showing clear atrial fibrillation patterns' as expected, 'Use validated clinical data with cardiologist confirmation' as notes),
    STRUCT(2 as step_number, 'Configure AI algorithm for real-time arrhythmia detection' as action, 'Algorithm initializes with standard detection parameters and sensitivity settings' as expected, 'Verify algorithm version and configuration parameters' as notes),
    STRUCT(3 as step_number, 'Process ECG data through AI detection algorithm for 5-minute analysis window' as action, 'Algorithm analyzes rhythm patterns and generates detection events' as expected, 'Monitor algorithm processing time and resource usage' as notes),
    STRUCT(4 as step_number, 'Verify atrial fibrillation detection and classification accuracy' as action, 'System correctly identifies atrial fibrillation with confidence score >95%' as expected, 'Document detection time, confidence score, and classification accuracy' as notes)
  ],
  'functional',
  'automated',
  'high',
  ['IEC_62304', 'ISO_14971'],
  0.95,
  0.85,
  0.91,
  'approved',
  'approved',
  'user_medtech_qa',
  'gemini-pro',
  0.92,
  'user_medtech_pm',
  'user_medtech_qa'
);

-- ==============================================================================
-- DEMO TRACEABILITY LINKS
-- ==============================================================================

INSERT INTO `${project_id}.${dataset_id}.trace_links` (
  link_id,
  project_id,
  source_type,
  source_id,
  target_type,
  target_id,
  link_type,
  relationship,
  strength,
  validated,
  validation_method,
  validation_confidence,
  status,
  created_by,
  updated_by
) VALUES
(
  'link_001',
  'proj_medtech_001',
  'requirement',
  'req_cardio_001',
  'test',
  'test_cardio_001',
  'verifies',
  'direct_verification',
  0.95,
  TRUE,
  'manual_review',
  0.92,
  'active',
  'user_medtech_qa',
  'user_medtech_qa'
),
(
  'link_002',
  'proj_medtech_001',
  'requirement',
  'req_cardio_002',
  'test',
  'test_cardio_002',
  'verifies',
  'direct_verification',
  0.98,
  TRUE,
  'manual_review',
  0.95,
  'active',
  'user_medtech_qa',
  'user_medtech_qa'
);

-- ==============================================================================
-- DEMO COMPLIANCE NOTES
-- ==============================================================================

INSERT INTO `${project_id}.${dataset_id}.compliance_notes` (
  note_id,
  project_id,
  item_type,
  item_id,
  title,
  content,
  note_type,
  standard,
  clause,
  severity,
  regulatory_authority,
  regulation_reference,
  status,
  priority,
  created_by,
  updated_by
) VALUES
(
  'note_001',
  'proj_medtech_001',
  'requirement',
  'req_cardio_001',
  'IEC 60601-2-27 Compliance Note',
  'This requirement directly addresses IEC 60601-2-27 clause 201.12.1.101 for heart rate accuracy in cardiac monitors. The ±2 BPM tolerance aligns with industry standards and FDA guidance for Class II cardiac monitoring devices.',
  'compliance',
  'IEC_60601_2_27',
  '201.12.1.101',
  'medium',
  'FDA',
  '21 CFR 870.2300',
  'active',
  'medium',
  'user_medtech_qa',
  'user_medtech_qa'
),
(
  'note_002',
  'proj_dighealth_001',
  'requirement',
  'req_therapy_002',
  'GDPR Article 7 Compliance',
  'Implementation must ensure consent is freely given, specific, informed and unambiguous as per GDPR Article 7. Consider implementing granular consent options for different data processing purposes (analytics, research, marketing).',
  'regulatory',
  'GDPR',
  'Article_7',
  'high',
  'EU_Commission',
  'Regulation (EU) 2016/679',
  'active',
  'high',
  'user_dighealth_lead',
  'user_dighealth_lead'
);
