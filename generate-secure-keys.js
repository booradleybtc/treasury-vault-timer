#!/usr/bin/env node

/**
 * Generate secure keys for production deployment
 * Run this script to generate secure admin keys and webhook secrets
 */

import crypto from 'crypto';

console.log('🔐 Generating Secure Keys for Production');
console.log('==========================================\n');

// Generate Admin Key (32 characters)
const adminKey = crypto.randomBytes(16).toString('hex');
console.log('Admin Key (for admin panel access):');
console.log(`ADMIN_KEY=${adminKey}\n`);

// Generate Webhook Secret (32 characters)
const webhookSecret = crypto.randomBytes(16).toString('hex');
console.log('Webhook Secret (for Helius webhook validation):');
console.log(`WEBHOOK_SECRET=${webhookSecret}\n`);

// Generate JWT Secret (64 characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT Secret (for future authentication):');
console.log(`JWT_SECRET=${jwtSecret}\n`);

console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('1. Copy these values to your Render environment variables');
console.log('2. Copy these values to your Vercel environment variables');
console.log('3. NEVER commit these values to version control');
console.log('4. Store these values securely (password manager)');
console.log('5. Regenerate if compromised\n');

console.log('📋 Environment Variables to Set:');
console.log('Render Backend:');
console.log(`  ADMIN_KEY=${adminKey}`);
console.log(`  WEBHOOK_SECRET=${webhookSecret}`);
console.log(`  JWT_SECRET=${jwtSecret}\n`);

console.log('Vercel Frontend:');
console.log('  NEXT_PUBLIC_BACKEND_URL=https://treasury-vault-timer-backend.onrender.com\n');

console.log('✅ Keys generated successfully!');
console.log('Next: Update your deployment environment variables with these values.');
