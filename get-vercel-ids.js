#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Getting Vercel Project Information...\n');

try {
  // Check if vercel is installed
  execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.log('❌ Vercel CLI not found. Installing...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI installed successfully!\n');
  } catch (installError) {
    console.log('❌ Failed to install Vercel CLI. Please install manually:');
    console.log('   npm install -g vercel\n');
    process.exit(1);
  }
}

try {
  // Check if project is linked
  const vercelJsonPath = '.vercel/project.json';
  if (!fs.existsSync(vercelJsonPath)) {
    console.log('🔗 Linking project to Vercel...');
    console.log('Please follow the prompts to link your project.\n');
    execSync('vercel link', { stdio: 'inherit' });
  }

  // Read project info
  const projectInfo = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  
  console.log('✅ Vercel Project Information:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📁 Project ID: ${projectInfo.projectId}`);
  console.log(`👥 Org ID: ${projectInfo.orgId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('🔐 Add these to your GitHub Secrets:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`VERCEL_PROJECT_ID = ${projectInfo.projectId}`);
  console.log(`VERCEL_ORG_ID = ${projectInfo.orgId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📝 Next steps:');
  console.log('1. Get your Vercel token from https://vercel.com/account/tokens');
  console.log('2. Add all secrets to GitHub: Settings → Secrets and variables → Actions');
  console.log('3. Push code to trigger automated deployment!');

} catch (error) {
  console.log('❌ Error getting Vercel info:', error.message);
  console.log('\n📝 Manual steps:');
  console.log('1. Run: vercel link');
  console.log('2. Check .vercel/project.json for IDs');
  console.log('3. Get token from https://vercel.com/account/tokens');
}
