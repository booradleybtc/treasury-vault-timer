#!/usr/bin/env node

// Script to update frontend configuration to use Render backend
const fs = require('fs');
const path = require('path');

const RENDER_BACKEND_URL = 'https://treasury-vault-timer-backend.onrender.com';
const FRONTEND_DIR = path.join(__dirname, 'frontend');

console.log('🔄 Updating frontend to use Render backend...');

// Files that might contain backend URLs
const filesToUpdate = [
  'src/lib/api/vaults.ts',
  'src/app/page.tsx',
  'src/app/vaults/page.tsx',
  'src/app/vault/[id]/page.tsx',
  'src/app/admin/index/page.tsx',
  'src/app/admin/launch/page.tsx',
  'src/app/admin/details/[id]/page.tsx',
  'src/app/admin/preview/[id]/page.tsx'
];

// Common backend URL patterns to replace
const backendPatterns = [
  /http:\/\/localhost:3001/g,
  /http:\/\/localhost:3000/g,
  /'http:\/\/localhost:3001'/g,
  /"http:\/\/localhost:3001"/g,
  /'http:\/\/localhost:3000'/g,
  /"http:\/\/localhost:3000"/g,
  /process\.env\.NEXT_PUBLIC_BACKEND_URL/g,
  /process\.env\.BACKEND_URL/g
];

let updatedFiles = 0;

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(FRONTEND_DIR, filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      let hasChanges = false;
      
      // Replace backend URL patterns
      backendPatterns.forEach(pattern => {
        const newContent = content.replace(pattern, `'${RENDER_BACKEND_URL}'`);
        if (newContent !== content) {
          content = newContent;
          hasChanges = true;
        }
      });
      
      // Add environment variable if not present
      if (content.includes('process.env') && !content.includes('NEXT_PUBLIC_BACKEND_URL')) {
        content = content.replace(
          /const\s+(\w+)\s*=\s*['"]/,
          `const $1 = process.env.NEXT_PUBLIC_BACKEND_URL || '${RENDER_BACKEND_URL}'; const _ = '`
        );
        hasChanges = true;
      }
      
      if (hasChanges) {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Updated: ${filePath}`);
        updatedFiles++;
      } else {
        console.log(`⏭️  No changes needed: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${filePath}:`, error.message);
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

// Create/update environment file
const envPath = path.join(FRONTEND_DIR, '.env.local');
const envContent = `NEXT_PUBLIC_BACKEND_URL=${RENDER_BACKEND_URL}
NEXT_PUBLIC_WS_URL=${RENDER_BACKEND_URL}`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated: .env.local');
  updatedFiles++;
} catch (error) {
  console.error('❌ Error updating .env.local:', error.message);
}

console.log(`\n🎉 Frontend update complete! Updated ${updatedFiles} files.`);
console.log(`\n📋 Next steps:`);
console.log(`1. Restart your frontend dev server: npm run dev`);
console.log(`2. Test the connection to Render backend`);
console.log(`3. Verify all vault operations work correctly`);
console.log(`\n🌐 Your Render backend is running at: ${RENDER_BACKEND_URL}`);
