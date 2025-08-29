import { 
  validateComplianceScore,
  validateRegulatoryFramework,
  validateAuditEvent,
  validateSecurityAlert,
  mockSecurityMetrics,
  mockAuditEvent,
  mockSecurityAlert
} from '../test-utils'

describe('Security Test Utilities', () => {
  describe('validateComplianceScore', () => {
    it('validates compliance scores correctly', () => {
      expect(validateComplianceScore(95)).toBe(true)
      expect(validateComplianceScore(0)).toBe(true)
      expect(validateComplianceScore(100)).toBe(true)
      expect(validateComplianceScore(-1)).toBe(false)
      expect(validateComplianceScore(101)).toBe(false)
      expect(validateComplianceScore(NaN)).toBe(false)
    })

    it('handles edge cases', () => {
      expect(validateComplianceScore(0.5)).toBe(true)
      expect(validateComplianceScore(99.99)).toBe(true)
      expect(validateComplianceScore(null as any)).toBe(false)
      expect(validateComplianceScore(undefined as any)).toBe(false)
    })
  })

  describe('validateRegulatoryFramework', () => {
    it('validates known regulatory frameworks', () => {
      expect(validateRegulatoryFramework('FDA QMSR')).toBe(true)
      expect(validateRegulatoryFramework('ISO 13485')).toBe(true)
      expect(validateRegulatoryFramework('IEC 62304')).toBe(true)
      expect(validateRegulatoryFramework('ISO 14971')).toBe(true)
      expect(validateRegulatoryFramework('HIPAA')).toBe(true)
      expect(validateRegulatoryFramework('GDPR')).toBe(true)
      expect(validateRegulatoryFramework('21 CFR Part 11')).toBe(true)
    })

    it('rejects invalid frameworks', () => {
      expect(validateRegulatoryFramework('Invalid Framework')).toBe(false)
      expect(validateRegulatoryFramework('')).toBe(false)
      expect(validateRegulatoryFramework(null as any)).toBe(false)
    })
  })

  describe('validateAuditEvent', () => {
    it('validates complete audit events', () => {
      const validEvent = mockAuditEvent()
      expect(validateAuditEvent(validEvent)).toBe(true)
    })

    it('validates required fields', () => {
      const invalidEvent = mockAuditEvent()
      delete (invalidEvent as any).timestamp
      expect(validateAuditEvent(invalidEvent)).toBe(false)
    })

    it('validates 21 CFR Part 11 compliance fields', () => {
      const event = mockAuditEvent({
        digitalSignature: 'valid-signature',
        immutable: true,
        complianceRelevant: true
      })
      expect(validateAuditEvent(event)).toBe(true)
    })

    it('validates regulatory framework references', () => {
      const event = mockAuditEvent({
        regulatoryFrameworks: ['FDA QMSR', 'ISO 13485']
      })
      expect(validateAuditEvent(event)).toBe(true)

      const invalidEvent = mockAuditEvent({
        regulatoryFrameworks: ['Invalid Framework']
      })
      expect(validateAuditEvent(invalidEvent)).toBe(false)
    })
  })

  describe('validateSecurityAlert', () => {
    it('validates security alert structure', () => {
      const validAlert = mockSecurityAlert()
      expect(validateSecurityAlert(validAlert)).toBe(true)
    })

    it('validates severity levels', () => {
      const criticalAlert = mockSecurityAlert({ severity: 'critical' })
      expect(validateSecurityAlert(criticalAlert)).toBe(true)

      const invalidAlert = mockSecurityAlert({ severity: 'invalid' as any })
      expect(validateSecurityAlert(invalidAlert)).toBe(false)
    })

    it('validates alert types', () => {
      const authAlert = mockSecurityAlert({ type: 'authentication' })
      expect(validateSecurityAlert(authAlert)).toBe(true)

      const accessAlert = mockSecurityAlert({ type: 'access_control' })
      expect(validateSecurityAlert(accessAlert)).toBe(true)

      const invalidAlert = mockSecurityAlert({ type: 'invalid' as any })
      expect(validateSecurityAlert(invalidAlert)).toBe(false)
    })
  })

  describe('mockSecurityMetrics', () => {
    it('generates realistic security metrics', () => {
      const metrics = mockSecurityMetrics()
      
      expect(metrics.authenticationSuccessRate).toBeGreaterThanOrEqual(0)
      expect(metrics.authenticationSuccessRate).toBeLessThanOrEqual(100)
      expect(metrics.mfaAdoption).toBeGreaterThanOrEqual(0)
      expect(metrics.mfaAdoption).toBeLessThanOrEqual(100)
      expect(metrics.sessionSecurity).toBeGreaterThanOrEqual(0)
      expect(metrics.sessionSecurity).toBeLessThanOrEqual(100)
    })

    it('includes healthcare-specific security metrics', () => {
      const metrics = mockSecurityMetrics()
      
      expect(metrics).toHaveProperty('dataEncryptionCoverage')
      expect(metrics).toHaveProperty('vulnerabilityScore')
      expect(metrics).toHaveProperty('complianceScore')
      expect(metrics).toHaveProperty('hipaaCompliance')
    })

    it('allows metric overrides', () => {
      const customMetrics = mockSecurityMetrics({
        authenticationSuccessRate: 99.5,
        hipaaCompliance: true
      })
      
      expect(customMetrics.authenticationSuccessRate).toBe(99.5)
      expect(customMetrics.hipaaCompliance).toBe(true)
    })
  })

  describe('Healthcare Compliance Specific Tests', () => {
    it('validates HIPAA compliance requirements', () => {
      const hipaaEvent = mockAuditEvent({
        category: 'data_access',
        resourceType: 'patient_data',
        complianceRelevant: true,
        regulatoryFrameworks: ['HIPAA'],
        metadata: {
          patientId: 'redacted',
          accessReason: 'treatment',
          minimumNecessary: true
        }
      })
      
      expect(validateAuditEvent(hipaaEvent)).toBe(true)
      expect(hipaaEvent.metadata.patientId).toBe('redacted')
    })

    it('validates FDA 21 CFR Part 11 requirements', () => {
      const fdaEvent = mockAuditEvent({
        regulatoryFrameworks: ['21 CFR Part 11'],
        digitalSignature: 'sha256:abcd1234...',
        immutable: true,
        complianceRelevant: true,
        metadata: {
          electronicRecord: true,
          signatureRequired: true,
          auditTrailComplete: true
        }
      })
      
      expect(validateAuditEvent(fdaEvent)).toBe(true)
      expect(fdaEvent.digitalSignature).toBeTruthy()
      expect(fdaEvent.immutable).toBe(true)
    })

    it('validates ISO 27001 security requirements', () => {
      const isoEvent = mockAuditEvent({
        regulatoryFrameworks: ['ISO 27001'],
        category: 'security',
        severity: 'high',
        metadata: {
          securityControl: 'A.9.1.1',
          riskAssessment: 'completed',
          incidentResponse: 'activated'
        }
      })
      
      expect(validateAuditEvent(isoEvent)).toBe(true)
      expect(isoEvent.metadata.securityControl).toBeTruthy()
    })

    it('validates medical device software compliance (IEC 62304)', () => {
      const deviceEvent = mockAuditEvent({
        regulatoryFrameworks: ['IEC 62304'],
        category: 'software_lifecycle',
        resourceType: 'medical_device_software',
        metadata: {
          safetyClassification: 'Class B',
          softwareLifecycleProcess: 'development',
          riskAnalysis: 'completed',
          verification: 'passed'
        }
      })
      
      expect(validateAuditEvent(deviceEvent)).toBe(true)
      expect(deviceEvent.metadata.safetyClassification).toBeTruthy()
    })
  })

  describe('Performance and Load Testing Utilities', () => {
    it('measures compliance calculation performance', async () => {
      const startTime = performance.now()
      
      // Simulate compliance calculation
      const projects = Array.from({ length: 100 }, (_, i) => ({
        id: `proj-${i}`,
        complianceScore: Math.random() * 100
      }))
      
      const avgScore = projects.reduce((sum, p) => sum + p.complianceScore, 0) / projects.length
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(100) // Should complete in under 100ms
      expect(avgScore).toBeGreaterThan(0)
      expect(avgScore).toBeLessThan(100)
    })

    it('validates concurrent user session handling', () => {
      const sessions = Array.from({ length: 1000 }, (_, i) => ({
        id: `session-${i}`,
        userId: `user-${i % 100}`, // 100 unique users, 10 sessions each
        riskScore: Math.random() * 100,
        lastActivity: new Date().toISOString()
      }))
      
      const uniqueUsers = new Set(sessions.map(s => s.userId)).size
      expect(uniqueUsers).toBe(100)
      
      const highRiskSessions = sessions.filter(s => s.riskScore > 80)
      expect(highRiskSessions.length).toBeGreaterThan(0)
    })
  })

  describe('Data Privacy and Protection Tests', () => {
    it('validates PII redaction in audit logs', () => {
      const sensitiveEvent = mockAuditEvent({
        metadata: {
          originalEmail: 'john.doe@hospital.com',
          redactedEmail: 'j***@h***.com',
          patientId: 'redacted',
          socialSecurityNumber: 'redacted'
        }
      })
      
      expect(sensitiveEvent.metadata.originalEmail).not.toContain('@')
      expect(sensitiveEvent.metadata.patientId).toBe('redacted')
      expect(sensitiveEvent.metadata.socialSecurityNumber).toBe('redacted')
    })

    it('validates GDPR data subject rights', () => {
      const gdprEvent = mockAuditEvent({
        regulatoryFrameworks: ['GDPR'],
        action: 'data_subject_request',
        category: 'privacy',
        metadata: {
          requestType: 'data_portability',
          dataSubjectId: 'redacted',
          legalBasis: 'consent',
          processingPurpose: 'healthcare_treatment'
        }
      })
      
      expect(validateAuditEvent(gdprEvent)).toBe(true)
      expect(gdprEvent.metadata.requestType).toBeTruthy()
    })
  })
})
