- Member 1 - **Neeraj Gahlout** [Student Dashboard ]
# 🎓 CafeteriaToken — Student & Staff Portal

Welcome to the premium frontend for the CFFMS Student Portal. This application is designed for students, teachers, and staff to order food seamlessly with a high-end, animated user experience.

## ✨ Premium Features

### 🍱 3D Interactive Order Tracking
- **Visual Progress**: Real-time tracking with 3D bubble icons (⌛, 👨‍🍳, 🍱).
- **Dynamic Styling**: The progress line and icons change color (Orange -> Blue -> Green) as the order moves through stages.
- **Celebration Burst**: A confetti particle explosion triggers when the order is marked "Ready."

### 📜 Intelligent Order History
- **Local Privacy**: Students can remove orders from their personal history view.
- **Data Integrity**: Deleting an order in the student view **does not** delete it from the Vendor Dashboard, ensuring operational records remain safe.
- **3D Interaction**: Satisfying slide-and-fade animations when removing items.

### 🔔 Smart Sound Notifications
- **Web Audio API**: Uses a custom-synthesized 3-note chime (C-E-G major) to notify when food is ready.
- **No External Assets**: Works entirely via code — no extra `.mp3` files required.
- **Anti-Repeat**: Logic ensures the sound plays exactly once per order state.

---

## 🛠 For the Backend Developer

This project currently uses `localStorage` for data persistence. To integrate your backend:

1. **Orders**: Replace `localStorage.getItem('cffms_orders')` with API calls.
2. **Live Updates**: In `app.js`, the `startOrderTracking()` function currently polls storage. For the best experience, replace this with **WebSockets (Socket.io)** or **Firebase Realtime** to "Push" status updates to the student.
3. **Hidden Orders**: Student-hidden history IDs are stored in `cffms_hidden_orders`.

## 🖥 Developer Tools
To reset the system to a completely fresh state (0 orders, 0 users) during development:
1. Open Browser Console (F12).
2. Type `resetSystem()` and press Enter.

---

## 🚀 How to Run
1. Open `index.html` in any modern web browser.
2. Log in using a Student, Teacher, or Staff account.
3. (Optional) Run `seed_menu.js` to populate the menu for testing.

---

### 🎨 Design Credits
- **UI/UX**: Modern Glassmorphism & 3D Design
- **Engineering**: VisionX Team
--

- Member 2- **Prince Dubey** [ Vendor Dashboard ]
# 🍱 CafeteriaToken — Vendor Dashboard

This is the central management portal for cafeteria vendors to process live orders, manage Kitchen Order Tickets (KOTs), and handle shop settings.

## 🚀 Getting Started

### 1. 🔑 Login Credentials
Use these default credentials to access the dashboard:
- **Vendor ID:** `vendor`
- **Password:** `vendor123`

### 2. 🔐 Administrative Overrides
For sensitive operations (like accessing restricted billing logs or shop overrides):
- **Master Password:** `admin123`

---

## 🛠 Features

### 📋 Live Order Queue
- **Order Lifecycle**: Move orders from **Pending** ⏳ -> **Preparing** 👨‍🍳 -> **Ready** ✅ -> **Collected** ☑.
- **Smart Notifications**: Marking an order as "Ready" automatically triggers a sound chime and a 3D celebration on the student's device.
- **Real-time Stats**: Track active, pending, and ready counts instantly in the top bar.

### 🧾 KOT & Billing
- **Kitchen Flow**: Dedicated view for kitchen staff to handle active preparation tickets.
- **Receipts**: Generate and preview customer bills and KOT prints.

---

## 🛠 For the Backend Developer

The dashboard logic is contained within `vendor-dashboard.html`. 

### Key Persistence Keys:
- **Orders**: `cffms_orders` (Master object for all transactions).
- **Accounts**: `cffms_vendor_accounts` (Vendor login data).
- **Hidden Orders**: For student-local deletions, the vendor dashboard **ignores** the `cffms_hidden_orders` key to ensure every order is accounted for.

### Integration Notes:
- **WebSocket/Push**: The current dashboard "listens" to `localStorage` changes. For your real backend, implement a **WebSocket connection** to send/receive order status updates between the student and vendor in real-time.

---

## 🖥 Developer Tools
- **Deep Reset**: Open Console (F12) and type `resetSystem()` to wipe all test orders and start fresh.

---

### 🎨 Design
- **Responsive Navigation**: Sidebar is optimized for tablets and mobile devices with a smart toggle and tap-to-close overlay.
- **Theme**: Premium Dark/Light mode support.

