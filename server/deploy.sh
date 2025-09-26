#!/bin/bash

# Treasury Vault Timer - Render Deployment Script
echo "🚀 Deploying Treasury Vault Timer Backend to Render..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the server directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Create data directory if it doesn't exist
echo "📁 Setting up persistent storage..."
mkdir -p data

# Copy existing database to persistent storage if it exists
if [ -f "vaults.db" ] && [ ! -f "data/vaults.db" ]; then
    echo "📋 Copying existing database to persistent storage..."
    cp vaults.db data/vaults.db
fi

# Set proper permissions
chmod 755 data

echo "✅ Deployment preparation complete!"
echo "🔧 Environment variables to set in Render:"
echo "   - NODE_ENV=production"
echo "   - HELIUS_API_KEY=466f06cf-0f8e-4f05-9c46-a95cb4a83f67"
echo "   - FRONTEND_URL=https://treasury-vault-timer.vercel.app"
echo "   - WEBHOOK_SECRET=<your-secure-webhook-secret>"
echo "   - ADMIN_KEY=<your-secure-admin-key>"
echo "   - DATABASE_PATH=/opt/render/project/server/data/vaults.db"
echo ""
echo "🌐 Your backend will be available at: https://treasury-vault-timer-backend.onrender.com"
