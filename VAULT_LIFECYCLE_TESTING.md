# Vault Lifecycle Testing Guide

## 🧪 **Complete Testing Suite for Vault Platform**

### **Overview**
This guide covers testing the complete vault lifecycle from creation to live operation, including all monitoring systems and edge cases.

---

## **1. Stage 1: Vault Creation Testing**

### **Test Cases:**
- [ ] Create vault with valid data
- [ ] Create vault with missing required fields
- [ ] Upload logo and banner images
- [ ] Set ICO date in the future
- [ ] Validate treasury wallet address format
- [ ] Test form validation and error handling

### **Expected Results:**
- Vault created with `pre_ico` status
- Images uploaded successfully
- Database entry created with all fields
- Admin dashboard shows new vault

---

## **2. Stage 2: ICO Monitoring Testing**

### **Treasury Wallet Testing:**
- [ ] **SOL Deposits**: Send SOL to treasury wallet
- [ ] **USDC Deposits**: Send USDC to treasury wallet  
- [ ] **USDT Deposits**: Send USDT to treasury wallet
- [ ] **BONK Deposits**: Send BONK to treasury wallet
- [ ] **Mixed Assets**: Send multiple token types
- [ ] **Price Updates**: Verify Jupiter API price fetching
- [ ] **Balance Calculation**: Check USD value calculations

### **Threshold Testing:**
- [ ] **Below Threshold**: Send $5,000 worth of assets
- [ ] **Above Threshold**: Send $15,000 worth of assets
- [ ] **Exact Threshold**: Send exactly $10,000 worth
- [ ] **Multiple Deposits**: Send in multiple transactions

### **Expected Results:**
- Treasury balance updates every 2 minutes
- USD values calculated correctly
- Threshold detection works at $10,000
- Status changes from `ico` → `pending` when threshold met

---

## **3. Stage 3: Stage 2 Wizard Testing**

### **Form Testing:**
- [ ] **Token Address**: Enter valid SPL token address
- [ ] **Distribution Wallet**: Enter valid wallet address
- [ ] **Vault Launch Date**: Set future launch date
- [ ] **Whitelist Addresses**: Add/remove addresses
- [ ] **Form Validation**: Test required field validation

### **Expected Results:**
- Vault status changes to `prelaunch`
- Whitelist addresses stored in database
- Launch date set for future activation
- Admin dashboard shows "Complete Stage 2" success

---

## **4. Stage 4: Prelaunch Testing**

### **Launch Date Testing:**
- [ ] **Future Date**: Set launch date 1 hour in future
- [ ] **Past Date**: Set launch date in the past
- [ ] **Current Time**: Set launch date to now
- [ ] **Automatic Activation**: Wait for launch time

### **Expected Results:**
- Vault stays in `prelaunch` until launch date
- Automatic status change to `active` at launch time
- Timer monitoring begins immediately
- Live vault page becomes accessible

---

## **5. Stage 5: Live Vault Testing**

### **Timer Monitoring:**
- [ ] **Token Purchases**: Buy vault token
- [ ] **Timer Reset**: Verify timer resets on purchase
- [ ] **Whitelist Exclusion**: Test whitelisted address exclusion
- [ ] **Price Updates**: Verify token price monitoring
- [ ] **Real-time Updates**: Check Socket.IO updates

### **Expected Results:**
- Timer resets on valid purchases
- Whitelisted addresses excluded from buys
- Real-time price and timer updates
- Dashboard shows live vault data

---

## **6. Edge Cases & Error Handling**

### **Timeout Testing:**
- [ ] **48-Hour Pending**: Let vault stay pending for 48+ hours
- [ ] **Auto-Refund**: Verify automatic refund marking
- [ ] **Manual Refund**: Process refund manually

### **Error Scenarios:**
- [ ] **Invalid Treasury Wallet**: Test with invalid address
- [ ] **API Failures**: Test with Jupiter API down
- [ ] **Database Errors**: Test database connection issues
- [ ] **Network Issues**: Test with poor connectivity

### **Expected Results:**
- Automatic timeout handling
- Graceful error handling
- Fallback mechanisms work
- System remains stable

---

## **7. Webhook Integration Testing**

### **Helius Webhook Testing:**
- [ ] **Transfer Detection**: Send assets to treasury wallet
- [ ] **Real-time Updates**: Verify immediate balance updates
- [ ] **Multiple Transfers**: Test multiple rapid transfers
- [ ] **Webhook Failures**: Test webhook endpoint failures

### **Expected Results:**
- Immediate balance updates via webhook
- No duplicate processing
- Fallback to periodic checks if webhook fails
- Real-time threshold detection

---

## **8. Admin Dashboard Testing**

### **Dashboard Features:**
- [ ] **Pending Vaults**: View vaults requiring Stage 2
- [ ] **Refund Required**: View vaults needing refunds
- [ ] **Treasury Balance**: Check balance for any vault
- [ ] **Status Updates**: Verify real-time status changes
- [ ] **Navigation**: Test all admin page navigation

### **Expected Results:**
- All sections display correctly
- Real-time updates work
- Navigation between pages smooth
- Data accuracy maintained

---

## **9. Performance Testing**

### **Load Testing:**
- [ ] **Multiple Vaults**: Create 10+ vaults simultaneously
- [ ] **High Frequency**: Rapid treasury balance updates
- [ ] **Concurrent Users**: Multiple admin users
- [ ] **Database Performance**: Large dataset handling

### **Expected Results:**
- System handles multiple vaults
- No performance degradation
- Database queries optimized
- Real-time updates remain fast

---

## **10. Production Deployment Testing**

### **Deployment Checklist:**
- [ ] **Environment Variables**: All env vars set correctly
- [ ] **Database Migration**: Schema updated properly
- [ ] **API Endpoints**: All endpoints accessible
- [ ] **Webhook Configuration**: Helius webhooks configured
- [ ] **Monitoring**: Logs and error tracking working

### **Expected Results:**
- All features work in production
- No environment-specific issues
- Monitoring and logging active
- System stable under load

---

## **🔧 Testing Tools & Commands**

### **Manual Testing:**
```bash
# Test treasury balance API
curl "https://treasury-vault-timer-backend.onrender.com/api/admin/vaults/{vaultId}/treasury-balance"

# Test pending vaults API
curl "https://treasury-vault-timer-backend.onrender.com/api/admin/vaults/pending"

# Test webhook endpoint
curl -X POST "https://treasury-vault-timer-backend.onrender.com/webhook/helius" \
  -H "Content-Type: application/json" \
  -d '{"type":"TRANSFER","data":{"source":"...","destination":"...","amount":1000}}'
```

### **Browser Testing:**
- Admin Dashboard: `https://treasury-vault-timer.vercel.app/admin`
- Stage 2 Wizard: `https://treasury-vault-timer.vercel.app/admin/stage2/{vaultId}`
- Refund Processing: `https://treasury-vault-timer.vercel.app/admin/refund/{vaultId}`

---

## **📊 Success Criteria**

### **Functional Requirements:**
- ✅ Complete vault lifecycle works end-to-end
- ✅ Treasury monitoring detects all asset types
- ✅ Threshold detection works accurately
- ✅ Automatic status transitions function
- ✅ Admin dashboard provides full control

### **Performance Requirements:**
- ✅ Real-time updates within 2 seconds
- ✅ System handles 50+ concurrent vaults
- ✅ API response times under 500ms
- ✅ 99.9% uptime during testing

### **Security Requirements:**
- ✅ Whitelist exclusion works correctly
- ✅ Admin authentication required
- ✅ Input validation prevents injection
- ✅ Error handling doesn't expose sensitive data

---

## **🚀 Ready for Production**

Once all test cases pass, the vault platform is ready for production deployment with:
- Complete lifecycle management
- Multi-asset treasury monitoring
- Real-time webhook integration
- Comprehensive admin controls
- Robust error handling

**Next Steps:**
1. Run through all test cases
2. Deploy to production
3. Configure Helius webhooks
4. Monitor system performance
5. Launch first vault! 🎉
