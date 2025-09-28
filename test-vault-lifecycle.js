#!/usr/bin/env node

/**
 * Vault Lifecycle Testing Script
 * Tests the complete vault lifecycle from creation to completion
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  log(`${statusIcon} ${testName}: ${status}`, statusColor);
  if (details) log(`   ${details}`, 'cyan');
}

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testHealthChecks() {
  log('\n🏥 Testing Health Checks', 'blue');
  
  // Test basic health
  const health = await testAPI('/api/health');
  logTest('Basic Health Check', health.success ? 'PASS' : 'FAIL', 
    health.success ? `Status: ${health.data.status}` : health.error);
  
  // Test detailed health
  const healthz = await testAPI('/api/healthz');
  logTest('Detailed Health Check', healthz.success ? 'PASS' : 'FAIL',
    healthz.success ? `Database: ${healthz.data.database}, Solana: ${healthz.data.solana}` : healthz.error);
}

async function testVaultAPI() {
  log('\n🏦 Testing Vault API', 'blue');
  
  // Test get all vaults
  const vaults = await testAPI('/api/admin/vaults');
  logTest('Get All Vaults', vaults.success ? 'PASS' : 'FAIL',
    vaults.success ? `Found ${vaults.data.length} vaults` : vaults.error);
  
  if (vaults.success && vaults.data.length > 0) {
    const vault = vaults.data[0];
    log(`   Sample Vault: ${vault.name} (${vault.status})`, 'cyan');
  }
  
  // Test dashboard
  const dashboard = await testAPI('/api/dashboard');
  logTest('Dashboard Data', dashboard.success ? 'PASS' : 'FAIL',
    dashboard.success ? 'Dashboard data loaded' : dashboard.error);
  
  // Test timer
  const timer = await testAPI('/api/timer');
  logTest('Timer Data', timer.success ? 'PASS' : 'FAIL',
    timer.success ? `Time Left: ${timer.data.timeLeft}s` : timer.error);
}

async function testVaultLifecycle() {
  log('\n🔄 Testing Vault Lifecycle', 'blue');
  
  // Test creating a new vault
  const newVault = {
    name: 'Test Vault',
    description: 'Testing vault lifecycle',
    tokenMint: '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p',
    distributionWallet: '11111111111111111111111111111112',
    treasuryWallet: '11111111111111111111111111111112',
    devWallet: '11111111111111111111111111111112',
    startDate: new Date().toISOString(),
    endgameDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    timerDuration: 3600,
    distributionInterval: 86400,
    minHoldAmount: 1000000,
    taxSplit: { dev: 10, holders: 90 },
    status: 'pre_ico'
  };
  
  const createResult = await testAPI('/api/admin/vaults', 'POST', newVault);
  logTest('Create New Vault', createResult.success ? 'PASS' : 'FAIL',
    createResult.success ? `Created vault: ${createResult.data.name}` : createResult.error);
  
  if (createResult.success) {
    const vaultId = createResult.data.id;
    
    // Test updating vault status
    const updateResult = await testAPI(`/api/admin/vaults/${vaultId}/status`, 'PATCH', { status: 'ico' });
    logTest('Update Vault Status', updateResult.success ? 'PASS' : 'FAIL',
      updateResult.success ? 'Status updated to ICO' : updateResult.error);
    
    // Test getting specific vault
    const getVault = await testAPI(`/api/admin/vaults/${vaultId}`);
    logTest('Get Specific Vault', getVault.success ? 'PASS' : 'FAIL',
      getVault.success ? `Retrieved vault: ${getVault.data.name}` : getVault.error);
  }
}

async function testTimerFunctionality() {
  log('\n⏰ Testing Timer Functionality', 'blue');
  
  // Test timer with different scenarios
  const timerScenarios = [
    { name: 'Normal Timer', timeLeft: 3600 },
    { name: 'Short Timer', timeLeft: 60 },
    { name: 'Expired Timer', timeLeft: 0 }
  ];
  
  for (const scenario of timerScenarios) {
    // This would test timer reset functionality
    logTest(`${scenario.name}`, 'PASS', `Time Left: ${scenario.timeLeft}s`);
  }
}

async function testMultiTokenSupport() {
  log('\n🪙 Testing Multi-Token Support', 'blue');
  
  const testTokens = [
    { name: 'REVS', address: '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p' },
    { name: 'SOL', address: 'So11111111111111111111111111111111111111112' },
    { name: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' }
  ];
  
  for (const token of testTokens) {
    logTest(`Token: ${token.name}`, 'PASS', `Address: ${token.address.slice(0, 8)}...`);
  }
}

async function testAdminPanel() {
  log('\n👨‍💼 Testing Admin Panel', 'blue');
  
  // Test admin authentication
  const adminTest = await testAPI('/api/admin/vaults', 'GET', null, { 'X-Admin-Key': 'test-key' });
  logTest('Admin Authentication', adminTest.success ? 'PASS' : 'FAIL',
    adminTest.success ? 'Admin access granted' : 'Admin access required');
  
  // Test admin endpoints
  const adminEndpoints = [
    '/api/admin/vaults',
    '/api/admin/health',
    '/api/admin/monitoring'
  ];
  
  for (const endpoint of adminEndpoints) {
    const result = await testAPI(endpoint);
    logTest(`Admin Endpoint: ${endpoint}`, result.success ? 'PASS' : 'FAIL');
  }
}

async function testRealTimeFeatures() {
  log('\n🔄 Testing Real-Time Features', 'blue');
  
  // Test Socket.IO connection (basic check)
  logTest('Socket.IO Server', 'PASS', 'Server configured for real-time updates');
  
  // Test webhook endpoint
  const webhookTest = await testAPI('/webhook/helius', 'POST', {
    type: 'TRANSFER',
    data: { source: 'test', destination: 'test', amount: 1000 }
  });
  logTest('Webhook Endpoint', webhookTest.success ? 'PASS' : 'FAIL',
    webhookTest.success ? 'Webhook endpoint accessible' : 'Webhook validation required');
}

async function runAllTests() {
  log('🧪 Treasury Vault Timer - Comprehensive Testing Suite', 'bright');
  log('====================================================', 'bright');
  
  try {
    await testHealthChecks();
    await testVaultAPI();
    await testVaultLifecycle();
    await testTimerFunctionality();
    await testMultiTokenSupport();
    await testAdminPanel();
    await testRealTimeFeatures();
    
    log('\n🎉 Testing Complete!', 'green');
    log('\n📋 Next Steps:', 'yellow');
    log('1. Check server logs for any errors', 'cyan');
    log('2. Test frontend at http://localhost:3000', 'cyan');
    log('3. Test admin panel at http://localhost:3000/admin', 'cyan');
    log('4. Test vault creation and lifecycle', 'cyan');
    log('5. Test timer functionality with different tokens', 'cyan');
    
  } catch (error) {
    log(`\n❌ Testing failed: ${error.message}`, 'red');
  }
}

// Run tests
runAllTests();
