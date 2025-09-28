# 🧪 Vault Testing Dashboard

## 📊 **Current Vault States**

Based on the API response, we have **8 vaults** in various stages:

### **Active Vaults (1)**
- **REVS Treasury Vault** (`revs-vault-001`)
  - Status: `active` ✅
  - Token: REVS (9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p)
  - Timer Duration: 3600s (1 hour)
  - **READY FOR TIMER TESTING** 🎯

### **ICO Phase (1)**
- **evolve** (`evolve-1758851289082`)
  - Status: `ico` 🔵
  - ICO Asset: USDT (Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB)
  - Timer Duration: 180s (3 minutes)
  - **READY FOR ICO TESTING** 🎯

### **Pre-ICO Scheduled (1)**
- **max leverage** (`max-leverage-1758848894853`)
  - Status: `pre_ico_scheduled` 🟡
  - ICO Date: 2025-09-27T01:07:00.000Z
  - **READY FOR SCHEDULED ICO TESTING** 🎯

### **Pre-ICO (5)**
- **preview** (`preview-1758832450029`)
- **powell's reserve** (`powell-s-reserve-1758832127277`)
- **vault on** (`vault-one-1758831738097`)
- **boo** (`boo-1758831120173`)
- **boomer** (`boomer-1758767414338`)

---

## 🎯 **Testing Priority Order**

### **1. TIMER FUNCTIONALITY TESTING** (Highest Priority)
**Target**: REVS Treasury Vault (`revs-vault-001`)

#### **Test Scenarios:**
- [ ] **Timer Countdown**: Verify timer counts down from 3600s
- [ ] **Timer Reset**: Test timer reset on token purchase
- [ ] **Real-time Updates**: Check Socket.IO updates
- [ ] **Timer Expiration**: Test what happens when timer reaches 0
- [ ] **Multiple Tokens**: Test with different token addresses

#### **Test Commands:**
```bash
# Test timer API
curl http://localhost:3001/api/timer

# Test dashboard data
curl http://localhost:3001/api/dashboard

# Test Socket.IO connection
# Open browser console and check for WebSocket connection
```

### **2. ICO PHASE TESTING**
**Target**: evolve vault (`evolve-1758851289082`)

#### **Test Scenarios:**
- [ ] **Treasury Monitoring**: Check USDT balance monitoring
- [ ] **Threshold Detection**: Test $1000 threshold detection
- [ ] **Status Transition**: Test ICO → pending transition
- [ ] **Timer Functionality**: Test 180s timer during ICO

#### **Test Commands:**
```bash
# Test treasury balance
curl http://localhost:3001/api/admin/vaults/evolve-1758851289082/treasury-balance

# Test ICO status
curl http://localhost:3001/api/admin/vaults/evolve-1758851289082
```

### **3. VAULT LIFECYCLE TESTING**
**Target**: All vaults in sequence

#### **Test Scenarios:**
- [ ] **Pre-ICO → ICO**: Test automatic transition
- [ ] **ICO → Pending**: Test threshold met transition
- [ ] **Pending → Prelaunch**: Test Stage 2 completion
- [ ] **Prelaunch → Active**: Test launch transition
- [ ] **Active → Winner**: Test timer expiration
- [ ] **Active → Endgame**: Test lifespan completion

---

## 🔧 **Testing Tools**

### **1. API Testing Script**
```bash
# Run comprehensive API tests
node test-vault-lifecycle.js
```

### **2. Manual Testing URLs**
- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Vault Page**: http://localhost:3000/vaults
- **Stage 2 Wizard**: http://localhost:3000/admin/stage2/{vaultId}

### **3. Database Inspection**
```bash
# Check vault statuses
curl http://localhost:3001/api/admin/vaults | jq '.[] | {name, status, tokenMint}'
```

---

## 🎮 **Interactive Testing**

### **1. Timer Testing (REVS Vault)**
1. Open http://localhost:3000/vaults
2. Find "REVS Treasury Vault"
3. Observe timer countdown
4. Test timer reset by making a purchase
5. Check real-time updates

### **2. ICO Testing (evolve Vault)**
1. Open http://localhost:3000/admin
2. Find "evolve" vault in ICO phase
3. Check treasury balance monitoring
4. Test threshold detection
5. Force ICO end for testing

### **3. Admin Panel Testing**
1. Open http://localhost:3000/admin
2. Test all admin functions
3. Create new vault
4. Test Stage 2 wizard
5. Test vault management

---

## 📈 **Success Criteria**

### **Timer Functionality**
- ✅ Timer counts down accurately
- ✅ Timer resets on valid purchases
- ✅ Real-time updates work
- ✅ Timer expiration handled correctly
- ✅ Multiple token support works

### **Vault Lifecycle**
- ✅ All status transitions work
- ✅ Automatic progression functions
- ✅ Admin controls work
- ✅ Treasury monitoring accurate
- ✅ Threshold detection works

### **Multi-Token Support**
- ✅ Different token addresses work
- ✅ Token metadata loads correctly
- ✅ Price monitoring functions
- ✅ Purchase detection works

---

## 🚀 **Next Steps**

1. **Start with Timer Testing** - Test REVS vault timer functionality
2. **Test ICO Phase** - Test evolve vault ICO monitoring
3. **Test Vault Lifecycle** - Test all status transitions
4. **Test Multi-Token** - Test with different token addresses
5. **Test Admin Panel** - Test all admin functionality
6. **Test Real-time Features** - Test Socket.IO and webhooks

**Ready to start testing! 🎯**
