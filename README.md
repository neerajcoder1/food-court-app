# 👤 Contributor

**Prince Dubey**
Role: **Vendor Dashboard Development**

---

# 🍱 CafeteriaToken — Vendor Dashboard

This is the central management portal for cafeteria vendors to process live orders, manage Kitchen Order Tickets (KOTs), and handle shop settings.

## 🚀 Getting Started

### 1. 🔑 Login Credentials

Use these default credentials to access the dashboard:

* **Vendor ID:** `vendor`
* **Password:** `vendor123`

### 2. 🔐 Administrative Overrides

For sensitive operations (like accessing restricted billing logs or shop overrides):

* **Master Password:** `admin123`

---

## 🛠 Features

### 📋 Live Order Queue

* **Order Lifecycle**: Move orders from **Pending** ⏳ -> **Preparing** 👨‍🍳 -> **Ready** ✅ -> **Collected** ☑.
* **Smart Notifications**: Marking an order as "Ready" automatically triggers a sound chime and a 3D celebration on the student's device.
* **Real-time Stats**: Track active, pending, and ready counts instantly in the top bar.

### 🧾 KOT & Billing

* **Kitchen Flow**: Dedicated view for kitchen staff to handle active preparation tickets.
* **Receipts**: Generate and preview customer bills and KOT prints.

---

## 🛠 For the Backend Developer

The dashboard logic is contained within `vendor-dashboard.html`.

### Key Persistence Keys:

* **Orders**: `cffms_orders` (Master object for all transactions).
* **Accounts**: `cffms_vendor_accounts` (Vendor login data).
* **Hidden Orders**: For student-local deletions, the vendor dashboard **ignores** the `cffms_hidden_orders` key to ensure every order is accounted for.

### Integration Notes:

* **WebSocket/Push**: The current dashboard "listens" to `localStorage` changes. For your real backend, implement a **WebSocket connection** to send/receive order status updates between the student and vendor in real-time.

---

## 🖥 Developer Tools

* **Deep Reset**: Open Console (F12) and type `resetSystem()` to wipe all test orders and start fresh.

---

### 🎨 Design

* **Responsive Navigation**: Sidebar is optimized for tablets and mobile devices with a smart toggle and tap-to-close overlay.
* **Theme**: Premium Dark/Light mode support.
