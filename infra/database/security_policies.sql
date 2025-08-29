-- Healthcare Compliance SaaS - Row-Level Security Policies
-- This file defines row-level security policies for multi-tenant data isolation

-- ==============================================================================
-- ROW ACCESS POLICIES FOR MULTI-TENANT ISOLATION
-- ==============================================================================

-- Projects table - users can only access projects in their organization
CREATE ROW ACCESS POLICY IF NOT EXISTS `project_organization_policy`
ON `${project_id}.${dataset_id}.projects`
GRANT TO ("allAuthenticatedUsers")
FILTER USING (
  organization_id IN (
    SELECT organization_id 
    FROM `${project_id}.${dataset_id}.users` 
    WHERE firebase_uid = SESSION_USER()
  )
  OR owner_id = (
    SELECT user_id 
    FROM `${project_id}.${dataset_id}.users` 
    WHERE firebase_uid = SESSION_USER()
  )
);

-- Users table - users can only see users in their organization
CREATE ROW ACCESS POLICY IF NOT EXISTS `user_organization_policy`
ON `${project_id}.${dataset_id}.users`
GRANT TO ("allAuthenticatedUsers")
FILTER USING (
  organization_id IN (
    SELECT organization_id 
    FROM `${project_id}.${dataset_id}.users` 
    WHERE firebase_uid = SESSION_USER()
  )
  OR firebase_uid = SESSION_USER()
);

-- Requirements table - access based on project membership
CREATE ROW ACCESS POLICY IF NOT EXISTS `requirements_project_policy`
ON `${project_id}.${dataset_id}.requirements`
GRANT TO ("allAuthenticatedUsers")
FILTER USING (
  project_id IN (
    SELECT p.project_id
    FROM `${project_id}.${dataset_id}.projects` p
    JOIN `${project_id}.${dataset_id}.users` u 
      ON p.organization_id = u.organization_id
    WHERE u.firebase_uid = SESSION_USER()
  )
);

-- Tests table - access based on project membership through requirements
CREATE ROW ACCESS POLICY IF NOT EXISTS `tests_project_policy`
ON `${project_id}.${dataset_id}.tests`
GRANT TO ("allAuthenticatedUsers")
FILTER USING (
  project_id IN (
    SELECT p.project_id
    FROM `${project_id}.${dataset_id}.projects` p
    JOIN `${project_id}.${dataset_id}.users` u 
      ON p.organization_id = u.organization_id
    WHERE u.firebase_uid = SESSION_USER()
  )
);

-- Test runs table - access based on project membership
CREATE ROW ACCESS POLICY IF NOT EXISTS `test_runs_project_policy`
ON `${project_id}.${dataset_id}.test_runs`
GRANT TO ("allAuthenticatedUsers")
FILTER USING (
  project_id IN (
    SELECT p.project_id
    FROM `${project_id}.${dataset_id}.projects` p
    JOIN `${project_id}.${dataset_id}.users` u 
      ON p.organization_id = u.organization_id
    WHERE u.firebase_uid = SESSION_USER()
  )
);

-- Trace links table - access based on project membership
CREATE ROW ACCESS POLICY IF NOT EXISTS `trace_links_project_policy`
ON `${project_id}.${dataset_id}.trace_links`
GRANT TO ("allAuthenticatedUsers")
FILTER USING (
  project_id IN (
    SELECT p.project_id
    FROM `${project_id}.${dataset_id}.projects` p
    JOIN `${project_id}.${dataset_id}.users` u 
      ON p.organization_id = u.organization_id
    WHERE u.firebase_uid = SESSION_USER()
  )
);

-- ALM references table - access based on project membership
CREATE ROW ACCESS POLICY IF NOT EXISTS `alm_refs_project_policy`
ON `${project_id}.${dataset_id}.alm_refs`
GRANT TO ("allAuthenticatedUsers")
FILTER USING (
  project_id IN (
    SELECT p.project_id
    FROM `${project_id}.${dataset_id}.projects` p
    JOIN `${project_id}.${dataset_id}.users` u 
      ON p.organization_id = u.organization_id
    WHERE u.firebase_uid = SESSION_USER()
  )
);

-- Compliance notes table - access based on project membership
CREATE ROW ACCESS POLICY IF NOT EXISTS `compliance_notes_project_policy`
ON `${project_id}.${dataset_id}.compliance_notes`
GRANT TO ("allAuthenticatedUsers")
FILTER USING (
  project_id IN (
    SELECT p.project_id
    FROM `${project_id}.${dataset_id}.projects` p
    JOIN `${project_id}.${dataset_id}.users` u 
      ON p.organization_id = u.organization_id
    WHERE u.firebase_uid = SESSION_USER()
  )
);

-- Documents table - access based on project membership and document access level
CREATE ROW ACCESS POLICY IF NOT EXISTS `documents_access_policy`
ON `${project_id}.${dataset_id}.documents`
GRANT TO ("allAuthenticatedUsers")
FILTER USING (
  project_id IN (
    SELECT p.project_id
    FROM `${project_id}.${dataset_id}.projects` p
    JOIN `${project_id}.${dataset_id}.users` u 
      ON p.organization_id = u.organization_id
    WHERE u.firebase_uid = SESSION_USER()
  )
  AND (
    access_level = 'public'
    OR access_level = 'project'
    OR uploaded_by = (
      SELECT user_id 
      FROM `${project_id}.${dataset_id}.users` 
      WHERE firebase_uid = SESSION_USER()
    )
    OR EXISTS (
      SELECT 1 
      FROM `${project_id}.${dataset_id}.users` u
      WHERE u.firebase_uid = SESSION_USER()
        AND (
          SELECT COUNT(role) 
          FROM UNNEST(u.roles) AS role 
          WHERE role IN UNNEST(allowed_roles)
        ) > 0
    )
  )
);

-- E-signatures table - signers can see their own signatures, others based on project access
CREATE ROW ACCESS POLICY IF NOT EXISTS `e_signatures_access_policy`
ON `${project_id}.${dataset_id}.e_signatures`
GRANT TO ("allAuthenticatedUsers")
FILTER USING (
  signer_id = (
    SELECT user_id 
    FROM `${project_id}.${dataset_id}.users` 
    WHERE firebase_uid = SESSION_USER()
  )
  OR project_id IN (
    SELECT p.project_id
    FROM `${project_id}.${dataset_id}.projects` p
    JOIN `${project_id}.${dataset_id}.users` u 
      ON p.organization_id = u.organization_id
    WHERE u.firebase_uid = SESSION_USER()
      AND (
        SELECT COUNT(role) 
        FROM UNNEST(u.roles) AS role 
        WHERE role IN ('admin', 'compliance_officer', 'quality_manager')
      ) > 0
  )
);

-- ==============================================================================
-- ROLE-BASED ACCESS POLICIES
-- ==============================================================================

-- Admin access policy - admins can see all data in their organization
CREATE ROW ACCESS POLICY IF NOT EXISTS `admin_full_access_policy`
ON `${project_id}.${dataset_id}.audit_trail`
GRANT TO ("allAuthenticatedUsers")
FILTER USING (
  EXISTS (
    SELECT 1 
    FROM `${project_id}.${dataset_id}.users` u
    WHERE u.firebase_uid = SESSION_USER()
      AND (
        SELECT COUNT(role) 
        FROM UNNEST(u.roles) AS role 
        WHERE role IN ('admin', 'system_admin')
      ) > 0
  )
  OR user_id = (
    SELECT user_id 
    FROM `${project_id}.${dataset_id}.users` 
    WHERE firebase_uid = SESSION_USER()
  )
);

-- Compliance officer access policy - can see compliance-related audit events
CREATE ROW ACCESS POLICY IF NOT EXISTS `compliance_officer_audit_policy`
ON `${project_id}.${dataset_id}.audit_trail`
GRANT TO ("allAuthenticatedUsers")
FILTER USING (
  EXISTS (
    SELECT 1 
    FROM `${project_id}.${dataset_id}.users` u
    WHERE u.firebase_uid = SESSION_USER()
      AND (
        SELECT COUNT(role) 
        FROM UNNEST(u.roles) AS role 
        WHERE role IN ('compliance_officer', 'quality_manager')
      ) > 0
  )
  AND event_category IN ('compliance', 'security', 'data')
);

-- ==============================================================================
-- DATA MASKING POLICIES
-- ==============================================================================

-- Create data masking rule for PII in audit trail
CREATE ROW ACCESS POLICY IF NOT EXISTS `audit_trail_pii_masking`
ON `${project_id}.${dataset_id}.audit_trail`
GRANT TO ("allAuthenticatedUsers")
FILTER USING (
  -- Mask IP addresses for non-admin users
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM `${project_id}.${dataset_id}.users` u
      WHERE u.firebase_uid = SESSION_USER()
        AND (
          SELECT COUNT(role) 
          FROM UNNEST(u.roles) AS role 
          WHERE role IN ('admin', 'security_officer')
        ) > 0
    ) THEN TRUE
    ELSE ip_address IS NULL OR ip_address = 'MASKED'
  END
);

-- ==============================================================================
-- ENABLE ROW-LEVEL SECURITY
-- ==============================================================================

-- Enable row-level security on all tables
ALTER TABLE `${project_id}.${dataset_id}.projects` ENABLE ROW LEVEL SECURITY;
ALTER TABLE `${project_id}.${dataset_id}.users` ENABLE ROW LEVEL SECURITY;
ALTER TABLE `${project_id}.${dataset_id}.requirements` ENABLE ROW LEVEL SECURITY;
ALTER TABLE `${project_id}.${dataset_id}.tests` ENABLE ROW LEVEL SECURITY;
ALTER TABLE `${project_id}.${dataset_id}.test_runs` ENABLE ROW LEVEL SECURITY;
ALTER TABLE `${project_id}.${dataset_id}.trace_links` ENABLE ROW LEVEL SECURITY;
ALTER TABLE `${project_id}.${dataset_id}.alm_refs` ENABLE ROW LEVEL SECURITY;
ALTER TABLE `${project_id}.${dataset_id}.compliance_notes` ENABLE ROW LEVEL SECURITY;
ALTER TABLE `${project_id}.${dataset_id}.documents` ENABLE ROW LEVEL SECURITY;
ALTER TABLE `${project_id}.${dataset_id}.e_signatures` ENABLE ROW LEVEL SECURITY;
ALTER TABLE `${project_id}.${dataset_id}.audit_trail` ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- SERVICE ACCOUNT PERMISSIONS
-- ==============================================================================

-- Grant service accounts bypass permissions for system operations
GRANT `roles/bigquery.dataViewer` ON TABLE `${project_id}.${dataset_id}.*` 
TO "serviceAccount:ingest-api@${project_id}.iam.gserviceaccount.com";

GRANT `roles/bigquery.dataEditor` ON TABLE `${project_id}.${dataset_id}.*` 
TO "serviceAccount:ai-orchestrator@${project_id}.iam.gserviceaccount.com";

GRANT `roles/bigquery.dataEditor` ON TABLE `${project_id}.${dataset_id}.*` 
TO "serviceAccount:alm-adapters@${project_id}.iam.gserviceaccount.com";

-- Grant web app service account read access with RLS
GRANT `roles/bigquery.dataViewer` ON DATASET `${project_id}.${dataset_id}` 
TO "serviceAccount:web-app@${project_id}.iam.gserviceaccount.com";
