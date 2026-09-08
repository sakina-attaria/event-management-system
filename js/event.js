/* ============================================
   EVENTS.JS — Listing, Search, Filter, Pagination
   ============================================ */

const PAGE_SIZE = 6;
let currentPage = 1;
let filteredEvents = [];

/* ---------- Read current filter values ---------- */
function getFilterValues() {
  return {
    name: (document.getElementById("fName")?.value || document.getElementById("heroSearch")?.value || "").trim().toLowerCase(),
    category: document.getElementById("fCategory")?.value || document.getElementById("heroCategory")?.value || "",
    location: (document.getElementById("fLocation")?.value || "").trim().toLowerCase(),
    date: document.getElementById("fDate")?.value || "",
    maxPrice: document.getElementById("fPrice")?.value || ""
  };
}

/* ---------- Apply all filters together (AND logic) ---------- */
function applyFilters() {
  const f = getFilterValues();
  const allEvents = EventsAPI.getAll();

  filteredEvents = allEvents.filter(ev => {
    const matchesName = !f.name || ev.name.toLowerCase().includes(f.name);
    const matchesCategory = !f.category || ev.category === f.category;
    const matchesLocation = !f.location || ev.location.toLowerCase().includes(f.location);
    const matchesDate = !f.date || ev.date === f.date;
    const matchesPrice = !f.maxPrice || ev.price <= Number(f.maxPrice);
    return matchesName && matchesCategory && matchesLocation && matchesDate && matchesPrice;
  });

  currentPage = 1;
  renderEvents();
}

/* ---------- Render event cards for current page ---------- */
function renderEvents() {
  const grid = document.getElementById("eventGrid");
  const emptyState = document.getElementById("emptyState");
  if (!grid) return;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredEvents.slice(start, start + PAGE_SIZE);

  if (pageItems.length === 0) {
    grid.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    renderPagination();
    return;
  }
  if (emptyState) emptyState.style.display = "none";

  grid.innerHTML = pageItems.map(ev => {
    const availableSeats = EventsAPI.availableSeatCount(ev.id);
    return `
    <article class="event-card">
      <div class="thumb">
        <span class="badge ${ev.status}">${capitalize(ev.status)}</span>
        <img src="${ev.image}" alt="${ev.name}" loading="lazy">
      </div>
      <div class="body">
        <span class="category">${ev.category}</span>
        <h3>${ev.name}</h3>
        <div class="event-meta">
          <span>📅 ${formatDate(ev.date)} · ${formatTime(ev.time)}</span>
          <span>📍 ${ev.location}</span>
        </div>
        <div class="ticket-divider"></div>
        <div class="footer-row">
          <span class="price-tag">${formatCurrency(ev.price)}</span>
          <span class="seats-left">${availableSeats > 0 ? availableSeats + " seats left" : "Sold out"}</span>
        </div>
        <a href="event-details.html?id=${ev.id}" class="btn btn-primary btn-block">View Details</a>
      </div>
    </article>`;
  }).join("");

  renderPagination();
}

/* ---------- Pagination controls ---------- */
function renderPagination() {
  const container = document.getElementById("pagination");
  if (!container) return;

  const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE);
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `<button ${currentPage === 1 ? "disabled" : ""} data-page="prev">‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  html += `<button ${currentPage === totalPages ? "disabled" : ""} data-page="next">›</button>`;
  container.innerHTML = html;

  container.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE);
      if (page === "prev") currentPage = Math.max(1, currentPage - 1);
      else if (page === "next") currentPage = Math.min(totalPages, currentPage + 1);
      else currentPage = Number(page);
      renderEvents();
      document.getElementById("eventGrid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

/* ---------- Wire up filter/search inputs ---------- */
function initEventListingPage() {
  applyFilters();

  const filterForm = document.getElementById("filterForm");
  if (filterForm) {
    filterForm.addEventListener("input", debounce(applyFilters, 300));
    filterForm.addEventListener("submit", (e) => e.preventDefault());
  }

  const clearBtn = document.getElementById("clearFilters");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      filterForm.reset();
      applyFilters();
    });
  }

  const heroSearchBtn = document.getElementById("heroSearchBtn");
  if (heroSearchBtn) {
    heroSearchBtn.addEventListener("click", () => {
      const nameField = document.getElementById("fName");
      const catField = document.getElementById("fCategory");
      if (nameField) nameField.value = document.getElementById("heroSearch").value;
      if (catField) catField.value = document.getElementById("heroCategory").value;
      applyFilters();
    });
  }

  const heroSearchInput = document.getElementById("heroSearch");
  if (heroSearchInput) {
    heroSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") heroSearchBtn?.click();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("eventGrid")) {
    initEventListingPage();
  }
});
