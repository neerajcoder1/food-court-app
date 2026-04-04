// ── FIREBASE (orders realtime) ──
const firebaseConfig = {
  apiKey: "AIzaSyBUpMBnUXZIRD-fjg7RT8CIJ1wMylxwS80",
  authDomain: "food-court-app-ae48f.firebaseapp.com",
  projectId: "food-court-app-ae48f",
  storageBucket: "food-court-app-ae48f.firebasestorage.app",
  messagingSenderId: "575018100354",
  appId: "1:575018100354:web:e2bbbfd644748e7077769b",
};

let db = null;
let auth = null;
if (typeof firebase !== "undefined") {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  if (typeof firebase.auth === "function") {
    auth = firebase.auth();
  }
  window.db = db;
  window.auth = auth;
}

// --- State Management ---
let cart = [];
let menuItems = [];
let menuItemsByCategory = {};
let currentCategory = "all";
let currentSearchQuery = "";
let currentTypeFilter = "all";
let trackingPollTimer = null;
let trackingStorageHandler = null;
let activeTrackedOrderId = null;
let menuUnsubscribe = null;
let orderTrackingUnsubscribe = null;
let historyUnsubscribe = null;

// --- Config ---
const STORAGE_KEY = "cffms_menu";
const BASE_URL = "https://food-court-app-bvu9.onrender.com";
// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  initStorageListener();
  updateCartUI();
  initTheme();
  startOrderTracking(); // Check for active order tracking on load
  initCustomSelect(); // Init custom role selector
  applyViewFromQuery();
});

// --- User Accounts Management ---
const ACCOUNTS_KEY = "cffms_accounts";

function toAuthEmail(id, role) {
  const safeId = (id || "").toString().trim().toLowerCase();
  const safeRole = (role || "user").toString().trim().toLowerCase();
  return `${safeRole}.${safeId}@cffms.local`;
}

function checkAuth() {
  const user = JSON.parse(localStorage.getItem("cffms_user"));
  if (!user) {
    showView("login-view");
    document.getElementById("user-profile").style.display = "none";
    document.getElementById("cart-btn").style.display = "none";
  } else {
    document.getElementById("user-display").innerText =
      `${user.name} (${formatKey(user.role)})`;
    document.getElementById("user-profile").style.display = "flex";

    // Only show cart and history for roles that can order
    const canOrder = ["student", "teacher", "staff"].includes(user.role);
    document.getElementById("cart-btn").style.display = canOrder
      ? "flex"
      : "none";
    const histBtn = document.getElementById("history-btn");
    if (histBtn) histBtn.style.display = canOrder ? "flex" : "none";
    const trackingBtn = document.getElementById("tracking-btn");
    if (trackingBtn) trackingBtn.style.display = canOrder ? "flex" : "none";

    if (user.role === "vendor") {
      sessionStorage.setItem(
        "cffms_vendor",
        JSON.stringify({ id: user.id, name: user.name }),
      );
      localStorage.setItem("role", "vendor");
      window.location.replace("vendor-dashboard.html");
      return;
    }

    loadMenu();
    showView("menu-view");
  }
}

function handleLogin(e) {
  e.preventDefault();
  const id = document.getElementById("login-id").value;
  const role = document.getElementById("login-role").value;
  const pass = document.getElementById("login-password").value;

  if (!auth) {
    showToast("Firebase Auth is not configured.");
    return;
  }

  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
  const user = accounts.find(
    (acc) => acc.id === id && acc.role === role && acc.password === pass,
  );
  if (!user) {
    showToast("Invalid credentials or role. Please try again.");
    return;
  }

  const email = toAuthEmail(id, role);
  auth
    .signInWithEmailAndPassword(email, pass)
    .then(() => {
      if (role === "vendor") {
        // register vendor in separate storage so vendor portal recognizes them
        const vendAccounts =
          JSON.parse(localStorage.getItem("cffms_vendor_accounts")) || [];
        if (!vendAccounts.some((v) => v.id === id)) {
          vendAccounts.push({ id, password: pass, name: user.name });
          localStorage.setItem(
            "cffms_vendor_accounts",
            JSON.stringify(vendAccounts),
          );
        }
        // sign vendor in and redirect to vendor dashboard page
        sessionStorage.setItem(
          "cffms_vendor",
          JSON.stringify({ id: user.id, name: user.name }),
        );
        localStorage.setItem(
          "cffms_user",
          JSON.stringify({
            name: user.name,
            id: user.id,
            role: user.role,
          }),
        );
        localStorage.setItem("role", "vendor");
        window.location.replace("vendor-dashboard.html");
        return;
      }

      localStorage.setItem(
        "cffms_user",
        JSON.stringify({
          name: user.name,
          id: user.id,
          role: user.role,
        }),
      );
      showToast(`Welcome back, ${user.name}!`);
      checkAuth();
    })
    .catch(() => {
      showToast("Login failed. Please check your credentials.");
    });
}

function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById("signup-name").value;
  const role = document.getElementById("signup-role").value;
  const id = document.getElementById("signup-id").value;
  const password = document.getElementById("signup-password").value;

  if (!auth) {
    showToast("Firebase Auth is not configured.");
    return;
  }

  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];

  // Check if user already exists
  if (accounts.some((acc) => acc.id === id)) {
    showToast("User ID already exists. Please choose another.");
    return;
  }

  const email = toAuthEmail(id, role);

  const newUser = { name, role, id, password };
  auth
    .createUserWithEmailAndPassword(email, password)
    .then(() => {
      accounts.push(newUser);
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

      // also register vendor creds for vendor portal if role is vendor
      if (role === "vendor") {
        const vendAccounts =
          JSON.parse(localStorage.getItem("cffms_vendor_accounts")) || [];
        vendAccounts.push({ id, password, name });
        localStorage.setItem(
          "cffms_vendor_accounts",
          JSON.stringify(vendAccounts),
        );
      }

      auth.signOut().finally(() => {
        showToast("Account created successfully! Please login.");
        showView("login-view");

        // Reset form
        e.target.reset();
      });
    })
    .catch((err) => {
      if (err && err.code === "auth/email-already-in-use") {
        showToast("This account already exists. Please login.");
      } else {
        showToast("Signup failed. Please try again.");
      }
    });
}

function logout() {
  if (auth) {
    auth.signOut().catch(() => {});
  }
  const user = JSON.parse(localStorage.getItem("cffms_user"));
  if (user && user.role === "vendor") {
    sessionStorage.removeItem("cffms_vendor");
    localStorage.removeItem("role");
  }
  localStorage.removeItem("cffms_user");
  window.location.reload();
}

/**
 * DEVELOPER UTILITY
 * Run in console: resetSystem()
 * Purpose: Clears all local data (orders, hidden history, users) to start fresh.
 */
function resetSystem() {
  if (confirm("Are you sure? This will remove ALL orders and user data!")) {
    localStorage.clear();
    sessionStorage.clear();
    alert("System reset! Page will now reload.");
    window.location.reload();
  }
}

// called at startup to watch for menu changes in another tab (e.g. vendor updates)
function initStorageListener() {
  // Legacy fallback for non-Firebase mode.
  if (db && db.collection) return;

  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      // reload menu items if storage key changed
      loadMenu();
    }
  });
}

// Load Menu from LocalStorage
function loadMenu() {
  if (db && db.collection) {
    setupStudentMenuRealtime();
    return;
  }

  loadMenuFromLocalStorage();
}

function loadMenuFromLocalStorage() {
  const storedMenu = localStorage.getItem(STORAGE_KEY);
  const grid = document.getElementById("menu-grid");

  if (storedMenu) {
    const rawData = JSON.parse(storedMenu);

    // Handle both flat array and categorized object structure
    if (Array.isArray(rawData)) {
      menuItems = rawData;
      menuItemsByCategory = {
        all: rawData,
      };
    } else {
      // Flatten categorized object for internal logic, keep categories for UI
      menuItems = Object.values(rawData).flat();
      menuItemsByCategory = rawData;
      renderCategories(rawData);
    }
    applyFilters();
  } else {
    console.warn("No menu found in localStorage.");
    grid.innerHTML = `
            <div class="empty-msg">
                <p>Waiting for vendor to update menu...</p>
                <div class="demo-seed">
                    <p>Or initialize with demo data for testing:</p>
                    <button class="secondary-btn" onclick="seedDemoMenu()">Seed Demo Menu</button>
                </div>
            </div>
        `;
  }
}

function normalizeCategoryKey(value) {
  return (value || "menu")
    .toString()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .replace(/^./, (ch) => ch.toLowerCase());
}

function buildMenuCategories(items) {
  return items.reduce((acc, item) => {
    const key = normalizeCategoryKey(item.category || item.type || "menu");
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function setupStudentMenuRealtime() {
  if (!db || !db.collection || menuUnsubscribe) return;

  menuUnsubscribe = db.collection("menu").onSnapshot(
    (snapshot) => {
      menuItems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      menuItemsByCategory = buildMenuCategories(menuItems);
      renderCategories(menuItemsByCategory);
      applyFilters();
    },
    (err) => {
      console.error("Menu realtime listener failed, using fallback:", err);
      menuUnsubscribe = null;
      loadMenuFromLocalStorage();
    },
  );
}

function seedDemoMenu() {
  const demoData = {
    breakfast: [
      {
        id: "bf1",
        name: "Aloo Paratha",
        emoji: "🫓",
        desc: "Stuffed flatbread",
        price: 50,
        available: true,
        type: "veg",
      },
      {
        id: "bf2",
        name: "Chole Bhature",
        emoji: "🍛",
        desc: "Spicy chickpeas with bread",
        price: 50,
        available: true,
        type: "veg",
      },
      {
        id: "bf6",
        name: "Idli (3) + Vada (1)",
        emoji: "🍘",
        desc: "Breakfast combo",
        price: 45,
        available: true,
        type: "veg",
      },
    ],
    morningSnacks: [
      {
        id: "ms1",
        name: "Samosa (2 pcs)",
        emoji: "🥟",
        desc: "",
        price: 30,
        available: true,
        type: "veg",
      },
      {
        id: "ms2",
        name: "Veg Puff",
        emoji: "🥐",
        desc: "",
        price: 25,
        available: true,
        type: "veg",
      },
    ],
    lunch: [
      {
        id: "l1",
        name: "Veg Meals",
        emoji: "🍱",
        desc: "Full veg thali",
        price: 70,
        available: true,
        type: "veg",
      },
      {
        id: "l3",
        name: "Chicken Meals",
        emoji: "🍱",
        desc: "Full chicken thali",
        price: 120,
        available: true,
        type: "non-veg",
      },
    ],
    snacksSides: [
      {
        id: "ss1",
        name: "Gobi Manchurian",
        emoji: "🍲",
        desc: "",
        price: 60,
        available: true,
        type: "veg",
      },
    ],
    eveningSnacks: [
      {
        id: "es1",
        name: "Mirchi Bajji",
        emoji: "🌶",
        desc: "",
        price: 30,
        available: true,
        type: "veg",
      },
    ],
    dinner: [
      {
        id: "d1",
        name: "Phulka (3) with Dal",
        emoji: "🫓",
        desc: "",
        price: 60,
        available: true,
        type: "veg",
      },
    ],
    beverages: [
      {
        id: "b1",
        name: "Tea",
        emoji: "🍵",
        desc: "",
        price: 15,
        available: true,
        type: "veg",
      },
      {
        id: "b2",
        name: "Coffee",
        emoji: "☕",
        desc: "",
        price: 20,
        available: true,
        type: "veg",
      },
    ],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData));
  loadMenu();
  showToast("Demo menu seeded!");
}

// Render Category Tabs
function renderCategories(categories) {
  const header = document.querySelector("#menu-view .view-header");
  let catNav = document.getElementById("category-nav");

  if (!catNav) {
    catNav = document.createElement("div");
    catNav.id = "category-nav";
    catNav.className = "category-row";
    header.appendChild(catNav);
  }

  const keys = Object.keys(categories);
  catNav.innerHTML = `
        <button class="cat-btn active" data-category="all" onclick="filterMenu('all')">All</button>
        ${keys.map((key) => `<button class="cat-btn" data-category="${key}" onclick="filterMenu('${key}')">${formatKey(key)}</button>`).join("")}
    `;
}

function formatKey(key) {
  const emojis = {
    breakfast: "🥞",
    morningSnacks: "🥯",
    lunch: "🍱",
    snacksSides: "🥘",
    eveningSnacks: "🥪",
    dinner: "🍲",
    beverages: "🥤",
  };
  const emoji = emojis[key] || "";
  const label = key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
  return emoji ? `${emoji} ${label}` : label;
}

function filterMenu(category) {
  currentCategory = category;

  // Update active button
  document.querySelectorAll(".cat-btn").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.getAttribute("data-category") === category,
    );
  });

  applyFilters();
}

function handleSearch() {
  currentSearchQuery = document
    .getElementById("menu-search")
    .value.toLowerCase();
  applyFilters();
}

function filterType(type) {
  currentTypeFilter = type;

  // Update diet toggle UI
  document.querySelectorAll(".diet-btn").forEach((btn) => {
    const isTarget =
      (type === "all" && btn.id === "btn-all") ||
      (type === "veg" && btn.id === "btn-veg") ||
      (type === "non-veg" && btn.id === "btn-non-veg");
    btn.classList.toggle("active", isTarget);
  });

  applyFilters();
}

function applyFilters() {
  let items = [];

  // 1. Category Filter
  if (currentCategory === "all") {
    items = menuItems.slice();
  } else {
    items = (menuItemsByCategory[currentCategory] || []).slice();
  }

  // 2. Search Filter
  if (currentSearchQuery) {
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(currentSearchQuery) ||
        (item.desc && item.desc.toLowerCase().includes(currentSearchQuery)),
    );
  }

  // 3. Dietary Filter
  if (currentTypeFilter !== "all") {
    // treat unspecified type as veg so demo data still filters
    items = items.filter((item) => (item.type || "veg") === currentTypeFilter);
  }

  renderMenu(items);
}

// --- Menu Rendering ---
function renderMenu(itemsToRender) {
  const grid = document.getElementById("menu-grid");
  if (itemsToRender.length === 0) {
    grid.innerHTML =
      '<p class="empty-msg">No items found matching your criteria.</p>';
    return;
  }

  grid.innerHTML = itemsToRender
    .map(
      (item) => `
        <div class="menu-card ${item.available === false ? "out-of-stock" : ""}" id="item-${item.id}">
            <div class="diet-indicator ${item.type || "veg"}"></div>
            <div class="card-info">
                <div class="item-header">
                    <span class="emoji">${item.emoji || "🍽️"}</span>
                    <h3>${item.name}</h3>
                </div>
                <p class="item-desc">${item.desc || ""}</p>
                <div class="price-tag">₹${item.price}</div>
                ${item.available === false ? '<div class="stock-status">Out of Stock</div>' : ""}
            </div>
            ${renderCardActions(item)}
        </div>
    `,
    )
    .join("");

  // Add staggered delay to cards

  // Add staggered delay to cards
  const cards = grid.querySelectorAll(".menu-card");
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.05}s`;
  });
}

function renderCardActions(item) {
  if (item.available === false) {
    return `<button class="primary-btn add-btn" disabled>Unavailable</button>`;
  }

  const cartItem = cart.find((c) => c.id === item.id);
  if (cartItem) {
    return `
      <div class="qty-selector">
        <button class="qty-btn-inline" onclick="updateQty('${item.id}', -1)">−</button>
        <span class="qty-val-inline">${cartItem.qty}</span>
        <button class="qty-btn-inline" onclick="updateQty('${item.id}', 1)">+</button>
      </div>
    `;
  }

  return `<button class="primary-btn add-btn" onclick="addToCart('${item.id}')">Add to Cart</button>`;
}

// --- Cart Logic ---
function addToCart(id) {
  // Find item either in flat list or by searching categories if needed
  // (menuItems is already flattened in loadMenu for categorized data)
  const item = menuItems.find((m) => m.id === id);
  if (!item) return;

  const existing = cart.find((c) => c.id === id);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...item, qty: 1 });
  }

  updateCartUI();
  showToast(`Added ${item.name} to cart`);
}

function updateQty(id, delta) {
  const item = cart.find((c) => c.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter((c) => c.id !== id);
    }
  }
  updateCartUI();
}

function updateCartUI() {
  const cartCount = document.getElementById("cart-count");
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCount.innerText = totalQty;
  document.getElementById("total-qty").innerText = totalQty;

  // Trigger animation
  cartCount.classList.remove("bump");
  void cartCount.offsetWidth; // trigger reflow
  cartCount.classList.add("bump");

  renderCartItems();
  calculateTotal();

  // Sync catalog UI
  applyFilters();
}

function renderCartItems() {
  const container = document.getElementById("cart-items");
  const emptyState = document.getElementById("cart-empty");
  const summary = document.getElementById("cart-summary");

  if (cart.length === 0) {
    container.innerHTML = "";
    emptyState.style.display = "block";
    summary.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  summary.style.display = "block";

  container.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
            <div class="item-details">
                <h4>${item.name}</h4>
                <p>₹${item.price} × ${item.qty}</p>
            </div>
            <div class="qty-controls">
                <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                <span class="qty-val">${item.qty}</span>
                <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
            </div>
        </div>
    `,
    )
    .join("");
}

function calculateTotal() {
  const grandTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  document.getElementById("grand-total").innerText = `₹${grandTotal}`;
  document.getElementById("checkout-total").innerText = `₹${grandTotal}`;
}

// --- View Navigation ---
function showView(viewId) {
  // Hide all views
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));

  // Preparation for specific views
  if (viewId === "checkout-view") {
    renderCheckoutList();
  }

  // Show target view
  const target = document.getElementById(viewId);
  target.classList.add("active");

  // Reset animation
  target.style.animation = "none";
  void target.offsetWidth; // trigger reflow
  target.style.animation = null;

  window.scrollTo(0, 0);
}

function applyViewFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  const role = params.get("role");

  if (view === "signup") {
    showView("signup-view");
    if (role) {
      const roleSelect = document.getElementById("signup-role");
      if (roleSelect) {
        roleSelect.value = role;
      }
    }
  }
}

// Attach cart btn event
document
  .getElementById("cart-btn")
  .addEventListener("click", () => showView("cart-view"));

function renderCheckoutList() {
  const container = document.getElementById("checkout-items");
  container.innerHTML = cart
    .map(
      (item) => `
        <div class="mini-item">
            <span>${item.name} (x${item.qty})</span>
            <span>₹${item.price * item.qty}</span>
        </div>
    `,
    )
    .join("");
}

// --- Order & Tokens ---
function openRazorModal() {
  const total = document.getElementById("checkout-total").innerText;
  document.getElementById("razor-total").innerText = total;
  document.getElementById("razorpay-modal").classList.add("open");
}

function closeRazorModal() {
  document.getElementById("razorpay-modal").classList.remove("open");
}

function selectRazorOpt(el) {
  document
    .querySelectorAll(".razor-opt")
    .forEach((opt) => opt.classList.remove("active"));
  el.classList.add("active");
}

async function processRazorPay() {
  confirmVendorQrPayment();
}

function confirmVendorQrPayment() {
  const totalText = document.getElementById("razor-total").innerText || "₹0";
  const total = Number(totalText.replace(/[^0-9.]/g, "")) || 0;
  if (!total) {
    showToast("Invalid total amount. Please try again.");
    return;
  }

  closeRazorModal();
  showToast("Payment marked as completed. Vendor will verify at counter.");
  handlePaymentSuccess(total);
}

function handlePaymentSuccess(total) {
  return createAndTrackOrder(total, "UPI");
}

function createAndTrackOrder(total, paymentMode) {
  if (!auth || !auth.currentUser) {
    showToast("Please sign in to place an order.");
    return Promise.reject(new Error("Authenticated Firebase user required"));
  }

  const user = JSON.parse(localStorage.getItem("cffms_user")) || {
    name: "Guest",
  };

  const order = {
    name: user.name,
    items: cart.map((i) => ({ ...i })),
    total,
    payment: paymentMode,
    userId: auth.currentUser.uid,
  };

  return saveOrderToStorage(order)
    .then((savedOrder) => {
      sessionStorage.setItem("lastOrderId", savedOrder.id);

      cart = [];
      updateCartUI();

      hydrateTokenView(savedOrder);
      updateTrackingExperience(savedOrder);

      showView("token-view");
      startOrderTracking(savedOrder.id);
    })
    .catch((err) => {
      console.error("Order creation failed:", err);
      showToast("Could not place order. Please try again.");
    });
}

function confirmOrder() {
  const isOnline =
    document.querySelector('input[name="payment"]:checked').value === "online";

  if (isOnline) {
    openRazorModal();
  } else {
    generateToken();
  }
}

function generateToken() {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  createAndTrackOrder(total, "Cash");
}

function getNextTokenNumber() {
  const counterRef = db.collection("meta").doc("tokenCounter");

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const data = snapshot.exists ? snapshot.data() : null;
    const current =
      data && Number.isInteger(data.nextToken) ? data.nextToken : 0;

    transaction.set(
      counterRef,
      {
        nextToken: current + 1,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return current;
  });
}

// helper to add order to Firebase (real-time vendor updates) - no localStorage
function saveOrderToStorage(order) {
  if (!db || !db.collection) {
    return Promise.reject(new Error("Firestore is not configured"));
  }

  return getNextTokenNumber().then((token) =>
    db
      .collection("orders")
      .add({
        items: order.items,
        total: order.total,
        status: "pending", // Initial status - will flow: pending → preparing → ready → completed
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        student: order.name,
        userId: order.userId,
        token,
        payment: order.payment,
      })
      .then((docRef) => ({
        ...order,
        id: docRef.id,
        token,
        status: "pending",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
  );
}

function hydrateTokenView(order) {
  if (!order) return;

  const tokenEl = document.getElementById("token-number");
  if (tokenEl) tokenEl.innerText = `#${order.token}`;

  const tokenItems = document.getElementById("token-items");
  if (tokenItems) {
    tokenItems.innerHTML = (order.items || [])
      .map(
        (item) => `
        <div class="mini-item">
            <span>${item.name} (x${item.qty || 1})</span>
        </div>
    `,
      )
      .join("");
  }
}

function updateTrackingExperience(order) {
  if (!order) return;

  const status = order.status || "pending";
  const boy = document.getElementById("delivery-boy");
  const liveText = document.getElementById("tracking-live-text");
  const finishBtn = document.getElementById("token-finish-btn");

  const roadPos = {
    pending: 6,
    preparing: 44,
    ready: 78,
    completed: 95,
  };

  const messages = {
    pending: "Token generated. Boy is going to vendor road...",
    preparing: "Vendor accepted the order. Food is being prepared...",
    ready: "Food is ready for pickup at the counter!",
    completed: "Order completed by vendor. You can finish now.",
  };

  if (boy) {
    const leftPct = roadPos[status] ?? roadPos.pending;
    boy.style.left = `calc(${leftPct}% - 12px)`;
  }

  if (liveText) {
    liveText.innerText = messages[status] || messages.pending;
  }

  if (finishBtn) {
    const isCompleted = status === "completed";
    const isReady = status === "ready";

    finishBtn.style.display = isReady ? "none" : "block";
    finishBtn.disabled = !isCompleted;
    finishBtn.innerText = isCompleted
      ? "Finish & New Order"
      : "Waiting for Vendor Completion...";
  }
}

function startOrderTracking(forOrderId) {
  const orderId = forOrderId || sessionStorage.getItem("lastOrderId");
  if (!orderId) return;

  activeTrackedOrderId = orderId;

  if (trackingPollTimer) {
    clearInterval(trackingPollTimer);
    trackingPollTimer = null;
  }

  if (trackingStorageHandler) {
    window.removeEventListener("storage", trackingStorageHandler);
    trackingStorageHandler = null;
  }

  if (orderTrackingUnsubscribe) {
    orderTrackingUnsubscribe();
    orderTrackingUnsubscribe = null;
  }

  const updateTrackingUI = (order) => {
    if (!order) return;

    hydrateTokenView(order);
    updateTrackingExperience(order);

    const stepConfig = {
      pending: { steps: ["step-waiting"], width: "0%", color: "#f97316" },
      preparing: {
        steps: ["step-waiting", "step-preparing"],
        width: "50%",
        color: "#3b82f6",
      },
      ready: {
        steps: ["step-waiting", "step-preparing", "step-ready"],
        width: "100%",
        color: "#22c55e",
      },
      completed: {
        steps: ["step-waiting", "step-preparing", "step-ready"],
        width: "100%",
        color: "#22c55e",
      },
    };

    const config = stepConfig[order.status] || stepConfig.pending;

    // Update Dots and Labels
    document
      .querySelectorAll(".status-step")
      .forEach((s) => s.classList.remove("active"));
    config.steps.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.add("active");
    });

    // Update Progress Line
    const pLine = document.getElementById("progress-line");
    if (pLine) {
      pLine.style.width = config.width;
      pLine.style.background = config.color;
      pLine.style.boxShadow = `0 0 15px ${config.color}`;
    }

    if (order.status === "ready") {
      // Show Toast
      showToast("Your order is READY at the counter! 🍱 ✅");

      // Celebration Animation (Burst)
      const confetti = document.getElementById("confetti-container");
      if (confetti && !confetti.classList.contains("active")) {
        confetti.classList.add("active");
        setTimeout(() => confetti.classList.remove("active"), 3000);
      }

      // Play chime only once per order ready
      const chimeFlagKey = "chime_played_" + orderId;
      if (!sessionStorage.getItem(chimeFlagKey)) {
        playReadyChime();
        sessionStorage.setItem(chimeFlagKey, "1");
      }
    }
  };

  if (db && db.collection) {
    orderTrackingUnsubscribe = db
      .collection("orders")
      .doc(orderId)
      .onSnapshot((doc) => {
        if (activeTrackedOrderId !== orderId || !doc.exists) return;
        const data = doc.data();
        const order = {
          id: doc.id,
          ...data,
          time: data.createdAt
            ? data.createdAt.toDate().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
        };
        updateTrackingUI(order);
      });
    return;
  }

  const checkStatus = () => {
    // Ignore stale callbacks from previously tracked orders.
    if (activeTrackedOrderId !== orderId) return;

    const orders = JSON.parse(localStorage.getItem("cffms_orders")) || [];
    const order = orders.find((o) => o.id === orderId);

    if (order) updateTrackingUI(order);
  };

  checkStatus();

  trackingStorageHandler = (e) => {
    if (e.key === "cffms_orders") {
      checkStatus();
    }
  };

  // React immediately when vendor updates in another tab/window.
  window.addEventListener("storage", trackingStorageHandler);

  // Fallback polling keeps UI correct even when storage events are missed.
  trackingPollTimer = setInterval(checkStatus, 2000);
}

// --- UI Helpers ---
function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// Add Toast Styles dynamically
const style = document.createElement("style");
style.innerHTML = `
    .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary);
        color: var(--bg-dark);
        padding: 12px 24px;
        border-radius: 50px;
        font-weight: 600;
        z-index: 1000;
        box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        transition: opacity 0.5s ease;
    }
    .mini-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 0.95rem;
        color: var(--text-primary);
    }
    .mini-total {
        border-top: 1px solid var(--border);
        padding-top: 10px;
        margin-top: 10px;
        font-weight: 700;
        text-align: right;
    }
`;
document.head.appendChild(style);
// --- Theme Logic ---
function initTheme() {
  const savedTheme = localStorage.getItem("cffms_theme") || "dark";
  applyTheme(savedTheme);
}

function toggleTheme() {
  const isDark = !document.documentElement.classList.contains("light-mode");
  const newTheme = isDark ? "light" : "dark";
  applyTheme(newTheme);
  localStorage.setItem("cffms_theme", newTheme);
}

function applyTheme(theme) {
  const btn = document.getElementById("theme-toggle-btn");
  if (theme === "light") {
    document.documentElement.classList.add("light-mode");
    if (btn) btn.innerHTML = '<span class="icon">🌙</span> Dark Mode';
  } else {
    document.documentElement.classList.remove("light-mode");
    if (btn) btn.innerHTML = '<span class="icon">☀️</span> Light Mode';
  }
}

// --- Draggable Bar logic ---
function initDraggableBar() {
  const bar = document.querySelector(".moving-bar");
  let isDragging = false;
  let startY, startTop;

  if (bar) {
    function updateScrollFromBar() {
      const maxBarTop = window.innerHeight - bar.offsetHeight;
      const scrollPct = bar.offsetTop / maxBarTop;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, scrollPct * maxScroll);
    }

    function updateBarFromScroll() {
      if (isDragging) return;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const scrollPct = window.scrollY / maxScroll;
      const maxBarTop = window.innerHeight - bar.offsetHeight;
      bar.style.top = scrollPct * maxBarTop + "px";
    }

    bar.addEventListener("pointerdown", (e) => {
      isDragging = true;
      startY = e.clientY;
      startTop = bar.offsetTop;
      bar.setPointerCapture(e.pointerId);
    });

    window.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startY;
      let newTop = startTop + deltaY;

      const maxTop = window.innerHeight - bar.offsetHeight;
      if (newTop < 0) newTop = 0;
      if (newTop > maxTop) newTop = maxTop;

      bar.style.top = newTop + "px";
      updateScrollFromBar();
    });

    window.addEventListener("pointerup", () => {
      isDragging = false;
    });

    window.addEventListener("scroll", updateBarFromScroll);
    window.addEventListener("resize", updateBarFromScroll);

    updateBarFromScroll();
  }
}

initTheme();
initDraggableBar();

// --- Custom Role Selector Logic ---
function initCustomSelect() {
  const customSelect = document.getElementById("custom-role-select");
  if (!customSelect) return;

  const trigger = customSelect.querySelector(".select-trigger");
  const triggerText = trigger.querySelector("span");
  const optionsContainer = customSelect.querySelector(".custom-options");
  const options = customSelect.querySelectorAll(".custom-option");
  const hiddenInput = document.getElementById("login-role");
  const allowedRoles = ["student", "teacher", "staff", "vendor"];

  function selectRole(value) {
    const option = Array.from(options).find(
      (opt) => opt.getAttribute("data-value") === value,
    );
    if (!option) return;

    const text = option.innerText;
    triggerText.innerText = text;
    options.forEach((opt) => opt.classList.remove("selected"));
    option.classList.add("selected");
    hiddenInput.value = value;
    hiddenInput.dispatchEvent(new Event("change"));
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    customSelect.classList.toggle("open");
  });

  options.forEach((option) => {
    option.addEventListener("click", (e) => {
      e.stopPropagation();
      const value = option.getAttribute("data-value");
      selectRole(value);

      // Close dropdown
      customSelect.classList.remove("open");
    });
  });

  const roleParam = (
    new URLSearchParams(window.location.search).get("role") || ""
  )
    .trim()
    .toLowerCase();
  if (allowedRoles.includes(roleParam)) {
    selectRole(roleParam);
  }

  document.addEventListener("click", () => {
    customSelect.classList.remove("open");
  });
}

// =============================================
// ORDER HISTORY & SOUND NOTIFICATION
// =============================================
function playReadyChime() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.18 + 0.6,
      );
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.6);
    });
  } catch (e) {
    console.warn("Audio not supported:", e);
  }
}

function showHistory() {
  showView("history-view");
  renderOrderHistory();
}

function showTrackingStatus() {
  const orderId = sessionStorage.getItem("lastOrderId");
  if (!orderId) {
    showToast("No active order to track yet.");
    return;
  }

  showView("token-view");
  startOrderTracking(orderId);
}

function goBackFromTracking() {
  showView("menu-view");
}

function renderOrderHistory() {
  var user = JSON.parse(localStorage.getItem("cffms_user"));
  var hiddenOrders =
    JSON.parse(localStorage.getItem("cffms_hidden_orders")) || [];
  var container = document.getElementById("history-list");
  if (!container) return;

  if (!user) {
    container.innerHTML =
      '<div class="history-empty"><div class="empty-icon">📋</div><p>No orders yet. Place your first order!</p><button class="primary-btn" onclick="showView(\'menu-view\')" style="margin-top:1rem">Browse Menu</button></div>';
    return;
  }

  const renderCards = (allOrders) => {
    var myOrders = allOrders
      .filter(function (o) {
        return o.name === user.name && !hiddenOrders.includes(o.id);
      })
      .reverse();

    if (myOrders.length === 0) {
      container.innerHTML =
        '<div class="history-empty"><div class="empty-icon">📋</div><p>No orders yet. Place your first order!</p><button class="primary-btn" onclick="showView(\'menu-view\')" style="margin-top:1rem">Browse Menu</button></div>';
      return;
    }
    var labels = {
      pending: "Pending",
      preparing: "🔵 Preparing",
      ready: "✅ Ready",
      completed: "✅ Done",
    };
    container.innerHTML = myOrders
      .map(function (o) {
        var items = o.items
          .map(function (i) {
            return i.name + " x" + (i.qty || 1);
          })
          .join(", ");
        var lbl = labels[o.status] || "Pending";
        return (
          '<div class="history-card" id="hist-' +
          o.id +
          '">' +
          '<div class="history-card-header"><span class="history-token">#' +
          o.token +
          "</span>" +
          '<div style="display:flex; align-items:center">' +
          '<div style="text-align:right"><span class="status-badge ' +
          (o.status || "pending") +
          '">' +
          lbl +
          "</span>" +
          '<div class="history-time">' +
          (o.time || "") +
          "</div></div>" +
          '<button class="delete-history-btn" onclick="removeFromHistory(\'' +
          o.id +
          '\')" title="Hide from History"><span class="icon">🗑️</span></button>' +
          "</div></div>" +
          '<div class="history-items">' +
          items +
          "</div>" +
          '<div class="history-footer"><span class="history-total">&#8377;' +
          o.total +
          "</span>" +
          '<span class="history-payment">&#128179; ' +
          (o.payment || "Cash") +
          "</span></div></div>"
        );
      })
      .join("");
  };

  if (db && db.collection) {
    if (historyUnsubscribe) {
      historyUnsubscribe();
      historyUnsubscribe = null;
    }

    const historyQuery =
      auth && auth.currentUser
        ? db.collection("orders").where("userId", "==", auth.currentUser.uid)
        : db.collection("orders").where("student", "==", user.name);

    historyUnsubscribe = historyQuery.onSnapshot((snapshot) => {
      const firebaseOrders = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            name: data.student,
            time: data.createdAt
              ? data.createdAt.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
          };
        })
        .sort((a, b) => {
          const aMs = a.createdAt ? a.createdAt.toMillis() : 0;
          const bMs = b.createdAt ? b.createdAt.toMillis() : 0;
          return bMs - aMs;
        });

      renderCards(firebaseOrders);
    });
    return;
  }

  var allOrders = JSON.parse(localStorage.getItem("cffms_orders")) || [];
  renderCards(allOrders);
}

function removeFromHistory(orderId) {
  const card = document.getElementById("hist-" + orderId);
  if (card) {
    card.classList.add("removing");
    setTimeout(function () {
      // Add to hidden list instead of deleting from master list
      let hiddenOrders =
        JSON.parse(localStorage.getItem("cffms_hidden_orders")) || [];
      if (!hiddenOrders.includes(orderId)) {
        hiddenOrders.push(orderId);
      }
      localStorage.setItem("cffms_hidden_orders", JSON.stringify(hiddenOrders));

      // Refresh UI (removes from student view only)
      renderOrderHistory();
    }, 500);
  }
}
