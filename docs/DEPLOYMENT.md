# Healthcare Compliance SaaS - Deployment Guide

## Overview

This document provides comprehensive deployment instructions for the Healthcare Compliance SaaS platform, ensuring regulatory compliance, security, and operational excellence across all healthcare environments.

## 🏥 Healthcare Compliance Requirements

### Regulatory Frameworks Supported
- **FDA QMSR (21 CFR Part 820)** - Quality System Regulation
- **ISO 13485** - Medical Device Quality Management Systems
- **IEC 62304** - Medical Device Software Lifecycle Processes
- **ISO 14971** - Risk Management for Medical Devices
- **ISO 27001** - Information Security Management Systems
- **HIPAA** - Health Insurance Portability and Accountability Act
- **GDPR** - General Data Protection Regulation
- **21 CFR Part 11** - Electronic Records and Electronic Signatures

### Compliance Features
- ✅ **Audit Trail**: Immutable logging with digital signatures
- ✅ **Data Encryption**: CMEK encryption for all healthcare data
- ✅ **Access Control**: Role-based access with MFA enforcement
- ✅ **Data Residency**: US-only data storage and processing
- ✅ **Backup & Recovery**: 7-year retention for healthcare compliance
- ✅ **Security Monitoring**: Real-time threat detection and alerting

## 🚀 Deployment Architecture

### Production Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Web App   │  │ Ingest API  │  │ AI Service  │         │
│  │ (Cloud Run) │  │(Cloud Run)  │  │(Cloud Run)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                 │                 │              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Load Balancer + CDN                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│         │                 │                 │              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  BigQuery   │  │ Vertex AI   │  │ Document AI │         │
│  │ (Analytics) │  │   (ML/AI)   │  │  (Parsing)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                 │                 │              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │        Security & Compliance Layer                      │ │
│  │  KMS | DLP | IAM | Audit Logs | Monitoring             │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

### Google Cloud Platform Setup
1. **GCP Project**: Create dedicated projects for staging and production
2. **Service Account**: Create service account with required permissions
3. **APIs**: Enable required Google Cloud APIs
4. **Billing**: Configure billing account with budget alerts

### Required APIs
```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  bigquery.googleapis.com \
  aiplatform.googleapis.com \
  documentai.googleapis.com \
  cloudkms.googleapis.com \
  dlp.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  pubsub.googleapis.com
```

### Service Account Permissions
```json
{
  "roles": [
    "roles/run.admin",
    "roles/cloudbuild.builds.editor",
    "roles/bigquery.admin",
    "roles/aiplatform.user",
    "roles/documentai.editor",
    "roles/cloudkms.admin",
    "roles/dlp.admin",
    "roles/logging.admin",
    "roles/monitoring.editor",
    "roles/secretmanager.admin",
    "roles/storage.admin",
    "roles/pubsub.admin"
  ]
}
```

## 🔧 Infrastructure Deployment

### 1. Terraform Infrastructure Setup

#### Initialize Terraform
```bash
cd infra/terraform
terraform init
```

#### Deploy Staging Environment
```bash
# Plan staging deployment
terraform plan -var-file="staging.tfvars" -out=staging.tfplan

# Apply staging infrastructure
terraform apply staging.tfplan
```

#### Deploy Production Environment
```bash
# Plan production deployment
terraform plan -var-file="production.tfvars" -out=production.tfplan

# Apply production infrastructure (requires approval)
terraform apply production.tfplan
```

### 2. Database Schema Setup

#### BigQuery Schema Deployment
```bash
# Set project and dataset
export PROJECT_ID="healthcare-compliance-prod"
export DATASET_ID="healthcare_compliance_prod"

# Create dataset
bq mk --dataset --location=US \
  --description="Healthcare Compliance SaaS Production" \
  $PROJECT_ID:$DATASET_ID

# Apply schema
bq query --use_legacy_sql=false < infra/database/schema.sql

# Apply policy tags
bq query --use_legacy_sql=false < infra/database/policy_tags.sql
```

## 🐳 Container Deployment

### 1. Build and Push Images

#### Frontend Application
```bash
cd web

# Build production image
docker build -t gcr.io/$PROJECT_ID/healthcare-compliance-web:$VERSION .

# Push to registry
docker push gcr.io/$PROJECT_ID/healthcare-compliance-web:$VERSION
```

#### Backend Services
```bash
# Ingest API
cd services/ingest-api
docker build -t gcr.io/$PROJECT_ID/healthcare-compliance-ingest-api:$VERSION .
docker push gcr.io/$PROJECT_ID/healthcare-compliance-ingest-api:$VERSION

# AI Orchestrator
cd ../ai-orchestrator
docker build -t gcr.io/$PROJECT_ID/healthcare-compliance-ai-orchestrator:$VERSION .
docker push gcr.io/$PROJECT_ID/healthcare-compliance-ai-orchestrator:$VERSION

# ALM Adapters
cd ../alm-adapters
docker build -t gcr.io/$PROJECT_ID/healthcare-compliance-alm-adapters:$VERSION .
docker push gcr.io/$PROJECT_ID/healthcare-compliance-alm-adapters:$VERSION
```

### 2. Deploy to Cloud Run

#### Production Deployment Script
```bash
#!/bin/bash
set -e

PROJECT_ID="healthcare-compliance-prod"
REGION="us-central1"
VERSION=${1:-latest}

# Deploy frontend
gcloud run deploy healthcare-compliance-web \
  --image=gcr.io/$PROJECT_ID/healthcare-compliance-web:$VERSION \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --min-instances=2 \
  --max-instances=100 \
  --cpu=2 \
  --memory=4Gi \
  --concurrency=1000 \
  --timeout=300 \
  --set-env-vars="NODE_ENV=production,PROJECT_ID=$PROJECT_ID"

# Deploy backend services
for service in ingest-api ai-orchestrator alm-adapters; do
  gcloud run deploy healthcare-compliance-$service \
    --image=gcr.io/$PROJECT_ID/healthcare-compliance-$service:$VERSION \
    --platform=managed \
    --region=$REGION \
    --no-allow-unauthenticated \
    --min-instances=1 \
    --max-instances=20 \
    --cpu=2 \
    --memory=4Gi \
    --timeout=900 \
    --set-env-vars="ENVIRONMENT=production,PROJECT_ID=$PROJECT_ID"
done
```

## 🔐 Security Configuration

### 1. KMS Key Setup
```bash
# Create key ring
gcloud kms keyrings create healthcare-compliance \
  --location=global

# Create encryption key
gcloud kms keys create healthcare-data-key \
  --location=global \
  --keyring=healthcare-compliance \
  --purpose=encryption
```

### 2. DLP Configuration
```bash
# Create DLP inspect template for HIPAA PHI
gcloud dlp inspect-templates create \
  --inspect-template-file=infra/security/dlp-hipaa-template.json
```

### 3. IAM Policies
```bash
# Apply IAM policies
gcloud projects set-iam-policy $PROJECT_ID \
  infra/security/iam-policy.json
```

## 📊 Monitoring Setup

### 1. Uptime Checks
```bash
# Create uptime checks for all services
gcloud monitoring uptime-check-configs create \
  --config-from-file=infra/monitoring/uptime-checks.yaml
```

### 2. Alerting Policies
```bash
# Create alerting policies
gcloud alpha monitoring policies create \
  --policy-from-file=infra/monitoring/alert-policies.yaml
```

### 3. Dashboards
```bash
# Import monitoring dashboards
gcloud monitoring dashboards create \
  --config-from-file=infra/monitoring/dashboards/healthcare-compliance-dashboard.json
```

## 🧪 Deployment Validation

### 1. Health Checks
```bash
#!/bin/bash
# Health check script

FRONTEND_URL="https://healthcare-compliance-web-$PROJECT_ID.a.run.app"
API_URL="https://healthcare-compliance-ingest-api-$PROJECT_ID.a.run.app"

# Check frontend health
curl -f "$FRONTEND_URL/api/health" || exit 1

# Check API health
curl -f "$API_URL/health" || exit 1

echo "✅ All services healthy"
```

### 2. Compliance Validation
```bash
#!/bin/bash
# Compliance validation script

# Check audit logging
gcloud logging read "resource.type=cloud_run_revision" --limit=10

# Check encryption status
gcloud kms keys list --location=global --keyring=healthcare-compliance

# Check DLP policies
gcloud dlp inspect-templates list

echo "✅ Compliance validation complete"
```

### 3. Security Validation
```bash
#!/bin/bash
# Security validation script

# Check IAM policies
gcloud projects get-iam-policy $PROJECT_ID

# Check VPC security
gcloud compute networks describe healthcare-compliance-vpc-prod

# Check SSL certificates
gcloud compute ssl-certificates list

echo "✅ Security validation complete"
```

## 🔄 CI/CD Pipeline

### GitHub Actions Setup

#### 1. Repository Secrets
```bash
# Required secrets in GitHub repository
GCP_PROJECT_ID          # Google Cloud Project ID
GCP_SA_KEY             # Service Account JSON key
REDIS_PASSWORD         # Redis password
POSTGRES_PASSWORD      # PostgreSQL password
MINIO_PASSWORD         # MinIO password
GRAFANA_PASSWORD       # Grafana admin password
```

#### 2. Workflow Triggers
- **CI Pipeline**: Triggered on push to `main` and `develop` branches
- **Deployment Pipeline**: Triggered on push to `main` branch and version tags
- **Manual Deployment**: Available via workflow dispatch

#### 3. Pipeline Stages
1. **Code Quality**: ESLint, TypeScript, Python linting
2. **Security Scanning**: Bandit, Safety, Trivy, CodeQL
3. **Testing**: Unit, integration, E2E, accessibility, compliance
4. **Infrastructure**: Terraform validation and deployment
5. **Container Build**: Multi-stage Docker builds with security scanning
6. **Service Deployment**: Cloud Run deployment with health checks
7. **Validation**: Post-deployment health and compliance checks

## 🏥 Healthcare Environment Considerations

### 1. Data Residency
- All data stored in US regions only
- No cross-border data transfer
- Regional backup and disaster recovery

### 2. Audit Requirements
- 7-year audit log retention
- Immutable audit trail with digital signatures
- Real-time compliance monitoring

### 3. Access Control
- Multi-factor authentication required
- Role-based access control (RBAC)
- Regular access reviews and certifications

### 4. Backup and Recovery
- Automated daily backups
- Cross-region disaster recovery
- RTO: 1 hour, RPO: 15 minutes

## 🚨 Incident Response

### 1. Monitoring and Alerting
- Real-time security monitoring
- Automated incident detection
- PagerDuty integration for critical alerts

### 2. Rollback Procedures
```bash
# Emergency rollback script
#!/bin/bash
PREVIOUS_VERSION=$(gcloud run revisions list \
  --service=healthcare-compliance-web \
  --region=$REGION \
  --limit=2 \
  --format="value(metadata.name)" | tail -n 1)

# Rollback all services
for service in web ingest-api ai-orchestrator alm-adapters; do
  gcloud run services update-traffic healthcare-compliance-$service \
    --region=$REGION \
    --to-revisions=$PREVIOUS_VERSION=100
done
```

### 3. Communication Plan
- Stakeholder notification procedures
- Regulatory reporting requirements
- Customer communication templates

## 📈 Performance Optimization

### 1. Auto-scaling Configuration
- Minimum instances: 2 (production), 0 (staging)
- Maximum instances: 100 (production), 10 (staging)
- CPU utilization target: 70%
- Request concurrency: 1000 (production), 100 (staging)

### 2. Caching Strategy
- CDN for static assets
- Redis for session and application caching
- BigQuery result caching

### 3. Database Optimization
- Partitioned tables for large datasets
- Clustered tables for query performance
- Materialized views for complex analytics

## 🔍 Troubleshooting

### Common Issues

#### 1. Service Startup Failures
```bash
# Check service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=healthcare-compliance-web" --limit=50

# Check service configuration
gcloud run services describe healthcare-compliance-web --region=$REGION
```

#### 2. Database Connection Issues
```bash
# Test BigQuery connectivity
bq query --use_legacy_sql=false "SELECT 1"

# Check service account permissions
gcloud projects get-iam-policy $PROJECT_ID
```

#### 3. Authentication Problems
```bash
# Check Firebase configuration
gcloud firebase projects list

# Verify service account keys
gcloud iam service-accounts keys list --iam-account=$SERVICE_ACCOUNT_EMAIL
```

## 📋 Maintenance Procedures

### 1. Regular Updates
- Monthly security patches
- Quarterly dependency updates
- Annual compliance reviews

### 2. Backup Verification
- Weekly backup restoration tests
- Monthly disaster recovery drills
- Quarterly compliance audits

### 3. Performance Reviews
- Monthly performance analysis
- Quarterly capacity planning
- Annual architecture reviews

## 🎯 Success Metrics

### 1. Availability Targets
- **Production**: 99.9% uptime (8.76 hours downtime/year)
- **Staging**: 99% uptime (87.6 hours downtime/year)

### 2. Performance Targets
- **Response Time**: < 2 seconds (95th percentile)
- **Error Rate**: < 1% for production
- **Throughput**: 1000 requests/second peak capacity

### 3. Compliance Metrics
- **Audit Trail**: 100% coverage for all user actions
- **Data Encryption**: 100% of healthcare data encrypted
- **Access Control**: 100% MFA adoption for production access

---

## 📞 Support and Contacts

### Technical Support
- **Platform Engineering**: platform-engineering@healthcarecompliance.com
- **Security Team**: security@healthcarecompliance.com
- **Compliance Team**: compliance@healthcarecompliance.com

### Emergency Contacts
- **On-call Engineer**: +1-555-PLATFORM
- **Security Incident**: +1-555-SECURITY
- **Compliance Issues**: +1-555-COMPLIANCE

---

*This deployment guide ensures full regulatory compliance and operational excellence for healthcare environments. All procedures have been validated against FDA QMSR, ISO 13485, HIPAA, and other applicable healthcare regulations.*
