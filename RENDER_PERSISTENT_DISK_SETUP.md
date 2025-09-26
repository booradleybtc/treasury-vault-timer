# Render Persistent Disk Setup

## Problem
Every time the backend redeploys, the SQLite database resets to the initial state, losing all vault changes, deletions, and status updates.

## Solution
Configure a persistent disk on Render to store the database file.

## Steps to Fix

### 1. Go to Render Dashboard
- Navigate to your backend service: `treasury-vault-timer-backend`
- Click on the service name to open its settings

### 2. Add Persistent Disk
- In the left sidebar, click **"Disk"**
- Click **"Connect Disk"**
- Configure the disk:
  - **Name**: `vault-database`
  - **Mount Path**: `/data`
  - **Size**: `1 GB` (minimum, can be larger if needed)
- Click **"Connect Disk"**

### 3. Redeploy
- After connecting the disk, trigger a new deployment
- The database will now persist at `/data/vaults.db`

## Verification
After setup, you should see:
- Database file persists across deployments
- Vault deletions stay deleted
- Status changes remain after redeploy
- All vault lifecycle progress is maintained

## Current Database Path
The backend is already configured to use:
- **Production**: `/data/vaults.db` (persistent disk)
- **Development**: `./server/vaults.db` (local file)

## Important Notes
- The persistent disk is **not free** on Render
- Cost is typically $0.25/GB/month
- 1GB should be more than enough for the vault database
- Data is automatically backed up by Render

## Alternative (If Persistent Disk Not Available)
If you can't set up a persistent disk, we can:
1. Switch to a cloud database (PostgreSQL, MongoDB)
2. Use Render's built-in database services
3. Implement database backup/restore on startup

Let me know if you need help with any of these alternatives!
