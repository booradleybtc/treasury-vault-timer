# 🚀 Production Deployment Setup

This guide will help you set up automated deployments for the Treasury Vault Timer project.

## 📋 Prerequisites

1. **GitHub Repository** - Your code must be in a GitHub repo
2. **Render Account** - For backend deployment (Pro plan recommended)
3. **Vercel Account** - For frontend deployment (Pro plan recommended)

## 🔑 Step 1: Get Render Credentials

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on your profile → **Account Settings**
3. Scroll down to **API Keys** section
4. Click **New API Key**
5. Give it a name like "GitHub Actions"
6. Copy the generated token

### Get Render Service ID

1. In your Render dashboard, go to your backend service
2. The Service ID is in the URL: `https://dashboard.render.com/web/svc/[SERVICE_ID]`
3. Copy the SERVICE_ID part

## 🔑 Step 2: Get Vercel Credentials

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your profile → **Settings**
3. Go to **Tokens** tab
4. Click **Create Token**
5. Give it a name like "GitHub Actions"
6. Set scope to "Full Account"
7. Copy the generated token

### Get Vercel Project & Org IDs

#### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (run this in your project directory)
vercel link

# This will show you the Project ID and Org ID
```

#### Option B: From Vercel Dashboard
1. Go to your project in Vercel dashboard
2. Click **Settings** → **General**
3. Scroll down to find:
   - **Project ID**
   - **Team ID** (this is your Org ID)

## 🔐 Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `RENDER_API_KEY` | Your Render API token | For backend deployment |
| `RENDER_SERVICE_ID` | Your Render service ID | For backend deployment |
| `VERCEL_TOKEN` | Your Vercel token | For frontend deployment |
| `VERCEL_ORG_ID` | Your Vercel team/org ID | For frontend deployment |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | For frontend deployment |
| `NEXT_PUBLIC_BACKEND_URL` | Your Render backend URL | For frontend environment |
| `STAGING_BACKEND_URL` | Your staging backend URL | For staging deployments |

## 🏗️ Step 4: Configure Render Service

1. Go to your Render service settings
2. Update the following settings:

### Build Settings
- **Build Command**: `npm run build`
- **Start Command**: `npm run server:start`
- **Root Directory**: Leave empty (uses root)

### Environment Variables
- `NODE_ENV`: `production`
- `HELIUS_API_KEY`: Your Helius API key
- `DATABASE_PATH`: `/data/vaults.db` (for persistent storage)

### Plan
- **Plan**: Pro (recommended for production)
- **Auto-Deploy**: Yes (from main branch)

## 🌐 Step 5: Configure Vercel Project

1. Go to your Vercel project settings
2. Update the following settings:

### Environment Variables
- `NEXT_PUBLIC_BACKEND_URL`: Your Render backend URL
- `NODE_ENV`: `production`

### Build Settings
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### Domains
- Add your custom domain if you have one
- Configure SSL certificates

## 🔄 Step 6: Test Automated Deployment

1. Make a small change to your code
2. Commit and push to the `main` branch:
   ```bash
   git add .
   git commit -m "Test automated deployment"
   git push origin main
   ```
3. Check the GitHub Actions tab to see the deployment progress
4. Verify both backend and frontend are deployed successfully

## 📊 Step 7: Monitor Deployments

### GitHub Actions
- Go to your repository → **Actions** tab
- Monitor deployment status and logs

### Render Dashboard
- Check your service status and logs
- Monitor resource usage and performance

### Vercel Dashboard
- Check deployment status and logs
- Monitor performance metrics

## 🚨 Troubleshooting

### Common Issues

#### Render Deployment Fails
- Check build logs in Render dashboard
- Verify environment variables are set correctly
- Ensure build command is correct

#### Vercel Deployment Fails
- Check build logs in Vercel dashboard
- Verify environment variables are set correctly
- Ensure frontend builds successfully locally

#### GitHub Actions Fails
- Check the Actions tab for detailed error logs
- Verify all secrets are set correctly
- Ensure the workflow files are in the correct location

### Debug Commands

```bash
# Test backend build locally
cd server
npm ci
npm run build

# Test frontend build locally
cd frontend
npm ci
npm run build

# Test with production environment
NODE_ENV=production npm run build
```

## 🔧 Advanced Configuration

### Custom Domains
1. **Backend**: Configure custom domain in Render
2. **Frontend**: Configure custom domain in Vercel
3. Update environment variables with new URLs

### SSL Certificates
- Both Render and Vercel provide automatic SSL
- Custom domains will get SSL certificates automatically

### Monitoring
- Set up monitoring alerts in both platforms
- Configure health check endpoints
- Set up error tracking (Sentry, etc.)

## 📈 Production Checklist

- [ ] All secrets are configured
- [ ] Environment variables are set
- [ ] Custom domains are configured
- [ ] SSL certificates are active
- [ ] Monitoring is set up
- [ ] Error tracking is configured
- [ ] Backup strategy is in place
- [ ] Performance monitoring is active

## 🆘 Support

If you encounter issues:

1. Check the logs in both Render and Vercel dashboards
2. Review GitHub Actions logs
3. Test builds locally
4. Verify all configuration settings
5. Check the troubleshooting section above

For additional help, refer to:
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
