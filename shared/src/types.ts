import { z } from 'zod';

// Base types
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  region: z.enum(['us-central1', 'europe-west1']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  display_name: z.string(),
  roles: z.array(z.enum(['admin', 'qa', 'compliance', 'viewer'])),
  projects: z.array(z.string()),
  created_at: z.string().datetime(),
});

// Compliance standards
export const ComplianceStandardSchema = z.enum([
  'ISO_13485',
  'IEC_62304',
  'FDA_QMSR',
  'ISO_27001',
  'CFR_PART_11',
  'GDPR',
  'HIPAA',
]);

export const RiskClassSchema = z.enum(['A', 'B', 'C', 'D']);

// Requirements
export const RequirementSchema = z.object({
  req_id: z.string(),
  project_id: z.string(),
  source_uri: z.string(),
  section_path: z.string(),
  text: z.string(),
  normative: z.boolean(),
  risk_class: RiskClassSchema,
  std_tags: z.array(ComplianceStandardSchema),
  ingest_hash: z.string(),
  confidence: z.number().min(0).max(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Test cases
export const TestStepSchema = z.object({
  action: z.string(),
  expected: z.string(),
});

export const TestSchema = z.object({
  test_id: z.string(),
  req_id: z.string(),
  project_id: z.string(),
  title: z.string(),
  gherkin: z.string(),
  preconditions: z.array(z.string()),
  steps: z.array(TestStepSchema),
  expected_summary: z.string(),
  risk_refs: z.array(z.string()),
  std_tags: z.array(ComplianceStandardSchema),
  generated_by_model: z.string(),
  quality_score: z.number().min(0).max(1),
  review_status: z.enum(['pending', 'approved', 'rejected', 'needs_revision']),
  reviewer: z.string().optional(),
  reviewed_at: z.string().datetime().optional(),
  signature_evidence: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Traceability
export const TraceLinkSchema = z.object({
  req_id: z.string(),
  test_id: z.string(),
  link_type: z.enum(['verifies', 'validates', 'mitigates']),
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
  created_at: z.string().datetime(),
});

// ALM Integration
export const ALMSystemSchema = z.enum(['jira', 'ado', 'polarion']);

export const ALMRefSchema = z.object({
  local_id: z.string(),
  external_id: z.string(),
  system: ALMSystemSchema,
  entity_type: z.enum(['requirement', 'test', 'defect']),
  url: z.string().url(),
  created_at: z.string().datetime(),
});

// Test runs
export const TestRunSchema = z.object({
  run_id: z.string(),
  test_id: z.string(),
  status: z.enum(['passed', 'failed', 'blocked', 'not_run']),
  evidence_uri: z.string().optional(),
  tester: z.string(),
  timestamp: z.string().datetime(),
});

// Compliance notes
export const ComplianceNoteSchema = z.object({
  entity_id: z.string(),
  entity_type: z.enum(['requirement', 'test']),
  clause: z.string(),
  note: z.string(),
  model_explanation: z.string(),
  created_at: z.string().datetime(),
});

// API Request/Response types
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  total: z.number().optional(),
  has_more: z.boolean().optional(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string(),
  trace_id: z.string(),
  timestamp: z.string().datetime(),
});

// File upload
export const UploadRequestSchema = z.object({
  filename: z.string(),
  content_type: z.string(),
  size: z.number(),
  project_id: z.string(),
});

export const UploadResponseSchema = z.object({
  upload_id: z.string(),
  signed_url: z.string(),
  expires_at: z.string().datetime(),
});

// AI Generation
export const GenerationRequestSchema = z.object({
  project_id: z.string(),
  req_ids: z.array(z.string()).optional(),
  batch_size: z.number().min(1).max(50).default(10),
  model_config: z.object({
    temperature: z.number().min(0).max(2).default(0.1),
    max_tokens: z.number().min(100).max(4000).default(2000),
  }).optional(),
});

export const GenerationResponseSchema = z.object({
  job_id: z.string(),
  status: z.enum(['queued', 'running', 'completed', 'failed']),
  progress: z.number().min(0).max(1),
  results: z.array(TestSchema).optional(),
  error: z.string().optional(),
});

// E-signature for Part 11 compliance
export const ESignatureSchema = z.object({
  user_id: z.string(),
  entity_id: z.string(),
  entity_type: z.enum(['test', 'requirement']),
  action: z.enum(['approve', 'reject']),
  attestation: z.string(),
  timestamp: z.string().datetime(),
  ip_address: z.string(),
  user_agent: z.string(),
  signature_hash: z.string(),
});

// RTM (Requirements Traceability Matrix)
export const RTMEntrySchema = z.object({
  req_id: z.string(),
  requirement_text: z.string().max(200),
  risk_class: RiskClassSchema,
  std_tags: z.array(ComplianceStandardSchema),
  linked_tests: z.array(z.object({
    test_id: z.string(),
    title: z.string(),
    status: z.string(),
    link_type: z.string(),
  })),
  coverage_score: z.number().min(0).max(1),
});

// Export types
export type Project = z.infer<typeof ProjectSchema>;
export type User = z.infer<typeof UserSchema>;
export type ComplianceStandard = z.infer<typeof ComplianceStandardSchema>;
export type RiskClass = z.infer<typeof RiskClassSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
export type TestStep = z.infer<typeof TestStepSchema>;
export type Test = z.infer<typeof TestSchema>;
export type TraceLink = z.infer<typeof TraceLinkSchema>;
export type ALMSystem = z.infer<typeof ALMSystemSchema>;
export type ALMRef = z.infer<typeof ALMRefSchema>;
export type TestRun = z.infer<typeof TestRunSchema>;
export type ComplianceNote = z.infer<typeof ComplianceNoteSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type UploadRequest = z.infer<typeof UploadRequestSchema>;
export type UploadResponse = z.infer<typeof UploadResponseSchema>;
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;
export type GenerationResponse = z.infer<typeof GenerationResponseSchema>;
export type ESignature = z.infer<typeof ESignatureSchema>;
export type RTMEntry = z.infer<typeof RTMEntrySchema>;

// Constants
export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/xml',
  'application/xml',
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const COMPLIANCE_CLAUSES = {
  ISO_13485: [
    '4.1.1', '4.2.1', '4.2.2', '4.2.3', '4.2.4', '4.2.5',
    '7.3.1', '7.3.2', '7.3.3', '7.3.4', '7.3.5', '7.3.6', '7.3.7',
  ],
  IEC_62304: [
    '5.1.1', '5.1.2', '5.1.3', '5.1.4', '5.1.5', '5.1.6',
    '5.2.1', '5.2.2', '5.2.3', '5.2.4', '5.2.5', '5.2.6',
  ],
  FDA_QMSR: [
    '820.30', '820.40', '820.50', '820.70', '820.75', '820.80',
  ],
  CFR_PART_11: [
    '11.10', '11.30', '11.50', '11.70', '11.100', '11.200', '11.300',
  ],
} as const;
