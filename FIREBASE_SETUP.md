# Firebase Setup Guide

## Quick Start

### Step 1: Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Add project"
3. Name: `food-court-app`
4. Enable Google Analytics (optional)
5. Click "Create project"

```
Project details will appear - copy the config
```

### Step 2: Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Choose **Start in test mode** (for development)
4. Select region (closest to your location)
5. Click **Enable**

### Step 3: Create Collections

In Firestore console:

#### Collection 1: `menu`

```
Collection ID: menu
Add document (Auto ID):
{
  "name": "Veg Biryani",
  "price": 70,
  "category": "lunch",
  "type": "veg",
  "available": true,
  "emoji": "🍛",
  "desc": "Basmati rice with spices"
}
```

#### Collection 2: `orders`

```
Collection ID: orders
(Will auto-populate when student places order)
```

### Step 4: Update Firebase Config

In **app.js** and **vendor-dashboard.html**, update:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID",
};
```

Get these from Firebase Console → Project Settings → Your apps

### Step 5: Deploy Security Rules

#### Option A: Using Firebase CLI

```bash
# Install Firebase CLI (one time)
npm install -g firebase-tools

# Login
firebase login

# Initialize project
firebase init firestore

# Choose: "Use firestore.rules"

# Deploy
firebase deploy --only firestore:rules
```

#### Option B: Manual in Console

1. Firestore Console → Rules tab
2. Copy-paste from `firestore.rules` file
3. Click "Publish"

### Step 6: Test Connection

1. Open Browser DevTools (F12)
2. Go to Console tab
3. Type:

```javascript
db.collection("menu")
  .get()
  .then((snap) => console.log(snap.docs.length + " items"));
```

Should show your menu items count.

---

## Firestore Rules Explained

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // MENU: Anyone can read, but only authenticated users write
    match /menu/{document=**} {
      allow read: if true;  // Public read
      allow write: if request.auth != null;  // Auth required
    }

    // ORDERS: Anyone can read/create, but status updates restricted
    match /orders/{orderId} {
      allow read: if true;  // Anyone can check status

      // Only allow creation of new orders with pending status
      allow create: if request.resource.data.status == "pending"
                    && request.resource.data.createdAt != null
                    && request.resource.data.student != null;

      // Only allow status transitions through valid sequence
      allow update: if resource.data.status in ["pending", "preparing", "ready"]
                    && request.resource.data.status in ["pending", "preparing", "ready", "completed"];
    }
  }
}
```

**What this means:**

- ✅ Students can place orders (create with "pending" status)
- ✅ Vendors can update status (pending → preparing → ready → completed)
- ✅ Invalid status transitions are blocked
- ✅ Menu is read-only for students

---

## Production Checklist

### Before Going Live

1. **Security Rules**
   - [ ] Rules deployed to Firestore
   - [ ] Test mode disabled (switch to production)
   - [ ] Authentication required for vendor operations

2. **Data Validation**
   - [ ] Sample menu items added to `menu` collection
   - [ ] Test student order placed
   - [ ] Vendor status update works
   - [ ] Student sees real-time update

3. **Performance**
   - [ ] Firestore indexes created for `orders.createdAt`
   - [ ] Multi-device simultaneous testing passed
   - [ ] Load tested with 10+ concurrent users

4. **Configuration**
   - [ ] All firebaseConfig IDs correct
   - [ ] Razorpay payment IDs for production
   - [ ] CORS configured for your domain
   - [ ] No console errors on student/vendor pages

5. **Backup**
   - [ ] Firestore backups enabled (monthly)
   - [ ] Database export scheduled

---

## Common Issues & Fixes

### Issue: "Firestore is not configured"

**Fix:** Check firebaseConfig in app.js and vendor-dashboard.html

```javascript
if (typeof firebase === "undefined") {
  console.error("Firebase SDK not loaded!");
}
```

### Issue: Orders not appearing

**Fix:** Check if setupVendorOrdersRealtime() is called:

```javascript
// In vendor-dashboard.html DOMContentLoaded
setupVendorOrdersRealtime(); // Must be called
```

### Issue: "Permission denied" error

**Fix:** Update Firestore rules from test mode to production:

```
// In Firestore Rules tab:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Issue: Timestamps not working

**Fix:** Use serverTimestamp() not new Date():

```javascript
// ❌ Wrong
createdAt: new Date();

// ✅ Correct
createdAt: firebase.firestore.FieldValue.serverTimestamp();
```

---

## Monitoring

### Firebase Console Dashboard

1. **Firestore tab:**
   - Monitor real-time read/write counts
   - Check storage usage
   - View recent requests

2. **Reports:**
   - Track cost per operation
   - Monitor bandwidth

---

## Scaling Beyond Initial Setup

### Growth Path

```
0-100 users
├─ Test mode Firestore
├─ No authentication
└─ Works fine

100-1000 users
├─ Switch to production rules
├─ Add indexed queries
└─ Basic authentication

1000+ users
├─ Multi-region backup
├─ Firestore sharding for hot data
├─ Caching layer (Cloud CDN)
└─ Advanced analytics
```

---

## Cost Estimation

**Typical Usage (1000 students, 500 orders/day):**

| Operation       | Reads/Day | Writes/Day | Cost/Month |
| --------------- | --------- | ---------- | ---------- |
| Menu loads      | 50,000    | 10         | ~$0.50     |
| Order placement | 500       | 500        | ~$0.50     |
| Status updates  | 1,000     | 500        | ~$0.50     |
| Vendor queries  | 5,000     | 100        | ~$0.50     |
| **TOTAL**       | 56,500    | 1,110      | **~$2.00** |

_First 50K read/50K write per day free!_

---

## Firebase Dashboard URLs

```
Project Console:
https://console.firebase.google.com/project/your-project-id

Firestore Database:
https://console.firebase.google.com/project/your-project-id/firestore

Rules Editor:
https://console.firebase.google.com/project/your-project-id/firestore/rules
```

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Firestore Pricing](https://firebase.google.com/pricing)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

## Support

If you encounter issues:

1. Check [Firebase Status](https://status.firebase.google.com/)
2. Review error messages in DevTools Console (F12)
3. Verify Firestore Rules in console under "Rules" tab
4. Check that collections exist in Firestore

---

**Setup complete!** Your system is ready for real-time food ordering. 🎉
