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
