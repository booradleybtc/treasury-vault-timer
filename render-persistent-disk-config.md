# Render Persistent Disk Configuration

## Problem
Currently, the SQLite database gets wiped on every deployment because Render's file system is ephemeral. This causes:
- Deleted vaults to reappear after redeployment
- Loss of all vault data and configurations
- Database resets to initial seed data

## Solution: Configure Persistent Disk

### Step 1: Add Persistent Disk to Render Service

1. Go to your Render dashboard
2. Navigate to your `treasury-vault-timer-backend` service
3. Go to **Settings** tab
4. Scroll down to **Persistent Disks** section
5. Click **Add Persistent Disk**
6. Configure:
   - **Mount Path**: `/data`
   - **Size**: 1 GB (minimum)
   - **Name**: `vault-database`

### Step 2: Update Database Path

The database file needs to be stored in the persistent disk directory. Update your `server/database.js`:

```javascript
// Change from:
const dbPath = path.join(__dirname, 'vaults.db');

// To:
const dbPath = path.join('/data', 'vaults.db');
```

### Step 3: Update Database Initialization

Ensure the `/data` directory exists before creating the database:

```javascript
import fs from 'fs';

// Ensure persistent disk directory exists
const dataDir = '/data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'vaults.db');
```

### Step 4: Deploy Changes

1. Commit the database path changes
2. Push to trigger deployment
3. The persistent disk will be mounted and database will persist across deployments

## Benefits

✅ **Persistent Data**: Vault data survives deployments
✅ **No More Resets**: Deleted vaults stay deleted
✅ **Reliable State**: Database maintains consistency
✅ **Cost Effective**: Only $0.25/GB/month for persistent storage

## Alternative: External Database

For production, consider migrating to:
- **PostgreSQL** (Render provides managed PostgreSQL)
- **MongoDB Atlas** (cloud-hosted)
- **Supabase** (PostgreSQL with real-time features)

This would eliminate the need for persistent disks and provide better scalability.
