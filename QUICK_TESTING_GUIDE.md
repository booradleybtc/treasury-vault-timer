# 🚀 Quick Testing Guide

## 🌐 **Access URLs**

### **Frontend (Next.js)**
- **Main App**: http://localhost:3000
- **Vaults Page**: http://localhost:3000/vaults
- **Admin Panel**: http://localhost:3000/admin

### **Backend (Express)**
- **API Health**: http://localhost:3001/api/health
- **Dashboard Data**: http://localhost:3001/api/dashboard
- **All Vaults**: http://localhost:3001/api/admin/vaults

---

## 🎯 **Testing Priority**

### **1. Admin Panel Testing** (Start Here)
**URL**: http://localhost:3000/admin

**What to Test:**
- [ ] **Vault Overview**: See all 8 vaults in different states
- [ ] **Create New Vault**: Test Stage 1 wizard
- [ ] **Vault Management**: Edit existing vaults
- [ ] **Status Transitions**: Test vault progression
- [ ] **Treasury Monitoring**: Check balance tracking

**Current Vaults to Test:**
- **REVS Treasury Vault** (active) - Test timer functionality
- **evolve** (ico) - Test ICO phase monitoring
- **max leverage** (pre_ico_scheduled) - Test scheduled ICO
- **5 Pre-ICO vaults** - Test vault creation

### **2. Vaults Page Testing**
**URL**: http://localhost:3000/vaults

**What to Test:**
- [ ] **Vault Cards**: Test different card variants
- [ ] **Timer Display**: Test timer countdown
- [ ] **Real-time Updates**: Test Socket.IO connections
- [ ] **Token Information**: Test price and market cap display
- [ ] **Purchase Widget**: Test Jupiter integration

### **3. Timer Functionality Testing**
**Target**: REVS Treasury Vault (active)

**What to Test:**
- [ ] **Timer Countdown**: Should count down from 3600s
- [ ] **Real-time Updates**: Timer should update every second
- [ ] **Timer Reset**: Test with token purchases
- [ ] **Different Durations**: Test with other vaults

---

## 🧪 **Testing Scenarios**

### **Scenario 1: Create New Vault**
1. Go to http://localhost:3000/admin
2. Click "Create New Vault" or "Launch Vault"
3. Fill out Stage 1 wizard:
   - Vault name and description
   - Treasury wallet address
   - ICO date (set to future)
   - Timer duration (test different values: 60s, 300s, 3600s)
   - Asset selection
4. Submit and verify vault creation

### **Scenario 2: Test Timer with Different Durations**
1. Create vaults with different timer durations:
   - **60 seconds** (1 minute) - Quick testing
   - **300 seconds** (5 minutes) - Medium testing
   - **3600 seconds** (1 hour) - Full testing
2. Test timer countdown and reset functionality
3. Test real-time updates

### **Scenario 3: Test Vault Lifecycle**
1. Create vault in `pre_ico` status
2. Wait for ICO date or manually transition to `ico`
3. Test ICO monitoring and threshold detection
4. Complete Stage 2 wizard
5. Test launch and active phase
6. Test timer functionality

### **Scenario 4: Test Multi-Token Support**
1. Create vaults with different tokens:
   - **SOL** (native)
   - **USDC** (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
   - **USDT** (Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB)
   - **Custom tokens**
2. Test price monitoring for each
3. Test purchase detection

---

## 🔧 **Current Issues Fixed**

✅ **LAMPORTS_PER_SOL Error**: Fixed import and usage
✅ **getVaultById Error**: Fixed function name to getVault
✅ **Server Running**: Both frontend and backend are running
✅ **Database Connected**: SQLite database is working
✅ **8 Vaults Loaded**: Ready for testing

---

## 📊 **Current Vault States**

| Vault Name | Status | Timer Duration | Token | Ready for Testing |
|------------|--------|----------------|-------|-------------------|
| REVS Treasury Vault | active | 3600s | REVS | ✅ Timer Testing |
| evolve | ico | 180s | USDT | ✅ ICO Testing |
| max leverage | pre_ico_scheduled | 60s | USDC | ✅ Scheduled ICO |
| preview | pre_ico | 3600s | USDT | ✅ Creation Testing |
| powell's reserve | pre_ico | 3600s | zBTC | ✅ Creation Testing |
| vault on | pre_ico | 3600s | ETH | ✅ Creation Testing |
| boo | pre_ico | 3600s | USDC | ✅ Creation Testing |
| boomer | pre_ico | 60s | BONK | ✅ Creation Testing |

---

## 🎮 **Quick Start Testing**

1. **Open Admin Panel**: http://localhost:3000/admin
2. **Check Vault Overview**: See all 8 vaults
3. **Test REVS Vault Timer**: Go to vaults page and watch timer
4. **Create New Vault**: Test Stage 1 wizard with different timer durations
5. **Test Real-time Updates**: Open multiple browser tabs to see updates

**Ready to test! 🚀**
