# Helius Webhook Setup Guide

## 🔗 **Real-time Treasury Monitoring with Helius Webhooks**

### **Overview**
This guide explains how to set up Helius webhooks for real-time treasury wallet monitoring, eliminating the need for periodic balance checks and providing instant threshold detection.

---

## **1. Helius Account Setup**

### **Prerequisites:**
- Helius account with API access
- Treasury vault timer backend deployed
- Webhook endpoint accessible from internet

### **Account Configuration:**
1. Sign up at [helius.xyz](https://helius.xyz)
2. Get your API key from dashboard
3. Verify account has webhook capabilities

---

## **2. Webhook Configuration**

### **Webhook Endpoint:**
```
POST https://treasury-vault-timer-backend.onrender.com/webhook/helius
```

### **Webhook Payload Structure:**
```json
{
  "type": "TRANSFER",
  "data": {
    "source": "sender_wallet_address",
    "destination": "treasury_wallet_address", 
    "amount": 1000000000,
    "token": "SOL",
    "signature": "transaction_signature",
    "slot": 123456789
  }
}
```

---

## **3. Helius Dashboard Setup**

### **Step 1: Create Webhook**
1. Login to Helius dashboard
2. Navigate to "Webhooks" section
3. Click "Create Webhook"

### **Step 2: Configure Webhook**
- **Name**: `Treasury Vault Monitoring`
- **URL**: `https://treasury-vault-timer-backend.onrender.com/webhook/helius`
- **Events**: Select `TRANSFER` events
- **Accounts**: Add all treasury wallet addresses
- **Method**: POST
- **Headers**: `Content-Type: application/json`

### **Step 3: Test Webhook**
- Send test transaction to treasury wallet
- Verify webhook receives data
- Check backend logs for processing

---

## **4. Treasury Wallet Registration**

### **Automatic Registration:**
The system automatically detects treasury wallets from vault configurations. No manual registration needed.

### **Manual Registration (if needed):**
```bash
# Add treasury wallet to webhook monitoring
curl -X POST "https://api.helius.xyz/v0/webhooks/{webhook_id}/accounts" \
  -H "Authorization: Bearer {api_key}" \
  -H "Content-Type: application/json" \
  -d '{"accounts": ["treasury_wallet_address"]}'
```

---

## **5. Webhook Security**

### **Authentication:**
```javascript
// Add to webhook endpoint
app.post('/webhook/helius', async (req, res) => {
  // Verify webhook signature (optional but recommended)
  const signature = req.headers['x-helius-signature'];
  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook...
});
```

### **Rate Limiting:**
```javascript
// Add rate limiting to prevent abuse
const rateLimit = require('express-rate-limit');

const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});

app.use('/webhook/helius', webhookLimiter);
```

---

## **6. Monitoring & Debugging**

### **Webhook Logs:**
```javascript
// Enhanced logging for webhook debugging
app.post('/webhook/helius', async (req, res) => {
  console.log('🔔 Webhook received:', {
    timestamp: new Date().toISOString(),
    type: req.body.type,
    data: req.body.data,
    headers: req.headers
  });
  
  // Process webhook...
});
```

### **Health Check Endpoint:**
```javascript
// Add health check for webhook monitoring
app.get('/webhook/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

---

## **7. Fallback Strategy**

### **Hybrid Monitoring:**
The system uses both webhooks and periodic checks:

1. **Primary**: Helius webhooks for real-time updates
2. **Fallback**: Periodic balance checks every 2 minutes
3. **Recovery**: Manual balance check via admin dashboard

### **Implementation:**
```javascript
// Webhook processing with fallback
app.post('/webhook/helius', async (req, res) => {
  try {
    await processWebhook(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    // Fallback to periodic check
    scheduleImmediateBalanceCheck(req.body.data.destination);
    res.status(500).json({ error: 'Processing failed' });
  }
});
```

---

## **8. Testing Webhook Integration**

### **Test Transaction:**
```bash
# Send test transaction to treasury wallet
solana transfer --from ~/.config/solana/id.json \
  --to TREASURY_WALLET_ADDRESS \
  --amount 0.1 \
  --url mainnet-beta
```

### **Verify Webhook:**
```bash
# Check webhook logs
curl "https://treasury-vault-timer-backend.onrender.com/webhook/health"

# Check vault balance
curl "https://treasury-vault-timer-backend.onrender.com/api/admin/vaults/{vaultId}/treasury-balance"
```

---

## **9. Production Deployment**

### **Environment Variables:**
```bash
# Add to production environment
HELIUS_API_KEY=your_helius_api_key
WEBHOOK_SECRET=your_webhook_secret
WEBHOOK_URL=https://treasury-vault-timer-backend.onrender.com/webhook/helius
```

### **Deployment Checklist:**
- [ ] Webhook endpoint deployed and accessible
- [ ] Helius webhook configured in dashboard
- [ ] Treasury wallets added to webhook monitoring
- [ ] Health check endpoint working
- [ ] Fallback monitoring active
- [ ] Logging and monitoring configured

---

## **10. Troubleshooting**

### **Common Issues:**

#### **Webhook Not Receiving Data:**
- Check webhook URL is accessible
- Verify treasury wallet addresses are correct
- Confirm webhook is enabled in Helius dashboard
- Check firewall/network restrictions

#### **Webhook Processing Errors:**
- Check backend logs for error details
- Verify webhook payload structure
- Test with manual balance check
- Check database connection

#### **Missing Transactions:**
- Verify webhook event types are correct
- Check if transaction meets webhook criteria
- Use fallback periodic checks
- Manual balance verification

### **Debug Commands:**
```bash
# Check webhook status
curl -X GET "https://api.helius.xyz/v0/webhooks/{webhook_id}" \
  -H "Authorization: Bearer {api_key}"

# Test webhook endpoint
curl -X POST "https://treasury-vault-timer-backend.onrender.com/webhook/helius" \
  -H "Content-Type: application/json" \
  -d '{"type":"TRANSFER","data":{"source":"test","destination":"test","amount":1000}}'

# Check vault status
curl "https://treasury-vault-timer-backend.onrender.com/api/admin/vaults"
```

---

## **🎯 Benefits of Webhook Integration**

### **Real-time Monitoring:**
- Instant threshold detection
- Immediate balance updates
- No polling delays
- Reduced API calls

### **Improved User Experience:**
- Faster status updates
- Real-time notifications
- Better admin dashboard
- Enhanced reliability

### **Cost Optimization:**
- Reduced RPC calls
- Lower API usage
- Efficient resource usage
- Better scalability

---

## **🚀 Ready for Production**

With Helius webhooks configured:
- ✅ Real-time treasury monitoring
- ✅ Instant threshold detection  
- ✅ Reduced API costs
- ✅ Improved reliability
- ✅ Better user experience

**Next Steps:**
1. Configure Helius webhook
2. Test with real transactions
3. Monitor webhook performance
4. Deploy to production
5. Launch vaults with real-time monitoring! 🎉
