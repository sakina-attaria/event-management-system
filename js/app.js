/* ============================================
   APP.JS — Shared Functions (all pages use this)
   ============================================ */

/* ---------- Theme (Dark/Light Mode) ---------- */
function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.THEME) || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(STORAGE_KEYS.THEME, next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.querySelector(".theme-toggle");
  if (btn) btn.textContent = theme === "dark" ? "☀" : "☾";
}

/* ---------- Mobile Nav Toggle ---------- */
function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
  });
  links.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => links.classList.remove("open"));
  });
}

/* ---------- Toast Notifications ---------- */
function ensureToastContainer() {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = "success", duration = 3200) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ---------- Custom Modal System (replaces alert/confirm) ---------- */
function ensureModalRoot() {
  let overlay = document.getElementById("app-modal-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "app-modal-overlay";
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3 id="app-modal-title"></h3>
          <button class="modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body" id="app-modal-body"></div>
        <div class="modal-footer" id="app-modal-footer"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector(".modal-close").addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
  }
  return overlay;
}

function closeModal() {
  const overlay = document.getElementById("app-modal-overlay");
  if (overlay) overlay.classList.remove("active");
}

/* showModal({ title, bodyHTML, buttons: [{label, class, onClick}] }) */
function showModal({ title = "", bodyHTML = "", buttons = [] }) {
  const overlay = ensureModalRoot();
  overlay.querySelector("#app-modal-title").textContent = title;
  overlay.querySelector("#app-modal-body").innerHTML = bodyHTML;
  const footer = overlay.querySelector("#app-modal-footer");
  footer.innerHTML = "";
  buttons.forEach(btn => {
    const b = document.createElement("button");
    b.className = `btn ${btn.className || "btn-outline"}`;
    b.textContent = btn.label;
    b.addEventListener("click", () => {
      if (btn.onClick) btn.onClick();
      if (btn.closeOnClick !== false) closeModal();
    });
    footer.appendChild(b);
  });
  overlay.classList.add("active");
  return overlay;
}

/* Confirmation dialog replacement for confirm() */
function showConfirm(message, onConfirm, title = "Please confirm") {
  showModal({
    title,
    bodyHTML: `<p>${message}</p>`,
    buttons: [
      { label: "Cancel", className: "btn-outline" },
      { label: "Confirm", className: "btn-danger", onClick: onConfirm }
    ]
  });
}

/* Simple alert-style message replacement for alert() */
function showMessage(message, title = "Notice") {
  showModal({
    title,
    bodyHTML: `<p>${message}</p>`,
    buttons: [{ label: "OK", className: "btn-primary" }]
  });
}

/* ---------- Loading Overlay ---------- */
function showLoading() {
  let overlay = document.getElementById("app-loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "app-loading-overlay";
    overlay.className = "loading-overlay";
    overlay.innerHTML = `<div class="loading-box"><div class="spinner"></div><p>Loading...</p></div>`;
    document.body.appendChild(overlay);
  }
  overlay.classList.add("active");
}

function hideLoading() {
  const overlay = document.getElementById("app-loading-overlay");
  if (overlay) overlay.classList.remove("active");
}

/* ---------- Formatting Helpers ---------- */
function formatCurrency(amount) {
  return "Rs. " + Number(amount).toLocaleString("en-PK");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${period}`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ---------- Validation Helpers ---------- */
const Validate = {
  required(value) {
    return value !== null && value !== undefined && String(value).trim() !== "";
  },
  email(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  phone(value) {
    return /^[0-9+\-\s]{7,15}$/.test(value);
  },
  positiveNumber(value) {
    return !isNaN(value) && Number(value) > 0;
  },
  futureDate(value) {
    const inputDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
  }
};

function setFieldError(fieldEl, message) {
  const group = fieldEl.closest(".form-group");
  if (!group) return;
  group.classList.add("has-error");
  let errorEl = group.querySelector(".field-error");
  if (!errorEl) {
    errorEl = document.createElement("div");
    errorEl.className = "field-error";
    group.appendChild(errorEl);
  }
  errorEl.textContent = message;
}

function clearFieldError(fieldEl) {
  const group = fieldEl.closest(".form-group");
  if (!group) return;
  group.classList.remove("has-error");
}

/* ---------- Debounce (used in search inputs) ---------- */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ---------- Query String Helpers ---------- */
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ---------- Keyboard Shortcuts ---------- */
function initKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    const isCtrl = e.ctrlKey || e.metaKey;

    // Ctrl + K → focus search
    if (isCtrl && e.key.toLowerCase() === "k") {
      e.preventDefault();
      const search = document.querySelector('input[type="search"], .js-search-input');
      if (search) search.focus();
    }

    // Esc → close modal
    if (e.key === "Escape") {
      closeModal();
    }

    // Ctrl + D → toggle dark mode
    if (isCtrl && e.key.toLowerCase() === "d") {
      e.preventDefault();
      toggleTheme();
    }
  });
}

/* ---------- Init shared UI on every page ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMobileNav();
  initKeyboardShortcuts();

  const themeBtn = document.querySelector(".theme-toggle");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);
});
