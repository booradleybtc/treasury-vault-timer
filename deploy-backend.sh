#!/bin/bash

echo "🚀 Treasury Vault Timer - Backend Deployment"
echo "============================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please run 'git init' first."
    exit 1
fi

# Check if remote is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote repository found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    exit 1
fi

echo "✅ Git repository found"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy backend to Render"
git push origin main

echo ""
echo "🎉 Code pushed to GitHub!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://render.com"
echo "2. Create a new Web Service"
echo "3. Connect your GitHub repository"
echo "4. Configure the service:"
echo "   - Build Command: cd server && npm install"
echo "   - Start Command: cd server && npm start"
echo "   - Environment Variables:"
echo "     * HELIUS_API_KEY: 466f06cf-0f8e-4f05-9c46-a95cb4a83f67"
echo "     * NODE_ENV: production"
echo "5. Deploy and copy the URL"
echo "6. Update VITE_BACKEND_URL in your frontend"
echo ""
echo "🔗 Your backend will be available at: https://your-app-name.onrender.com"
