#!/usr/bin/env node

// Script to migrate local vault data to Render backend
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RENDER_BACKEND_URL = 'https://treasury-vault-timer-backend.onrender.com';
const LOCAL_DB_PATH = path.join(__dirname, 'server', 'vaults.db');

console.log('🔄 Migrating local vault data to Render backend...');

async function migrateVaults() {
  try {
    // Check if local database exists
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      console.log('❌ Local database not found at:', LOCAL_DB_PATH);
      return;
    }

    console.log('📋 Found local database, fetching vaults...');

    // Get vaults from local backend
    const localResponse = await fetch('http://localhost:3001/api/admin/vaults');
    if (!localResponse.ok) {
      console.log('❌ Failed to fetch local vaults. Make sure local backend is running on port 3001');
      return;
    }

    const localData = await localResponse.json();
    const localVaults = localData.vaults || [];

    console.log(`📊 Found ${localVaults.length} local vaults`);

    // Get vaults from Render backend
    const renderResponse = await fetch(`${RENDER_BACKEND_URL}/api/admin/vaults`);
    if (!renderResponse.ok) {
      console.log('❌ Failed to fetch Render vaults');
      return;
    }

    const renderData = await renderResponse.json();
    const renderVaults = renderData.vaults || [];
    const renderVaultIds = new Set(renderVaults.map(v => v.id));

    console.log(`🌐 Found ${renderVaults.length} Render vaults`);

    let migratedCount = 0;
    let skippedCount = 0;

    // Migrate each local vault to Render
    for (const vault of localVaults) {
      if (renderVaultIds.has(vault.id)) {
        console.log(`⏭️  Skipping ${vault.id} (already exists on Render)`);
        skippedCount++;
        continue;
      }

      try {
        console.log(`📤 Migrating vault: ${vault.name} (${vault.id})`);
        
        const createResponse = await fetch(`${RENDER_BACKEND_URL}/api/admin/vaults`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vault)
        });

        if (createResponse.ok) {
          console.log(`✅ Successfully migrated: ${vault.name}`);
          migratedCount++;
        } else {
          const errorText = await createResponse.text();
          console.log(`❌ Failed to migrate ${vault.name}: ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ Error migrating ${vault.name}:`, error.message);
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`✅ Migrated: ${migratedCount} vaults`);
    console.log(`⏭️  Skipped: ${skippedCount} vaults`);
    console.log(`\n🌐 Your Render backend now has all your vault data!`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
migrateVaults();
