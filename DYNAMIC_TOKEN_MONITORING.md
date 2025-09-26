# Dynamic Token Monitoring System

## 🚀 **Automatic Token Monitoring for Multiple Vaults**

### **Problem Solved**
Previously, you had to manually:
- Add each new token to Helius webhook configuration
- Update environment variables on Render for each token
- Manually configure monitoring for each vault

**Now the system automatically:**
- ✅ Monitors any token when a vault goes live
- ✅ No manual webhook configuration needed
- ✅ No environment variable updates required
- ✅ Automatic whitelist exclusion
- ✅ Real-time timer resets on purchases

---

## **How It Works**

### **1. Automatic Monitoring Activation**
```
Vault Lifecycle:
Stage 1 → Pre-ICO → ICO → Pending → Prelaunch → Active
                                    ↓
                            Automatic Monitoring Starts
```

When a vault reaches `active` status:
1. **System automatically detects** the vault's `tokenMint` from Stage 2
2. **Starts monitoring** that specific token for purchases
3. **Creates monitoring state** with timer, whitelist, and purchase tracking
4. **No manual configuration** required

### **2. Dynamic Token Detection**
```javascript
// System automatically monitors each vault's unique token
const monitorState = {
  vaultId: 'revs-vault-001',
  tokenMint: 'ABC123...', // Unique token from Stage 2
  timerDuration: 3600,
  timeLeft: 3600,
  whitelistedAddresses: [...], // From Stage 2
  isActive: true
};
```

### **3. Real-time Purchase Detection**
- **Webhook Integration**: Helius webhooks detect token transfers
- **Automatic Filtering**: Only monitors tokens for active vaults
- **Whitelist Exclusion**: Whitelisted addresses don't reset timer
- **Timer Reset**: Valid purchases reset the countdown timer

---

## **System Architecture**

### **Backend Components**

#### **1. Vault Monitors Map**
```javascript
const vaultMonitors = new Map(); // vaultId -> monitoring state
```

#### **2. Monitoring Functions**
- `startVaultMonitoring(vault)` - Start monitoring a vault's token
- `monitorVaultToken(vaultId)` - Check for purchases every second
- `checkTokenPurchases(vaultId, monitorState)` - Parse transactions
- `stopVaultMonitoring(vaultId)` - Stop monitoring

#### **3. Webhook Processing**
```javascript
// Automatically handles any token for any active vault
for (const [vaultId, monitorState] of vaultMonitors) {
  if (monitorState.tokenMint === token && monitorState.isActive) {
    // Process purchase and reset timer
  }
}
```

### **Frontend Components**

#### **1. Admin Dashboard**
- **Active Monitoring Section**: Shows all currently monitored vaults
- **Real-time Status**: Timer countdown, last purchase, monitoring status
- **Manual Controls**: Start/stop monitoring, check status

#### **2. API Endpoints**
- `GET /api/admin/vaults/:id/monitoring-status` - Get monitoring status
- `POST /api/admin/vaults/:id/start-monitoring` - Start monitoring
- `POST /api/admin/vaults/:id/stop-monitoring` - Stop monitoring
- `GET /api/admin/vaults/monitoring-overview` - Get all monitoring status

---

## **Configuration Requirements**

### **Helius Webhook Setup**
**Single webhook configuration handles all tokens:**

```json
{
  "name": "Vault Token Monitoring",
  "url": "https://treasury-vault-timer-backend.onrender.com/webhook/helius",
  "events": ["TRANSFER"],
  "accounts": [], // Empty - system handles dynamically
  "method": "POST"
}
```

**No need to add individual token addresses!**

### **Environment Variables**
**No token-specific environment variables needed:**
```bash
# Only these are required
HELIUS_API_KEY=your_api_key
WEBHOOK_SECRET=your_secret
```

---

## **Monitoring Flow**

### **1. Vault Creation**
```
Admin creates vault → Stage 1 → Pre-ICO → ICO
```

### **2. ICO Completion**
```
ICO ends → Threshold check → Pending → Stage 2 setup
```

### **3. Stage 2 Setup**
```
Admin completes Stage 2 → Vault goes to Prelaunch
```

### **4. Automatic Launch**
```
Launch date reached → Vault becomes Active → Monitoring starts automatically
```

### **5. Real-time Monitoring**
```
Token purchase detected → Whitelist check → Timer reset (if valid)
```

---

## **Admin Dashboard Features**

### **Active Monitoring Section**
- **Real-time Status**: Shows all currently monitored vaults
- **Timer Display**: Live countdown for each vault
- **Purchase History**: Last purchase time and buyer
- **Manual Controls**: Start/stop monitoring, check status

### **Monitoring Status**
```
📡 Active Vault Monitoring (3 vaults)
├── revs-vault-001: Token ABC123... | Time: 45m 23s | Last: 2:30 PM
├── revs-vault-002: Token DEF456... | Time: 12m 45s | Last: 3:15 PM
└── revs-vault-003: Token GHI789... | Time: 1h 23m | Last: 1:45 PM
```

---

## **Benefits**

### **1. Zero Manual Configuration**
- ✅ No webhook updates needed
- ✅ No environment variable changes
- ✅ No manual token registration
- ✅ Automatic monitoring activation

### **2. Scalable Architecture**
- ✅ Supports unlimited vaults
- ✅ Each vault monitors its own token
- ✅ Independent timer management
- ✅ Isolated monitoring states

### **3. Real-time Performance**
- ✅ Instant purchase detection via webhooks
- ✅ Fallback to periodic checks
- ✅ Real-time timer updates
- ✅ Live admin dashboard

### **4. Robust Error Handling**
- ✅ Graceful webhook failures
- ✅ Automatic retry mechanisms
- ✅ Fallback monitoring strategies
- ✅ Comprehensive logging

---

## **Testing the System**

### **1. Create Test Vault**
```bash
# Create vault via admin dashboard
POST /api/admin/vaults
```

### **2. Complete Stage 2**
```bash
# Set token address and launch date
POST /api/admin/vaults/{id}/stage2
```

### **3. Wait for Launch**
```bash
# System automatically starts monitoring when launch date reached
```

### **4. Test Token Purchase**
```bash
# Buy vault token - timer should reset automatically
```

### **5. Verify Monitoring**
```bash
# Check admin dashboard for monitoring status
GET /api/admin/vaults/monitoring-overview
```

---

## **Troubleshooting**

### **Common Issues**

#### **Monitoring Not Starting**
- Check vault status is `active`
- Verify `tokenMint` is set in Stage 2
- Check backend logs for errors

#### **Timer Not Resetting**
- Verify token purchase is detected
- Check whitelist exclusion
- Confirm webhook is receiving data

#### **Webhook Not Working**
- Test webhook endpoint manually
- Check Helius webhook configuration
- Verify network connectivity

### **Debug Commands**
```bash
# Check monitoring status
curl "https://treasury-vault-timer-backend.onrender.com/api/admin/vaults/{vaultId}/monitoring-status"

# Get monitoring overview
curl "https://treasury-vault-timer-backend.onrender.com/api/admin/vaults/monitoring-overview"

# Test webhook
curl -X POST "https://treasury-vault-timer-backend.onrender.com/webhook/helius" \
  -H "Content-Type: application/json" \
  -d '{"type":"TRANSFER","data":{"source":"buyer","destination":"seller","amount":1000,"token":"TOKEN_MINT"}}'
```

---

## **Production Deployment**

### **Deployment Checklist**
- [ ] Backend deployed with dynamic monitoring
- [ ] Helius webhook configured (single webhook)
- [ ] Admin dashboard updated
- [ ] Monitoring API endpoints tested
- [ ] Webhook endpoint accessible
- [ ] Error handling verified

### **Monitoring Setup**
- [ ] Webhook receives all transfer events
- [ ] System processes vault-specific tokens
- [ ] Timer resets work correctly
- [ ] Whitelist exclusion functions
- [ ] Admin dashboard shows real-time data

---

## **🎯 Result**

**You can now:**
1. **Create unlimited vaults** without manual configuration
2. **Each vault automatically monitors** its unique token
3. **No webhook updates** needed for new tokens
4. **No environment variable changes** required
5. **Real-time monitoring** with instant timer resets
6. **Complete admin control** via dashboard

**The system is fully automated and scalable!** 🚀
