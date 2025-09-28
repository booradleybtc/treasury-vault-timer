# 🔧 **Fix Deployment Connections - Render & Vercel**

## 🎯 **Problem Identified:**
Both **Render** and **Vercel** are not detecting new commits from your Git repository, even though the commits are there.

---

## 🛠️ **Solution 1: Fix Render Connection**

### **1. Check Render Service Settings:**
1. Go to: https://dashboard.render.com/
2. Find your `treasury-vault-timer-backend` service
3. Click on it to open settings

### **2. Verify Git Repository:**
1. Go to **Settings** tab
2. Check **Repository**: Should be `booradleybtc/treasury-vault-timer`
3. Check **Branch**: Should be `master`
4. Check **Root Directory**: Should be `server`

### **3. Force Manual Deploy:**
1. Go to **Deploys** tab
2. Click **"Manual Deploy"** button
3. Select **"Deploy latest commit"**
4. Wait 2-3 minutes for deployment

---

## 🛠️ **Solution 2: Fix Vercel Connection**

### **1. Check Vercel Project Settings:**
1. Go to: https://vercel.com/booradleybtcs-projects/frontend/settings/git
2. Verify **Repository**: `booradleybtc/treasury-vault-timer`
3. Verify **Branch**: `master`
4. Verify **Root Directory**: `frontend`

### **2. Check Build Settings:**
1. Go to: https://vercel.com/booradleybtcs-projects/frontend/settings/general
2. Verify **Build Command**: `npm run build`
3. Verify **Output Directory**: `.next`

### **3. Force Manual Deploy:**
1. Go to: https://vercel.com/booradleybtcs-projects/frontend/deployments
2. Click **"Redeploy"** on the current production deployment
3. Or click **"Deploy"** to trigger a new deployment

---

## 🛠️ **Solution 3: Reconnect Repositories**

### **If Above Doesn't Work - Reconnect Render:**
1. Go to: https://dashboard.render.com/
2. Find your `treasury-vault-timer-backend` service
3. Go to **Settings** → **Repository**
4. Click **"Disconnect"** then **"Connect"** again
5. Select `booradleybtc/treasury-vault-timer` repository
6. Set **Root Directory** to `server`
7. Set **Branch** to `master`

### **If Above Doesn't Work - Reconnect Vercel:**
1. Go to: https://vercel.com/booradleybtcs-projects/frontend/settings/git
2. Click **"Disconnect"** then **"Connect"** again
3. Select `booradleybtc/treasury-vault-timer` repository
4. Set **Root Directory** to `frontend`
5. Set **Branch** to `master`

---

## 🧪 **Test After Fixing Connections:**

### **✅ Backend (Render) - Should Work:**
```bash
curl -s https://treasury-vault-timer-backend.onrender.com/api/health
curl -s https://treasury-vault-timer-backend.onrender.com/api/admin/vaults
```

### **✅ Frontend (Vercel) - Should Work:**
```bash
curl -I https://frontend-aiuwqs319-booradleybtcs-projects.vercel.app/
curl -I https://frontend-aiuwqs319-booradleybtcs-projects.vercel.app/vault/powell-s-reserve-1758832127277
```

---

## 🎯 **Expected Results After Fix:**

### **✅ Backend:**
- No more `getVaultById` errors
- No more `LAMPORTS_PER_SOL` errors
- All API endpoints working

### **✅ Frontend:**
- No more 500 errors on vault pages
- Working admin panel buttons
- Error handling working properly
- User-friendly error messages

---

## 🚀 **Quick Commands to Force Deploy:**

### **Force Render Deploy:**
```bash
cd /Users/bradleysullivan/treasury-vault-timer
echo "// FORCE RENDER $(date)" >> server/index.js
git add . && git commit -m "FORCE RENDER DEPLOY" && git push origin master
```

### **Force Vercel Deploy:**
```bash
cd /Users/bradleysullivan/treasury-vault-timer/frontend
echo "// FORCE VERCEL $(date)" >> src/app/page.tsx
git add . && git commit -m "FORCE VERCEL DEPLOY" && git push origin master
```

---

## 🎉 **Success Indicators:**

### **✅ Render Working:**
- Health check returns 200
- Admin APIs responding
- No server errors in logs

### **✅ Vercel Working:**
- Vault pages load without 500 errors
- Admin panel buttons functional
- Error handling working

---

## 📞 **Next Steps:**

1. **Check Render Settings** - Verify repository connection
2. **Check Vercel Settings** - Verify repository connection
3. **Force Manual Deploy** - Trigger fresh deployments
4. **Test All URLs** - Verify everything works
5. **Report Results** - Let me know what works/doesn't work

**The code is correct - just need to fix the deployment connections! 🚀**
