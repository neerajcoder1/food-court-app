// Simple vendor login logic for vendor-login.html

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorMsg = document.getElementById("errorMsg");
  const errorText = document.getElementById("errorText");

  // seed default vendor account if none
  const ACCOUNTS_KEY = "cffms_vendor_accounts";
  const USER_ACCOUNTS_KEY = "cffms_accounts";
  function getAccounts() {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
  }
  function getUserAccounts() {
    return JSON.parse(localStorage.getItem(USER_ACCOUNTS_KEY)) || [];
  }
  function isVendorInUserAccounts(vendorId) {
    const userAccounts = getUserAccounts();
    return userAccounts.some(
      (account) => account.id === vendorId && account.role === "vendor",
    );
  }

  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "food-court-app-ae48f.firebaseapp.com",
    projectId: "food-court-app-ae48f",
    storageBucket: "food-court-app-ae48f.appspot.com",
    messagingSenderId: "575018100354",
    appId: "YOUR_APP_ID",
  };

  let auth = null;
  if (typeof firebase !== "undefined") {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    if (typeof firebase.auth === "function") {
      auth = firebase.auth();
    }
  }

  function vendorAuthEmail(vendorId) {
    return `vendor.${(vendorId || "").toString().trim().toLowerCase()}@cffms.local`;
  }
  function seedDefault() {
    const accs = getAccounts();
    if (accs.length === 0) {
      accs.push({
        id: "vendor",
        password: "vendor123",
        name: "Default Vendor",
      });
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accs));
    }

    const userAccounts = getUserAccounts();
    if (!userAccounts.some((account) => account.id === "vendor")) {
      userAccounts.push({
        id: "vendor",
        password: "vendor123",
        role: "vendor",
        name: "Default Vendor",
      });
      localStorage.setItem(USER_ACCOUNTS_KEY, JSON.stringify(userAccounts));
    }
  }
  seedDefault();

  const activeUser = JSON.parse(localStorage.getItem("cffms_user"));
  const activeVendor = JSON.parse(sessionStorage.getItem("cffms_vendor"));
  const hasValidVendorSession =
    (activeUser && activeUser.role === "vendor" && activeUser.id) ||
    (activeVendor &&
      activeVendor.id &&
      isVendorInUserAccounts(activeVendor.id));

  if (hasValidVendorSession) {
    window.location.replace("vendor-dashboard.html");
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("vendorId").value.trim();
    const pwd = document.getElementById("password").value;

    if (!auth) {
      errorText.textContent = "Firebase Authentication is not configured.";
      errorMsg.classList.add("show");
      return;
    }

    const accs = getAccounts();
    const user = accs.find((a) => a.id === id && a.password === pwd);
    const isVendorRole = isVendorInUserAccounts(id);

    if (!(user && isVendorRole)) {
      errorText.textContent = "Invalid Vendor ID or Password.";
      errorMsg.classList.add("show");
      return;
    }

    auth
      .signInWithEmailAndPassword(vendorAuthEmail(id), pwd)
      .then(() => {
        sessionStorage.setItem(
          "cffms_vendor",
          JSON.stringify({ id: user.id, name: user.name }),
        );
        localStorage.setItem(
          "cffms_user",
          JSON.stringify({ id: user.id, name: user.name, role: "vendor" }),
        );
        localStorage.setItem("role", "vendor");
        // navigate to dashboard in the same folder
        window.location.href = "vendor-dashboard.html";
      })
      .catch(() => {
        errorText.textContent =
          "Firebase login failed. Please verify credentials.";
        errorMsg.classList.add("show");
      });
  });
});
