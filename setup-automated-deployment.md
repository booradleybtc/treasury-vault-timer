# 🚀 Automated Deployment Setup

This guide will help you set up automatic deployments to both Render and Vercel using GitHub Actions.

## 📋 Prerequisites

1. **GitHub Repository** - Your code must be in a GitHub repo
2. **Render Account** - For backend deployment
3. **Vercel Account** - For frontend deployment

## 🔑 Step 1: Get Render Token

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on your profile → **Account Settings**
3. Scroll down to **API Keys** section
4. Click **New API Key**
5. Give it a name like "GitHub Actions"
6. Copy the generated token

## 🆔 Step 2: Get Render Service ID

1. In your Render dashboard, go to your backend service
2. The Service ID is in the URL: `https://dashboard.render.com/web/svc/[SERVICE_ID]`
3. Copy the SERVICE_ID part

## 🔑 Step 3: Get Vercel Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your profile → **Settings**
3. Go to **Tokens** tab
4. Click **Create Token**
5. Give it a name like "GitHub Actions"
6. Set scope to "Full Account"
7. Copy the generated token

## 🆔 Step 4: Get Vercel Project & Org IDs

### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (run this in your project directory)
vercel link

# This will show you the Project ID and Org ID
```

### Option B: From Vercel Dashboard
1. Go to your project in Vercel dashboard
2. Click **Settings** → **General**
3. Scroll down to find:
   - **Project ID**
   - **Team ID** (this is your Org ID)

## 🔐 Step 5: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `RENDER_TOKEN` | Your Render API token |
| `RENDER_SERVICE_ID` | Your Render service ID |
| `VERCEL_TOKEN` | Your Vercel token |
| `VERCEL_ORG_ID` | Your Vercel team/org ID |
| `VERCEL_PROJECT_ID` | Your Vercel project ID |

## ✅ Step 6: Test the Automation

1. Make a small change to your code
2. Commit and push to main branch:
   ```bash
   git add .
   git commit -m "Test automated deployment"
   git push
   ```
3. Go to your GitHub repository → **Actions** tab
4. You should see the deployment workflow running
5. Check both Render and Vercel to confirm deployments

## 🎉 You're Done!

Now every time you push to the main branch, both your backend and frontend will automatically deploy!

## 🔧 Troubleshooting

### Render Deployment Fails
- Check if your `RENDER_TOKEN` has the correct permissions
- Verify your `RENDER_SERVICE_ID` is correct
- Check Render logs for specific errors

### Vercel Deployment Fails
- Verify all Vercel secrets are correct
- Check if your Vercel project is properly linked
- Look at Vercel deployment logs for errors

### GitHub Actions Fail
- Check the Actions tab in your GitHub repo
- Look at the specific step that failed
- Verify all secrets are properly set

## 📝 Notes

- The workflow runs on both `push` and `pull_request` to main branch
- Backend deployment uses Render's API to trigger a new deploy
- Frontend deployment builds the project and deploys to Vercel
- Both deployments run in parallel for faster results
