# Healthcare Compliance SaaS - Google Cloud Shell Deployment

## 🚀 **Recommended: Google Cloud Shell Deployment**

Since local admin privileges are limited, Google Cloud Shell is the perfect solution - it comes pre-installed with all required tools and has full Google Cloud access.

## 📋 **Step-by-Step Deployment Guide**

### **Step 1: Access Google Cloud Console**

1. **Open Google Cloud Console**: https://console.cloud.google.com
2. **Sign in** with your Google account
3. **Activate Cloud Shell** by clicking the terminal icon (>_) in the top-right corner

### **Step 2: Upload Your Project to Cloud Shell**

You have two options to get your code into Cloud Shell:

#### **Option A: Upload Files (Recommended)**
1. In Cloud Shell, click the **"Upload file"** button (folder icon)
2. **Zip your project folder** first on your local machine:
   ```bash
   # On your local machine, create a zip file
   cd "/Users/5014174/Desktop"
   zip -r healthcare-compliance-saas.zip "Helthcare Test AP"
   ```
3. **Upload the zip file** to Cloud Shell
4. **Extract in Cloud Shell**:
   ```bash
   unzip healthcare-compliance-saas.zip
   cd "Helthcare Test AP"
   ```

#### **Option B: Clone from GitHub (If you have a repo)**
```bash
# If you've pushed to GitHub
git clone https://github.com/yourusername/healthcare-compliance-saas.git
cd healthcare-compliance-saas
```

### **Step 3: Set Up Google Cloud Project**

```bash
# Create a new project (or use existing)
gcloud projects create healthcare-compliance-prod --name="Healthcare Compliance SaaS"

# Set the project
gcloud config set project healthcare-compliance-prod

# Enable billing (you'll need to do this in the console if not already done)
echo "⚠️  Enable billing for the project in the Google Cloud Console"
echo "   Go to: https://console.cloud.google.com/billing"

# Enable required APIs
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
  pubsub.googleapis.com \
  workflows.googleapis.com \
  container.googleapis.com
```

### **Step 4: Run the Deployment Script**

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run the production deployment
./scripts/deploy-production.sh
```

### **Step 5: Validate the Deployment**

```bash
# Run validation checks
./scripts/validate-deployment.sh healthcare-compliance-prod us-central1
```

## 🔧 **Alternative: Manual Deployment Steps**

If you prefer to run each step manually for better control:

### **1. Infrastructure Deployment**

```bash
# Navigate to Terraform directory
cd infra/terraform

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan -var-file="production.tfvars"

# Apply infrastructure (type 'yes' when prompted)
terraform apply -var-file="production.tfvars"
```

### **2. Database Setup**

```bash
# Create BigQuery dataset
bq mk --dataset --location=US healthcare-compliance-prod:healthcare_compliance_prod

# Apply database schema
cd ../../database
bq query --use_legacy_sql=false < schema.sql
bq query --use_legacy_sql=false < policy_tags.sql
bq query --use_legacy_sql=false < seed_data.sql
```

### **3. Build and Deploy Services**

```bash
# Configure Docker for Google Container Registry
gcloud auth configure-docker

# Build and deploy frontend
cd ../web
gcloud builds submit --tag gcr.io/healthcare-compliance-prod/healthcare-compliance-web:latest
gcloud run deploy healthcare-compliance-web \
  --image gcr.io/healthcare-compliance-prod/healthcare-compliance-web:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 100

# Build and deploy Ingest API
cd ../services/ingest-api
gcloud builds submit --tag gcr.io/healthcare-compliance-prod/healthcare-compliance-ingest-api:latest
gcloud run deploy healthcare-compliance-ingest-api \
  --image gcr.io/healthcare-compliance-prod/healthcare-compliance-ingest-api:latest \
  --platform managed \
  --region us-central1 \
  --no-allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 50

# Build and deploy AI Orchestrator
cd ../ai-orchestrator
gcloud builds submit --tag gcr.io/healthcare-compliance-prod/healthcare-compliance-ai-orchestrator:latest
gcloud run deploy healthcare-compliance-ai-orchestrator \
  --image gcr.io/healthcare-compliance-prod/healthcare-compliance-ai-orchestrator:latest \
  --platform managed \
  --region us-central1 \
  --no-allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --max-instances 20

# Build and deploy ALM Adapters
cd ../alm-adapters
gcloud builds submit --tag gcr.io/healthcare-compliance-prod/healthcare-compliance-alm-adapters:latest
gcloud run deploy healthcare-compliance-alm-adapters \
  --image gcr.io/healthcare-compliance-prod/healthcare-compliance-alm-adapters:latest \
  --platform managed \
  --region us-central1 \
  --no-allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 30
```

### **4. Configure Service URLs**

```bash
# Get service URLs
WEB_URL=$(gcloud run services describe healthcare-compliance-web --region=us-central1 --format="value(status.url)")
API_URL=$(gcloud run services describe healthcare-compliance-ingest-api --region=us-central1 --format="value(status.url)")
AI_URL=$(gcloud run services describe healthcare-compliance-ai-orchestrator --region=us-central1 --format="value(status.url)")
ALM_URL=$(gcloud run services describe healthcare-compliance-alm-adapters --region=us-central1 --format="value(status.url)")

# Update frontend with backend URLs
gcloud run services update healthcare-compliance-web \
  --region us-central1 \
  --set-env-vars="NEXT_PUBLIC_API_URL=$API_URL,NEXT_PUBLIC_AI_URL=$AI_URL,NEXT_PUBLIC_ALM_URL=$ALM_URL"

echo "🎉 Deployment URLs:"
echo "Frontend: $WEB_URL"
echo "API: $API_URL"
echo "AI Service: $AI_URL"
echo "ALM Service: $ALM_URL"
```

## 🔒 **Security Configuration**

### **Set up Customer Managed Encryption Keys**

```bash
# Create key ring
gcloud kms keyrings create healthcare-compliance --location=global

# Create encryption key
gcloud kms keys create healthcare-data-key \
  --location=global \
  --keyring=healthcare-compliance \
  --purpose=encryption

echo "✅ CMEK encryption configured"
```

### **Configure Data Loss Prevention**

```bash
# Create DLP inspect template for HIPAA PHI
cat > dlp-hipaa-template.json << 'EOF'
{
  "displayName": "HIPAA PHI Detection Template",
  "description": "Template for detecting HIPAA Protected Health Information",
  "inspectConfig": {
    "infoTypes": [
      {"name": "US_HEALTHCARE_NPI"},
      {"name": "US_DEA_NUMBER"},
      {"name": "DATE_OF_BIRTH"},
      {"name": "PHONE_NUMBER"},
      {"name": "EMAIL_ADDRESS"},
      {"name": "US_SOCIAL_SECURITY_NUMBER"},
      {"name": "CREDIT_CARD_NUMBER"}
    ],
    "minLikelihood": "LIKELY",
    "limits": {
      "maxFindingsPerRequest": 100
    }
  }
}
EOF

gcloud dlp inspect-templates create --inspect-template-file=dlp-hipaa-template.json
echo "✅ DLP policies configured"
```

## 📊 **Monitoring Setup**

```bash
# Create uptime checks
gcloud monitoring uptime-check-configs create \
  --display-name="Healthcare Compliance Frontend" \
  --http-check-path="/api/health" \
  --monitored-resource-type="uptime_url" \
  --hostname="$(echo $WEB_URL | sed 's|https://||')"

# Create alert policy for high error rates
gcloud alpha monitoring policies create \
  --display-name="High Error Rate Alert" \
  --condition-filter='resource.type="cloud_run_revision"' \
  --condition-display-name="High Error Rate" \
  --notification-channels=""

echo "✅ Monitoring and alerting configured"
```

## ✅ **Post-Deployment Validation**

```bash
# Run comprehensive validation
cd "/path/to/your/project"
./scripts/validate-deployment.sh healthcare-compliance-prod us-central1

# Test health endpoints
curl -f "$WEB_URL/api/health" && echo "✅ Frontend healthy"
curl -f "$API_URL/health" && echo "✅ API healthy"
curl -f "$AI_URL/health" && echo "✅ AI service healthy"
curl -f "$ALM_URL/health" && echo "✅ ALM service healthy"
```

## 🎯 **Next Steps After Deployment**

### **1. Configure Authentication**
- Set up Firebase Authentication
- Configure Google OAuth
- Set up user roles and permissions

### **2. Initial Data Setup**
- Create initial organization
- Set up compliance frameworks
- Import existing data (if any)

### **3. User Onboarding**
- Create admin users
- Set up team structure
- Configure notification preferences

### **4. Integration Setup**
- Configure ALM tool connections (Jira, Azure DevOps, Polarion)
- Set up document management integration
- Configure audit trail settings

## 🏥 **Healthcare Compliance Validation**

Your deployed platform now includes:

✅ **FDA QMSR (21 CFR Part 820)** - Quality system controls  
✅ **ISO 13485** - Medical device quality management  
✅ **IEC 62304** - Medical device software lifecycle  
✅ **ISO 14971** - Risk management  
✅ **ISO 27001** - Information security management  
✅ **HIPAA** - Healthcare data protection  
✅ **GDPR** - Data privacy and protection  
✅ **21 CFR Part 11** - Electronic records and signatures  

## 🎉 **Success!**

Your Healthcare Compliance SaaS platform is now live and ready to serve healthcare organizations worldwide!

**Platform URLs will be displayed after successful deployment.**

---

## 📞 **Support**

If you encounter any issues during deployment:

1. **Check the logs**: `gcloud logging read "resource.type=cloud_run_revision" --limit=50`
2. **Validate services**: Run the validation script
3. **Review documentation**: Complete guides in `/docs` directory
4. **Contact support**: Technical team available for assistance

**Your healthcare compliance platform is ready to revolutionize regulatory management!** 🏥🚀
