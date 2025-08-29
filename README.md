# Healthcare Compliance SaaS

A production-ready SaaS platform for regulated healthcare that automatically converts requirements/specs into compliant, traceable test cases and integrates with enterprise ALM tools.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js Web   │    │   Firebase Auth  │    │  Google Cloud   │
│     Frontend    │◄──►│   SSO/SAML/OIDC  │    │    Platform     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway                                 │
└─────────────────────────────────────────────────────────────────┘
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ingest API    │    │ AI Orchestrator │    │  ALM Adapters   │
│   (Cloud Run)   │    │   (Cloud Run)   │    │   (Cloud Run)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Cloud Storage  │    │   Vertex AI     │    │ Jira/ADO/Polar  │
│   + DLP + KMS   │    │ RAG + Gemini    │    │   External APIs │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                       │
         └────────────────────────┼───────────────────────┘
                                  ▼
                        ┌─────────────────┐
                        │    BigQuery     │
                        │ + Policy Tags   │
                        │ + RLS/CLS       │
                        └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Google Cloud Project with billing enabled
- Terraform >= 1.5
- Node.js >= 18
- Python >= 3.11
- Docker

### 1. Infrastructure Setup

```bash
# Set up GCP credentials
gcloud auth application-default login
export GOOGLE_PROJECT_ID="your-project-id"

# Deploy infrastructure
cd infra/terraform
terraform init
terraform plan -var="project_id=${GOOGLE_PROJECT_ID}"
terraform apply
```

### 2. Configure Secrets

```bash
# Set up required secrets
gcloud secrets create firebase-config --data-file=firebase-config.json
gcloud secrets create jira-api-token --data-file=-
gcloud secrets create ado-pat --data-file=-
gcloud secrets create polarion-credentials --data-file=-
```

### 3. Deploy Services

```bash
# Build and deploy all services
make deploy-staging
```

### 4. Initialize Database

```bash
# Run migrations and seed data
make seed
```

### 5. Start Web Application

```bash
cd web
npm install
npm run dev
```

## 📁 Project Structure

```
├── infra/terraform/          # GCP infrastructure as code
├── services/
│   ├── ingest-api/          # File upload and processing service
│   ├── ai-orchestrator/     # RAG + test generation service
│   └── alm-adapters/        # ALM integration service
├── web/                     # Next.js frontend application
├── shared/                  # Shared types, schemas, and utilities
├── .github/workflows/       # CI/CD pipelines
├── samples/                 # Sample data and test files
└── docs/                    # Documentation and compliance artifacts
```

## 🔐 Compliance & Security

This application implements comprehensive security and compliance controls:

- **FDA QMSR/ISO 13485/IEC 62304**: Medical device software lifecycle processes
- **ISO 27001**: Information security management
- **21 CFR Part 11**: Electronic records and signatures
- **GDPR**: Data protection and privacy
- **CMEK Encryption**: Customer-managed encryption keys
- **DLP**: Data loss prevention and de-identification
- **Audit Trails**: Immutable logging and traceability

## 🧪 Testing

```bash
# Run all tests
make test

# Run specific test suites
make test-unit
make test-integration
make test-e2e

# Run security scans
make security-scan
```

## 📊 Monitoring & Observability

- **Cloud Logging**: Structured logs with trace correlation
- **Cloud Monitoring**: SLIs/SLOs and alerting
- **Cloud Trace**: Distributed tracing
- **Looker Studio**: RTM and compliance dashboards

## 🔄 CI/CD

GitHub Actions workflows provide:
- Automated testing and security scanning
- Infrastructure validation
- Staged deployments with canary releases
- Rollback capabilities

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Security Guide](./docs/security.md)
- [Compliance Guide](./docs/compliance.md)
- [Operations Runbook](./docs/operations.md)

## 🆘 Support

For issues and support:
1. Check the [troubleshooting guide](./docs/troubleshooting.md)
2. Review logs in Cloud Logging
3. Check service health in Cloud Monitoring

## 📄 License

Proprietary - All rights reserved
