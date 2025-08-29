-- Healthcare Compliance SaaS - BigQuery Views and Stored Procedures
-- This file contains views, materialized views, and stored procedures for the platform

-- ==============================================================================
-- REQUIREMENTS TRACEABILITY MATRIX VIEW
-- Comprehensive view showing requirement-to-test traceability
-- ==============================================================================

CREATE OR REPLACE VIEW `${project_id}.${dataset_id}.requirements_traceability_matrix` AS
WITH requirement_hierarchy AS (
  SELECT 
    req_id,
    project_id,
    title,
    req_type,
    std_tags,
    risk_class,
    status,
    parent_req_id,
    level,
    ARRAY_AGG(req_id) OVER (
      PARTITION BY project_id 
      ORDER BY level, order_index 
      ROWS UNBOUNDED PRECEDING
    ) as hierarchy_path
  FROM `${project_id}.${dataset_id}.requirements`
  WHERE deleted = FALSE
),
test_coverage AS (
  SELECT 
    r.req_id,
    COUNT(t.test_id) as test_count,
    COUNTIF(t.review_status = 'approved') as approved_tests,
    COUNTIF(t.approval_status = 'approved') as final_approved_tests,
    ARRAY_AGG(
      STRUCT(
        t.test_id,
        t.title,
        t.test_type,
        t.review_status,
        t.approval_status,
        t.quality_score
      )
    ) as tests
  FROM `${project_id}.${dataset_id}.requirements` r
  LEFT JOIN `${project_id}.${dataset_id}.tests` t 
    ON r.req_id = t.req_id AND t.deleted = FALSE
  WHERE r.deleted = FALSE
  GROUP BY r.req_id
),
execution_status AS (
  SELECT 
    t.req_id,
    COUNT(tr.run_id) as total_runs,
    COUNTIF(tr.status = 'passed') as passed_runs,
    COUNTIF(tr.status = 'failed') as failed_runs,
    MAX(tr.executed_at) as last_execution,
    AVG(CASE WHEN tr.status = 'passed' THEN 1.0 ELSE 0.0 END) as pass_rate
  FROM `${project_id}.${dataset_id}.tests` t
  LEFT JOIN `${project_id}.${dataset_id}.test_runs` tr 
    ON t.test_id = tr.test_id AND tr.deleted = FALSE
  WHERE t.deleted = FALSE
  GROUP BY t.req_id
)
SELECT 
  rh.req_id,
  rh.project_id,
  rh.title as requirement_title,
  rh.req_type,
  rh.std_tags,
  rh.risk_class,
  rh.status as requirement_status,
  rh.level,
  rh.hierarchy_path,
  
  -- Test coverage metrics
  COALESCE(tc.test_count, 0) as test_count,
  COALESCE(tc.approved_tests, 0) as approved_tests,
  COALESCE(tc.final_approved_tests, 0) as final_approved_tests,
  tc.tests,
  
  -- Coverage ratios
  CASE 
    WHEN tc.test_count > 0 THEN tc.approved_tests / tc.test_count 
    ELSE 0 
  END as test_approval_ratio,
  
  -- Execution metrics
  COALESCE(es.total_runs, 0) as total_runs,
  COALESCE(es.passed_runs, 0) as passed_runs,
  COALESCE(es.failed_runs, 0) as failed_runs,
  COALESCE(es.pass_rate, 0) as pass_rate,
  es.last_execution,
  
  -- Compliance status
  CASE 
    WHEN tc.final_approved_tests = 0 THEN 'no_tests'
    WHEN es.total_runs = 0 THEN 'not_executed'
    WHEN es.pass_rate = 1.0 THEN 'compliant'
    WHEN es.pass_rate >= 0.8 THEN 'mostly_compliant'
    ELSE 'non_compliant'
  END as compliance_status,
  
  CURRENT_TIMESTAMP() as view_generated_at
FROM requirement_hierarchy rh
LEFT JOIN test_coverage tc ON rh.req_id = tc.req_id
LEFT JOIN execution_status es ON rh.req_id = es.req_id;

-- ==============================================================================
-- PROJECT COMPLIANCE DASHBOARD VIEW
-- High-level compliance metrics per project
-- ==============================================================================

CREATE OR REPLACE VIEW `${project_id}.${dataset_id}.project_compliance_dashboard` AS
WITH project_stats AS (
  SELECT 
    p.project_id,
    p.name as project_name,
    p.compliance_standards,
    p.lifecycle_stage,
    p.approval_status,
    
    -- Requirement metrics
    COUNT(r.req_id) as total_requirements,
    COUNTIF(r.status = 'approved') as approved_requirements,
    COUNTIF(r.risk_class = 'A') as high_risk_requirements,
    COUNTIF(r.normative = TRUE) as normative_requirements,
    
    -- Test metrics
    COUNT(t.test_id) as total_tests,
    COUNTIF(t.approval_status = 'approved') as approved_tests,
    AVG(t.quality_score) as avg_test_quality,
    
    -- Execution metrics
    COUNT(tr.run_id) as total_test_runs,
    COUNTIF(tr.status = 'passed') as passed_runs,
    
    -- Coverage metrics
    COUNT(DISTINCT CASE WHEN t.test_id IS NOT NULL THEN r.req_id END) as covered_requirements,
    
    p.created_at,
    p.updated_at
    
  FROM `${project_id}.${dataset_id}.projects` p
  LEFT JOIN `${project_id}.${dataset_id}.requirements` r 
    ON p.project_id = r.project_id AND r.deleted = FALSE
  LEFT JOIN `${project_id}.${dataset_id}.tests` t 
    ON r.req_id = t.req_id AND t.deleted = FALSE
  LEFT JOIN `${project_id}.${dataset_id}.test_runs` tr 
    ON t.test_id = tr.test_id AND tr.deleted = FALSE
  WHERE p.deleted = FALSE
  GROUP BY 
    p.project_id, p.name, p.compliance_standards, 
    p.lifecycle_stage, p.approval_status, p.created_at, p.updated_at
)
SELECT 
  *,
  
  -- Calculated metrics
  CASE 
    WHEN total_requirements > 0 THEN approved_requirements / total_requirements 
    ELSE 0 
  END as requirement_approval_ratio,
  
  CASE 
    WHEN total_requirements > 0 THEN covered_requirements / total_requirements 
    ELSE 0 
  END as requirement_coverage_ratio,
  
  CASE 
    WHEN total_tests > 0 THEN approved_tests / total_tests 
    ELSE 0 
  END as test_approval_ratio,
  
  CASE 
    WHEN total_test_runs > 0 THEN passed_runs / total_test_runs 
    ELSE 0 
  END as test_pass_ratio,
  
  -- Overall compliance score (weighted average)
  (
    CASE WHEN total_requirements > 0 THEN approved_requirements / total_requirements ELSE 0 END * 0.3 +
    CASE WHEN total_requirements > 0 THEN covered_requirements / total_requirements ELSE 0 END * 0.3 +
    CASE WHEN total_tests > 0 THEN approved_tests / total_tests ELSE 0 END * 0.2 +
    CASE WHEN total_test_runs > 0 THEN passed_runs / total_test_runs ELSE 0 END * 0.2
  ) as compliance_score,
  
  CURRENT_TIMESTAMP() as dashboard_generated_at
FROM project_stats;

-- ==============================================================================
-- AUDIT TRAIL SUMMARY VIEW
-- Aggregated audit information for compliance reporting
-- ==============================================================================

CREATE OR REPLACE VIEW `${project_id}.${dataset_id}.audit_trail_summary` AS
SELECT 
  project_id,
  DATE(timestamp) as audit_date,
  event_category,
  event_type,
  user_id,
  
  -- Event counts
  COUNT(*) as total_events,
  COUNTIF(outcome = 'success') as successful_events,
  COUNTIF(outcome = 'failure') as failed_events,
  COUNTIF(outcome = 'error') as error_events,
  
  -- Risk analysis
  COUNTIF(risk_level = 'high') as high_risk_events,
  COUNTIF(risk_level = 'medium') as medium_risk_events,
  COUNTIF(risk_level = 'low') as low_risk_events,
  
  -- Compliance impact
  COUNTIF(compliance_impact IS NOT NULL) as compliance_impacting_events,
  
  -- Timing metrics
  MIN(timestamp) as first_event_time,
  MAX(timestamp) as last_event_time,
  AVG(processing_time_ms) as avg_processing_time_ms,
  
  -- Data changes
  COUNTIF(old_values IS NOT NULL OR new_values IS NOT NULL) as data_change_events,
  
  CURRENT_TIMESTAMP() as summary_generated_at
  
FROM `${project_id}.${dataset_id}.audit_trail`
GROUP BY 
  project_id, 
  DATE(timestamp), 
  event_category, 
  event_type, 
  user_id;

-- ==============================================================================
-- STORED PROCEDURE: Generate Compliance Report
-- ==============================================================================

CREATE OR REPLACE PROCEDURE `${project_id}.${dataset_id}.generate_compliance_report`(
  IN project_id_param STRING,
  IN report_type STRING,
  IN start_date DATE,
  IN end_date DATE
)
BEGIN
  DECLARE report_id STRING DEFAULT GENERATE_UUID();
  
  -- Create temporary table for report data
  CREATE TEMP TABLE compliance_report_data AS
  SELECT 
    report_id as report_id,
    project_id_param as project_id,
    report_type,
    start_date,
    end_date,
    CURRENT_TIMESTAMP() as generated_at,
    
    -- Project information
    (SELECT name FROM `${project_id}.${dataset_id}.projects` 
     WHERE project_id = project_id_param AND deleted = FALSE) as project_name,
    
    -- Requirement metrics
    (SELECT COUNT(*) FROM `${project_id}.${dataset_id}.requirements` 
     WHERE project_id = project_id_param AND deleted = FALSE) as total_requirements,
    
    (SELECT COUNT(*) FROM `${project_id}.${dataset_id}.requirements` 
     WHERE project_id = project_id_param AND status = 'approved' AND deleted = FALSE) as approved_requirements,
    
    -- Test metrics
    (SELECT COUNT(*) FROM `${project_id}.${dataset_id}.tests` t
     JOIN `${project_id}.${dataset_id}.requirements` r ON t.req_id = r.req_id
     WHERE r.project_id = project_id_param AND t.deleted = FALSE AND r.deleted = FALSE) as total_tests,
    
    -- Execution metrics for date range
    (SELECT COUNT(*) FROM `${project_id}.${dataset_id}.test_runs` tr
     JOIN `${project_id}.${dataset_id}.tests` t ON tr.test_id = t.test_id
     JOIN `${project_id}.${dataset_id}.requirements` r ON t.req_id = r.req_id
     WHERE r.project_id = project_id_param 
       AND DATE(tr.executed_at) BETWEEN start_date AND end_date
       AND tr.deleted = FALSE AND t.deleted = FALSE AND r.deleted = FALSE) as test_runs_in_period,
    
    (SELECT COUNT(*) FROM `${project_id}.${dataset_id}.test_runs` tr
     JOIN `${project_id}.${dataset_id}.tests` t ON tr.test_id = t.test_id
     JOIN `${project_id}.${dataset_id}.requirements` r ON t.req_id = r.req_id
     WHERE r.project_id = project_id_param 
       AND DATE(tr.executed_at) BETWEEN start_date AND end_date
       AND tr.status = 'passed'
       AND tr.deleted = FALSE AND t.deleted = FALSE AND r.deleted = FALSE) as passed_runs_in_period;
  
  -- Return the report data
  SELECT * FROM compliance_report_data;
  
END;

-- ==============================================================================
-- STORED PROCEDURE: Update Requirement Risk Assessment
-- ==============================================================================

CREATE OR REPLACE PROCEDURE `${project_id}.${dataset_id}.update_requirement_risk_assessment`(
  IN req_id_param STRING,
  IN new_risk_class STRING,
  IN risk_rationale STRING,
  IN updated_by_param STRING
)
BEGIN
  DECLARE old_risk_class STRING;
  
  -- Get current risk class
  SET old_risk_class = (
    SELECT risk_class 
    FROM `${project_id}.${dataset_id}.requirements` 
    WHERE req_id = req_id_param AND deleted = FALSE
  );
  
  -- Update requirement
  UPDATE `${project_id}.${dataset_id}.requirements`
  SET 
    risk_class = new_risk_class,
    risk_rationale = risk_rationale,
    updated_by = updated_by_param,
    updated_at = CURRENT_TIMESTAMP(),
    version = version + 1
  WHERE req_id = req_id_param AND deleted = FALSE;
  
  -- Log the change in audit trail
  INSERT INTO `${project_id}.${dataset_id}.audit_trail` (
    audit_id,
    event_type,
    event_category,
    event_source,
    user_id,
    resource_type,
    resource_id,
    action,
    outcome,
    old_values,
    new_values,
    changed_fields,
    risk_level,
    compliance_impact,
    timestamp,
    trace_id
  ) VALUES (
    GENERATE_UUID(),
    'requirement_risk_updated',
    'compliance',
    'stored_procedure',
    updated_by_param,
    'requirement',
    req_id_param,
    'update_risk_assessment',
    'success',
    JSON_OBJECT('risk_class', old_risk_class),
    JSON_OBJECT('risk_class', new_risk_class, 'risk_rationale', risk_rationale),
    ['risk_class', 'risk_rationale'],
    CASE WHEN new_risk_class = 'A' THEN 'high' ELSE 'medium' END,
    'risk_classification_change',
    CURRENT_TIMESTAMP(),
    GENERATE_UUID()
  );
  
END;

-- ==============================================================================
-- MATERIALIZED VIEW: Daily Compliance Metrics
-- Refreshed daily for performance
-- ==============================================================================

CREATE MATERIALIZED VIEW `${project_id}.${dataset_id}.daily_compliance_metrics`
PARTITION BY DATE(metric_date)
CLUSTER BY project_id
AS
SELECT 
  CURRENT_DATE() as metric_date,
  p.project_id,
  p.name as project_name,
  p.compliance_standards,
  
  -- Requirement metrics
  COUNT(r.req_id) as total_requirements,
  COUNTIF(r.status = 'approved') as approved_requirements,
  COUNTIF(r.risk_class = 'A') as high_risk_requirements,
  
  -- Test metrics
  COUNT(t.test_id) as total_tests,
  COUNTIF(t.approval_status = 'approved') as approved_tests,
  AVG(t.quality_score) as avg_test_quality,
  
  -- Recent activity (last 30 days)
  COUNTIF(DATE(r.created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)) as new_requirements_30d,
  COUNTIF(DATE(t.created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)) as new_tests_30d,
  
  -- Compliance score
  (
    CASE WHEN COUNT(r.req_id) > 0 THEN COUNTIF(r.status = 'approved') / COUNT(r.req_id) ELSE 0 END * 0.4 +
    CASE WHEN COUNT(t.test_id) > 0 THEN COUNTIF(t.approval_status = 'approved') / COUNT(t.test_id) ELSE 0 END * 0.3 +
    COALESCE(AVG(t.quality_score), 0) * 0.3
  ) as daily_compliance_score,
  
  CURRENT_TIMESTAMP() as calculated_at
  
FROM `${project_id}.${dataset_id}.projects` p
LEFT JOIN `${project_id}.${dataset_id}.requirements` r 
  ON p.project_id = r.project_id AND r.deleted = FALSE
LEFT JOIN `${project_id}.${dataset_id}.tests` t 
  ON r.req_id = t.req_id AND t.deleted = FALSE
WHERE p.deleted = FALSE
GROUP BY 
  p.project_id, 
  p.name, 
  p.compliance_standards;
