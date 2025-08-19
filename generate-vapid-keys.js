#!/usr/bin/env node

import webpush from 'web-push';

console.log('🔑 Generating VAPID Keys...\n');

try {
  // Generate VAPID keys
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('✅ VAPID Keys Generated Successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Public Key (Frontend):');
  console.log(vapidKeys.publicKey);
  console.log('\n🔐 Private Key (Backend - Keep Secret!):');
  console.log(vapidKeys.privateKey);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📝 Next Steps:');
  console.log('1. Add the PUBLIC KEY to your Vercel environment variables:');
  console.log('   VITE_VAPID_PUBLIC_KEY = ' + vapidKeys.publicKey);
  console.log('\n2. Add the PRIVATE KEY to your Render backend environment variables:');
  console.log('   VAPID_PRIVATE_KEY = ' + vapidKeys.privateKey);
  console.log('\n3. Add your email to Render backend environment variables:');
  console.log('   VAPID_EMAIL = your-email@example.com');
  
} catch (error) {
  console.error('❌ Error generating VAPID keys:', error.message);
  console.log('\n📦 Installing web-push library...');
  console.log('Run: npm install web-push');
}
