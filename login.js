// Simple vendor login logic for vendor-login.html

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorMsg = document.getElementById("errorMsg");
  const errorText = document.getElementById("errorText");

  // seed default vendor account if none
  const ACCOUNTS_KEY = "cffms_vendor_accounts";
  function getAccounts() {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
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
  }
  seedDefault();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("vendorId").value.trim();
    const pwd = document.getElementById("password").value;
    const accs = getAccounts();
    const user = accs.find((a) => a.id === id && a.password === pwd);
    if (user) {
      sessionStorage.setItem(
        "cffms_vendor",
        JSON.stringify({ id: user.id, name: user.name }),
      );
      // navigate to dashboard
      window.location.replace("vendor-dashboard.html");
    } else {
      errorText.textContent = "Invalid Vendor ID or Password.";
      errorMsg.classList.add("show");
    }
  });
});
