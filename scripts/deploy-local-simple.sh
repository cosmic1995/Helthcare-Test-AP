#!/bin/bash

# Healthcare Compliance SaaS - Simplified Local Deployment
# This script helps you deploy without requiring admin privileges

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏥 Healthcare Compliance SaaS - Simplified Deployment${NC}"
echo -e "${BLUE}====================================================${NC}"
echo ""

print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "web" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting simplified deployment setup..."

# Option 1: Check for existing gcloud installation
if command -v gcloud &> /dev/null; then
    print_success "Google Cloud CLI already installed"
    GCLOUD_AVAILABLE=true
else
    print_warning "Google Cloud CLI not found"
    GCLOUD_AVAILABLE=false
fi

# Option 2: Check for Docker
if command -v docker &> /dev/null; then
    print_success "Docker is available"
    DOCKER_AVAILABLE=true
else
    print_warning "Docker not found"
    DOCKER_AVAILABLE=false
fi

echo ""
print_status "=== Deployment Options Available ==="
echo ""

if [ "$GCLOUD_AVAILABLE" = true ]; then
    echo -e "${GREEN}✅ Option 1: Direct Google Cloud Deployment${NC}"
    echo "   You can deploy directly using the existing gcloud CLI"
    echo ""
fi

echo -e "${BLUE}🌐 Option 2: Google Cloud Shell Deployment (Recommended)${NC}"
echo "   Use Google Cloud Shell - no local setup required"
echo "   📖 Guide: docs/CLOUD-SHELL-DEPLOYMENT.md"
echo ""

echo -e "${BLUE}🔄 Option 3: GitHub Actions CI/CD Deployment${NC}"
echo "   Push to GitHub and deploy automatically"
echo "   📖 Guide: .github/workflows/deploy.yml"
echo ""

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo -e "${GREEN}🐳 Option 4: Local Development Environment${NC}"
    echo "   Run locally with Docker Compose"
    echo ""
fi

# Create deployment instructions file
cat > DEPLOYMENT-INSTRUCTIONS.md << 'EOF'
# Healthcare Compliance SaaS - Deployment Instructions

## 🚀 **Quick Start: Choose Your Deployment Method**

### **Method 1: Google Cloud Shell (Recommended - No Local Setup)**

1. **Open Google Cloud Console**: https://console.cloud.google.com
2. **Activate Cloud Shell** (terminal icon in top-right)
3. **Upload your project**:
   ```bash
   # Create zip file on your local machine first
   cd "/Users/5014174/Desktop"
   zip -r healthcare-compliance-saas.zip "Helthcare Test AP"
   
   # Then upload to Cloud Shell and extract
   unzip healthcare-compliance-saas.zip
   cd "Helthcare Test AP"
   ```
4. **Run deployment**:
   ```bash
   chmod +x scripts/*.sh
   ./scripts/deploy-production.sh
   ```

### **Method 2: GitHub Actions (Automated CI/CD)**

1. **Create GitHub repository** and push your code
2. **Set repository secrets**:
   - `GCP_PROJECT_ID`: Your Google Cloud project ID
   - `GCP_SA_KEY`: Service account JSON key
3. **Push to main branch** - deployment runs automatically

### **Method 3: Local Development (Docker)**

```bash
# Start local development environment
docker-compose up -d

# Access at http://localhost:3000
```

## 📋 **Pre-Deployment Checklist**

- [ ] Google Cloud account with billing enabled
- [ ] Project ID: `healthcare-compliance-prod`
- [ ] Required APIs enabled (done automatically by script)
- [ ] Review: `scripts/pre-deployment-checklist.md`

## 🎯 **After Deployment**

1. **Validate deployment**: Run `./scripts/validate-deployment.sh`
2. **Access your platform** at the provided URLs
3. **Set up initial users** and organizations
4. **Configure integrations** (Jira, Azure DevOps, etc.)

## 🏥 **Your Platform Includes**

✅ **Complete Healthcare Compliance Management**
✅ **AI-Powered Test Generation** 
✅ **Requirements Traceability Matrix**
✅ **ALM Tool Integrations**
✅ **Regulatory Compliance** (FDA, ISO, HIPAA, GDPR)
✅ **Enterprise Security & Audit Trails**

**Ready to revolutionize healthcare compliance!** 🚀
EOF

print_success "Created deployment instructions: DEPLOYMENT-INSTRUCTIONS.md"

echo ""
print_status "=== Next Steps ==="
echo ""

echo -e "${BLUE}1. Choose your preferred deployment method above${NC}"
echo -e "${BLUE}2. Follow the specific guide for your chosen method${NC}"
echo -e "${BLUE}3. Your healthcare compliance platform will be live!${NC}"
echo ""

print_success "Healthcare Compliance SaaS is ready for deployment!"
print_status "📖 Read DEPLOYMENT-INSTRUCTIONS.md for detailed steps"
print_status "🌐 Recommended: Use Google Cloud Shell for easiest deployment"

echo ""
echo -e "${GREEN}🏥 Your platform is ready to serve healthcare organizations worldwide! 🚀${NC}"
