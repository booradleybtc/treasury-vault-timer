#!/bin/bash

# Production Deployment Script for Treasury Vault Timer
# This script automates the deployment process for both frontend and backend

set -e  # Exit on any error

echo "🚀 Treasury Vault Timer - Production Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Generate secure keys if they don't exist
generate_keys() {
    print_status "Generating secure keys..."
    
    if [ ! -f ".env.production" ]; then
        print_warning "Production environment file not found. Generating secure keys..."
        node generate-secure-keys.js
        print_warning "Please update your deployment environment variables with the generated keys"
    else
        print_success "Production environment file exists"
    fi
}

# Deploy backend to Render
deploy_backend() {
    print_status "Deploying backend to Render..."
    
    # Check if git is initialized
    if [ ! -d ".git" ]; then
        print_error "Git repository not found. Please run 'git init' first."
        exit 1
    fi
    
    # Check if remote is set
    if ! git remote get-url origin > /dev/null 2>&1; then
        print_error "No remote repository found. Please add your GitHub repository:"
        echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
        exit 1
    fi
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd server
    npm install
    cd ..
    
    # Commit and push changes
    print_status "Committing and pushing changes to GitHub..."
    git add .
    git commit -m "Deploy to production - $(date '+%Y-%m-%d %H:%M:%S')" || true
    git push origin main
    
    print_success "Backend deployment initiated on Render"
    print_warning "Please check Render dashboard for deployment status"
}

# Deploy frontend to Vercel
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Deploy to Vercel
    cd frontend
    vercel --prod --yes
    cd ..
    
    print_success "Frontend deployment completed on Vercel"
}

# Run health checks
health_check() {
    print_status "Running health checks..."
    
    # Wait for deployment to complete
    print_warning "Waiting 30 seconds for deployment to complete..."
    sleep 30
    
    # Check backend health
    BACKEND_URL="https://treasury-vault-timer-backend.onrender.com"
    print_status "Checking backend health at $BACKEND_URL"
    
    if curl -f -s "$BACKEND_URL/api/health" > /dev/null; then
        print_success "Backend is healthy"
    else
        print_warning "Backend health check failed. Please check Render logs."
    fi
    
    # Check frontend
    FRONTEND_URL="https://treasury-vault-timer.vercel.app"
    print_status "Checking frontend at $FRONTEND_URL"
    
    if curl -f -s "$FRONTEND_URL" > /dev/null; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend health check failed. Please check Vercel logs."
    fi
}

# Main deployment function
main() {
    echo ""
    print_status "Starting production deployment process..."
    echo ""
    
    # Check dependencies
    check_dependencies
    
    # Generate secure keys
    generate_keys
    
    # Deploy backend
    deploy_backend
    
    # Deploy frontend
    deploy_frontend
    
    # Run health checks
    health_check
    
    echo ""
    print_success "Production deployment completed!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Update environment variables in Render dashboard"
    echo "2. Update environment variables in Vercel dashboard"
    echo "3. Set up monitoring and alerting"
    echo "4. Test all functionality"
    echo "5. Configure custom domain (optional)"
    echo ""
    echo "🔗 URLs:"
    echo "Backend: https://treasury-vault-timer-backend.onrender.com"
    echo "Frontend: https://treasury-vault-timer.vercel.app"
    echo "Health Check: https://treasury-vault-timer-backend.onrender.com/api/health"
    echo ""
    echo "📊 Monitoring:"
    echo "Render Dashboard: https://dashboard.render.com"
    echo "Vercel Dashboard: https://vercel.com/dashboard"
    echo ""
}

# Run main function
main "$@"
