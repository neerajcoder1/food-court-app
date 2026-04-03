# GCU Food Court - Deployment Checklist

## Phase 1: Firebase Setup (⏱️ 10 minutes)

### Step 1: Create Firebase Project

- [ ] Go to [console.firebase.google.com](https://console.firebase.google.com)
- [ ] Click "Add project"
- [ ] Name: `gcu-food-court` (or similar)
- [ ] Disable Google Analytics (optional for campus use)
- [ ] Click "Create project"
- [ ] Wait for project creation (2-3 minutes)

### Step 2: Enable Firestore

- [ ] In Firebase Console, go to "Firestore Database"
- [ ] Click "Create database"
- [ ] Region: Select closest to your campus
- [ ] Security rules: Select "Start in test mode"
- [ ] Click "Create"
- [ ] Wait for database initialization

### Step 3: Create Collections

**Create "menu" collection:**

- [ ] In Firestore, click "+ Start collection"
- [ ] Name: `menu`
- [ ] AutoID: Yes
- [ ] Add first document with sample:
  ```json
  {
    "name": "Paneer Tikka",
    "price": 80,
    "category": "Veg",
    "type": "Main Course",
    "available": true,
    "emoji": "🍲",
    "desc": "Indian cottage cheese tikka"
  }
  ```

**Create "orders" collection:**

- [ ] Click "+ Start collection"
- [ ] Name: `orders`
- [ ] Skip first document (students will create)
- [ ] Click "Create"

### Step 4: Get Firebase Config

- [ ] In Firebase Console, go to "Project settings" (⚙️)
- [ ] Scroll to "Your apps" → Web app (</> icon)
- [ ] If not created, click "Add app"
- [ ] Copy the config object:
  ```javascript
  const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "...",
  };
  ```

---

## Phase 2: Update Application Code (⏱️ 5 minutes)

### Step 1: Update Student App (app.js)

- [ ] Open `public/app.js`
- [ ] Find lines 1-18 (Firebase config section)
- [ ] Replace `firebaseConfig` object with your config from Step 1.4
- [ ] Save file

### Step 2: Update Vendor Dashboard (vendor-dashboard.html)

- [ ] Open `public/vendor-dashboard.html`
- [ ] Find Firebase config (around line 2623-2640)
- [ ] Replace `firebaseConfig` with YOUR config
- [ ] Save file

### Step 3: Verify SDK Line

- [ ] Both files should have this line:
  ```javascript
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  ```

---

## Phase 3: Deploy Security Rules (⏱️ 5 minutes)

### Option A: Firebase CLI (Recommended)

**Install Firebase CLI:**

```bash
npm install -g firebase-tools
```

**Login to Firebase:**

```bash
firebase login
```

**Initialize Firebase in project folder:**

```bash
cd Food-Court-Application
firebase init firestore
# When prompted:
# - Firestore rules file: firestore.rules
# - Firestore index file: firestore.indexes.json
```

**Deploy rules:**

```bash
firebase deploy --only firestore:rules
```

**Verify deployment:**

- [ ] See green checkmark in terminal
- [ ] Go to Firebase Console → Firestore → Rules tab
- [ ] Confirm rules are deployed

### Option B: Manual (Firebase Console)

- [ ] Create new file in project root: `firestore.rules`
- [ ] Copy contents from `firestore.rules` file in this project
- [ ] Firebase Console → Firestore → Rules tab
- [ ] Replace existing rules with your file contents
- [ ] Click "Publish"

---

## Phase 4: Seed Initial Menu Data (⏱️ 5 minutes)

### Option A: Use Script

```bash
# If seed_menu.js is configured for Firebase
node public/seed_menu.js
```

### Option B: Manual Entry (Firebase Console)

**Add Sample Items:**

- [ ] Go to Firestore → menu collection
- [ ] Click "Add document"
- [ ] Add 5-10 items:

| Name           | Price | Category | Type  | Available |
| -------------- | ----- | -------- | ----- | --------- |
| Paneer Tikka   | 80    | Veg      | Main  | true      |
| Butter Chicken | 120   | Non-Veg  | Main  | true      |
| Biryani        | 100   | Non-Veg  | Main  | true      |
| Samosa         | 20    | Veg      | Snack | true      |
| Lassi          | 30    | Beverage | Drink | true      |

**Add to each:**

- emoji: "🍲" or "🍗" etc.
- desc: "Brief description"

---

## Phase 5: Payment Gateway Setup (⏱️ 10 minutes)

### Razorpay Configuration

- [ ] Sign up at [razorpay.com](https://razorpay.com)
- [ ] Go to Settings → API Keys
- [ ] Copy:
  - **Key ID**: Used in `handlePaymentSuccess()`
  - **Key Secret**: Used in payment/server.js
- [ ] In `public/app.js` line ~775, update:
  ```javascript
  const response = await fetch("payment/create-order", {
    method: "POST",
    body: JSON.stringify({
      amount: total * 100, // In paise
      receipt: `order_${Date.now()}`,
      notes: { student: order.name },
    }),
  });
  ```

### Payment Server Setup

- [ ] Update `payment/server.js` with Razorpay keys
- [ ] Test locally: `node payment/server.js`
- [ ] Deploy to Heroku/Vercel (optional, for production)

---

## Phase 6: Testing (⏱️ 20 minutes)

### Test 1: Multi-Device Menu Sync

- [ ] Device A: Open vendor dashboard
- [ ] Device B: Open student app
- [ ] Vendor adds item "Test Pizza"
- [ ] ✅ Student app shows "Test Pizza" instantly
- [ ] ✅ No page refresh needed

### Test 2: Real-Time Order Flow

- [ ] Student places order → Gets token (e.g., #4321)
- [ ] ✅ Token displayed in 2 seconds
- [ ] Vendor dashboard refreshes automatically
- [ ] ✅ Order appears in queue with correct items/total
- [ ] Vendor clicks "Start Preparing"
- [ ] ✅ Student app status changes to "🕐 Preparing"
- [ ] Vendor clicks "Ready for Pickup"
- [ ] ✅ Student sees "✅ Ready!"

### Test 3: Status Transitions

- [ ] Order flows through: pending → preparing → ready → completed
- [ ] ✅ All transitions work (no skips)
- [ ] ✅ Timestamps are accurate
- [ ] ✅ Student and vendor see same status

### Test 4: Simultaneous Users

- [ ] Device 1: Student A places order
- [ ] Device 2: Student B places order
- [ ] Device 3: Vendor sees both orders instantly
- [ ] ✅ No race conditions
- [ ] ✅ No missing orders

### Test 5: Payment Integration

- [ ] Click "Proceed to Payment"
- [ ] Select "UPI" or "Cash"
- [ ] Complete payment
- [ ] ✅ Order created in Firestore
- [ ] ✅ Token generated automatically
- [ ] ✅ Vendor sees order immediately

---

## Phase 7: Security Verification (⏱️ 10 minutes)

### Test Firestore Rules

**Test 1: Students Can Create Orders**

- [ ] Firestore → orders collection
- [ ] Try to add document manually
- [ ] Should succeed with: `status: "pending"`, `createdAt: timestamp`

**Test 2: Invalid Status Not Allowed**

- [ ] Try to create order with: `status: "completed"` (skip pending)
- [ ] ✅ Should fail (rules block it)

**Test 3: Menu is Public Read**

- [ ] Student app can read menu items
- [ ] ✅ Works without authentication

**Test 4: Vendors Can't Delete Orders**

- [ ] In Firestore, try to delete an order document
- [ ] ✅ Should succeed (rules allow) BUT block via UI

---

## Phase 8: Performance Checks (⏱️ 5 minutes)

### Firestore Monitoring

- [ ] Firebase Console → Firestore → Usage
- [ ] Check:
  - [ ] Read count (should be low for test, ~100-500/hour)
  - [ ] Write count (matches order operations)
  - [ ] Storage used (should be minimal, <1MB for test)

### Browser Console Checks

- [ ] Open Developer Tools (F12)
- [ ] Console tab: No red errors
- [ ] Network tab: Firestore requests completing in <1 second
- [ ] Performance: Page load <2 seconds

---

## Phase 9: Prepare for Launch (⏱️ 10 minutes)

### User Training

- [ ] Record short video showing:
  - How to log in (student & vendor)
  - How to place order (student)
  - How to manage menu (vendor)
  - How to update status (vendor)

### Create User Guides

- [ ] Student guide: "How to Order Food"
- [ ] Vendor guide: "Dashboard Operations"
- [ ] Admin guide: "Firebase Management"

### Setup Monitoring

- [ ] Firebase Console → Alerts (optional, for high usage)
- [ ] Email notifications for quota warnings
- [ ] Daily cost tracker

### Backup Strategy

- [ ] Enable automatic backups:
  ```bash
  firebase firestore backup --project=YOUR_PROJECT_ID
  ```
- [ ] Schedule weekly backups
- [ ] Test restore process

---

## Phase 10: Go Live! 🚀 (⏱️ 5 minutes)

### Final Checks

- [ ] All tests passed ✅
- [ ] Vendor trained and ready ✅
- [ ] Student guide published ✅
- [ ] Firestore rules deployed ✅
- [ ] Payment gateway working ✅

### Launch Day

- [ ] Switch from "Test Mode" to "Production Mode" (Firebase)
  - Console → Firestore → Rules → Activate
- [ ] Monitor first hour:
  - [ ] Check error rates (should be 0%)
  - [ ] Check response times (<2s)
  - [ ] Watch for unusual patterns
- [ ] Have support team on standby
- [ ] Share links with students & vendors

### Post-Launch (24 hours)

- [ ] Review feedback
- [ ] Check data quality in Firestore
- [ ] Verify all orders recorded correctly
- [ ] Monitor costs (should be <₹5 for test)

---

## Troubleshooting During Deployment

### Problem: "firebaseConfig is not defined"

**Solution:**

```javascript
// Check both files have:
const firebaseConfig = { ... };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
```

### Problem: "Orders not appearing in vendor dashboard"

**Solution:**

1. Check browser console (F12) for Firebase errors
2. Verify `setupVendorOrdersRealtime()` is called on page load
3. Check Firestore has at least one order document
4. Clear browser cache (Ctrl+Shift+Del)

### Problem: "Timestamp showing as weird format"

**Solution:**

```javascript
// Must convert Firestore timestamp:
const createdAt = doc.data().createdAt?.toDate() || new Date();
```

### Problem: "Can't write to Firestore"

**Solution:**

1. Check security rules are deployed
2. Download fresh rules from `firestore.rules` file
3. Re-deploy: `firebase deploy --only firestore:rules`

### Problem: "Button clicks not working"

**Solution:**

1. Check JavaScript console for syntax errors
2. Verify buttons have `id="name"` matching code
3. Verify Firebase is initialized BEFORE event listeners
4. Check button click handlers exist

---

## Cost Estimation

| Usage                          | Monthly Cost |
| ------------------------------ | ------------ |
| 100 students, 5 orders/day     | <₹1          |
| 500 students, 20 orders/day    | ₹2-3         |
| 1,000 students, 50 orders/day  | ₹5-8         |
| 5,000 students, 200 orders/day | ₹20-30       |

**First 50K read ops + 50K write ops are FREE daily!**

---

## Support & Resources

- 📖 [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) - Full technical documentation
- 📖 [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Detailed Firebase guide
- 📖 [PRODUCTION_README.md](PRODUCTION_README.md) - Executive overview
- 🔐 [firestore.rules](firestore.rules) - Security rules
- 🌐 [Firebase Docs](https://firebase.google.com/docs)
- 💬 [Firebase Community](https://firebase.google.com/community)

---

## Completion Status

When you've completed all phases above, your system is **production-ready** and can handle:

- ✅ Concurrent students on multiple devices
- ✅ Real-time menu updates
- ✅ Instant order notifications
- ✅ Live status tracking
- ✅ Secure, validated writes
- ✅ Automatic scaling to 10,000+ requests/day

**Estimated total setup time: 60-90 minutes**

Good luck with the launch! 🎉
