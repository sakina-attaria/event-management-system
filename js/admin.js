/* ============================================
   ADMIN.JS — Dashboard, CRUD, Tables, Reports
   ============================================ */

let adminEventsPage = 1;
let adminBookingsPage = 1;
const ADMIN_PAGE_SIZE = 8;
let eventSort = { field: "date", dir: "asc" };
let bookingSort = { field: "bookingDate", dir: "desc" };

/* ---------- Section Navigation ---------- */
function initAdminNav() {
  const links = document.querySelectorAll(".admin-nav-link");
  links.forEach(link => {
    link.addEventListener("click", () => {
      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      const section = link.dataset.section;

      document.querySelectorAll(".admin-section").forEach(s => s.classList.remove("active"));
      document.getElementById(`section-${section}`).classList.add("active");
      document.getElementById("adminSectionTitle").textContent = link.textContent.trim().replace(/^\S+\s/, "");

      document.getElementById("adminSidebar").classList.remove("open");

      if (section === "dashboard") renderDashboard();
      if (section === "events") renderEventsTable();
      if (section === "bookings") renderBookingsTable();
      if (section === "customers") renderCustomersTable();
      if (section === "reports") renderReport();
    });
  });

  document.getElementById("adminMenuBtn").addEventListener("click", () => {
    document.getElementById("adminSidebar").classList.toggle("open");
  });
}

/* ---------- Dashboard ---------- */
function renderDashboard() {
  const events = EventsAPI.getAll();
  const bookings = BookingsAPI.getAll();
  const customers = CustomersAPI.getAll();

  const activeBookings = bookings.filter(b => b.status !== "cancelled");
  const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const soldTickets = activeBookings.reduce((sum, b) => sum + b.numTickets, 0);
  const availableSeats = events.reduce((sum, ev) => sum + EventsAPI.availableSeatCount(ev.id), 0);
  const cancelledBookings = bookings.filter(b => b.status === "cancelled").length;

  const stats = [
    { label: "Total Events", value: events.length },
    { label: "Total Bookings", value: bookings.length },
    { label: "Total Customers", value: customers.length },
    { label: "Total Revenue", value: formatCurrency(totalRevenue) },
    { label: "Sold Tickets", value: soldTickets },
    { label: "Available Seats", value: availableSeats },
    { label: "Cancelled Bookings", value: cancelledBookings },
    { label: "Avg. Booking Value", value: formatCurrency(activeBookings.length ? totalRevenue / activeBookings.length : 0) }
  ];

  document.getElementById("statsGrid").innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
    </div>`).join("");
}

/* ---------- Sorting helper ---------- */
function sortData(data, field, dir) {
  return [...data].sort((a, b) => {
    let valA = a[field], valB = b[field];
    if (typeof valA === "string") { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
    if (valA < valB) return dir === "asc" ? -1 : 1;
    if (valA > valB) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

/* =========================================================
   EVENTS TABLE
   ========================================================= */
function getFilteredSortedEvents() {
  const search = (document.getElementById("eventSearch")?.value || "").toLowerCase();
  const statusFilter = document.getElementById("eventStatusFilter")?.value || "";

  let events = EventsAPI.getAll().filter(ev =>
    (!search || ev.name.toLowerCase().includes(search)) &&
    (!statusFilter || ev.status === statusFilter)
  );
  return sortData(events, eventSort.field, eventSort.dir);
}

function renderEventsTable() {
  const events = getFilteredSortedEvents();
  const start = (adminEventsPage - 1) * ADMIN_PAGE_SIZE;
  const pageItems = events.slice(start, start + ADMIN_PAGE_SIZE);
  const tbody = document.getElementById("eventsTableBody");

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--color-text-secondary);padding:2rem;">No events found.</td></tr>`;
  } else {
    tbody.innerHTML = pageItems.map(ev => {
      const available = EventsAPI.availableSeatCount(ev.id);
      return `
      <tr>
        <td>${ev.name}</td>
        <td>${ev.category}</td>
        <td>${formatDate(ev.date)}</td>
        <td>${formatCurrency(ev.price)}</td>
        <td>${available}/${ev.totalSeats}</td>
        <td>
          <select class="status-select" data-id="${ev.id}">
            ${["upcoming","ongoing","completed","cancelled"].map(s =>
              `<option value="${s}" ${s === ev.status ? "selected" : ""}>${capitalize(s)}</option>`).join("")}
          </select>
        </td>
        <td class="table-actions">
          <button class="icon-btn edit-event-btn" data-id="${ev.id}" title="Edit">✏️</button>
          <button class="icon-btn delete-event-btn" data-id="${ev.id}" title="Delete">🗑️</button>
        </td>
      </tr>`;
    }).join("");
  }

  renderAdminPagination("eventsPagination", events.length, adminEventsPage, (p) => { adminEventsPage = p; renderEventsTable(); });
  attachEventsTableHandlers();
}

function attachEventsTableHandlers() {
  document.querySelectorAll(".status-select").forEach(sel => {
    sel.addEventListener("change", () => {
      EventsAPI.update(sel.dataset.id, { status: sel.value });
      showToast("Event status updated.");
      renderEventsTable();
    });
  });
  document.querySelectorAll(".edit-event-btn").forEach(btn => {
    btn.addEventListener("click", () => openEventModal(btn.dataset.id));
  });
  document.querySelectorAll(".delete-event-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      showConfirm("Delete this event permanently? This cannot be undone.", () => {
        EventsAPI.delete(btn.dataset.id);
        showToast("Event deleted.");
        renderEventsTable();
      }, "Delete Event");
    });
  });
}

/* ---------- Event Add/Edit Modal ---------- */
function openEventModal(eventId = null) {
  const overlay = document.getElementById("eventModalOverlay");
  const form = document.getElementById("eventForm");
  form.reset();
  document.querySelectorAll("#eventForm .form-group").forEach(clearFieldErrorGroup);

  if (eventId) {
    const ev = EventsAPI.getById(eventId);
    document.getElementById("eventModalTitle").textContent = "Edit Event";
    document.getElementById("eventFormId").value = ev.id;
    document.getElementById("eventName").value = ev.name;
    document.getElementById("eventCategory").value = ev.category;
    document.getElementById("eventDescription").value = ev.description;
    document.getElementById("eventDate").value = ev.date;
    document.getElementById("eventTime").value = ev.time;
    document.getElementById("eventLocation").value = ev.location;
    document.getElementById("eventPrice").value = ev.price;
    document.getElementById("eventSeats").value = ev.totalSeats;
    document.getElementById("eventImage").value = ev.image;
    document.getElementById("eventStatus").value = ev.status;
  } else {
    document.getElementById("eventModalTitle").textContent = "Add Event";
    document.getElementById("eventFormId").value = "";
  }
  overlay.classList.add("active");
}

function clearFieldErrorGroup(group) { group.classList.remove("has-error"); }

function closeEventModal() {
  document.getElementById("eventModalOverlay").classList.remove("active");
}

function saveEventForm() {
  const id = document.getElementById("eventFormId").value;
  const name = document.getElementById("eventName");
  const date = document.getElementById("eventDate");
  const price = document.getElementById("eventPrice");
  const seats = document.getElementById("eventSeats");
  const location = document.getElementById("eventLocation");

  let valid = true;
  [name, date, price, seats, location].forEach(f => f.closest(".form-group").classList.remove("has-error"));

  if (!Validate.required(name.value)) { markInvalid(name, "Event name is required."); valid = false; }
  if (!Validate.required(location.value)) { markInvalid(location, "Location is required."); valid = false; }
  if (!Validate.required(date.value) || !Validate.futureDate(date.value)) { markInvalid(date, "Enter a valid, non-past date."); valid = false; }
  if (!Validate.positiveNumber(price.value)) { markInvalid(price, "Price must be a positive number."); valid = false; }
  if (!Validate.positiveNumber(seats.value)) { markInvalid(seats, "Seat count must be a positive number."); valid = false; }

  if (!valid) { showToast("Please fix the errors in the form.", "error"); return; }

  const seatCount = Number(seats.value);
  const seatsPerRow = 10;
  const rows = Math.ceil(seatCount / seatsPerRow);

  const eventData = {
    name: name.value.trim(),
    category: document.getElementById("eventCategory").value,
    description: document.getElementById("eventDescription").value.trim(),
    date: date.value,
    time: document.getElementById("eventTime").value || "18:00",
    location: location.value.trim(),
    price: Number(price.value),
    totalSeats: seatCount,
    rows: rows,
    seatsPerRow: seatsPerRow,
    image: document.getElementById("eventImage").value.trim() || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
    status: document.getElementById("eventStatus").value
  };

  if (id) {
    EventsAPI.update(id, eventData);
    showToast("Event updated successfully.");
  } else {
    EventsAPI.add(eventData);
    showToast("Event added successfully.");
  }

  closeEventModal();
  renderEventsTable();
  renderDashboard();
}

function markInvalid(field, message) {
  setFieldError(field, message);
}

/* =========================================================
   BOOKINGS TABLE
   ========================================================= */
function getFilteredSortedBookings() {
  const search = (document.getElementById("bookingSearch")?.value || "").toLowerCase();
  const statusFilter = document.getElementById("bookingStatusFilter")?.value || "";

  let bookings = BookingsAPI.getAll().filter(b =>
    (!search || b.fullName.toLowerCase().includes(search) || b.eventName.toLowerCase().includes(search)) &&
    (!statusFilter || b.status === statusFilter)
  );
  return sortData(bookings, bookingSort.field, bookingSort.dir);
}

function renderBookingsTable() {
  const bookings = getFilteredSortedBookings();
  const start = (adminBookingsPage - 1) * ADMIN_PAGE_SIZE;
  const pageItems = bookings.slice(start, start + ADMIN_PAGE_SIZE);
  const tbody = document.getElementById("bookingsTableBody");

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--color-text-secondary);padding:2rem;">No bookings found.</td></tr>`;
  } else {
    tbody.innerHTML = pageItems.map(b => `
      <tr>
        <td>${b.id}</td>
        <td>${b.fullName}</td>
        <td>${b.eventName}</td>
        <td>${b.numTickets}</td>
        <td>${b.seats.join(", ")}</td>
        <td>${formatCurrency(b.totalAmount)}</td>
        <td>${formatDate(b.bookingDate)}</td>
        <td>
          <select class="booking-status-select" data-id="${b.id}">
            ${["pending","confirmed","cancelled","completed"].map(s =>
              `<option value="${s}" ${s === b.status ? "selected" : ""}>${capitalize(s)}</option>`).join("")}
          </select>
        </td>
      </tr>`).join("");
  }

  renderAdminPagination("bookingsPagination", bookings.length, adminBookingsPage, (p) => { adminBookingsPage = p; renderBookingsTable(); });

  document.querySelectorAll(".booking-status-select").forEach(sel => {
    sel.addEventListener("change", () => {
      BookingsAPI.updateStatus(sel.dataset.id, sel.value);
      showToast("Booking status updated.");
      renderBookingsTable();
      renderDashboard();
    });
  });
}

/* =========================================================
   CUSTOMERS TABLE
   ========================================================= */
function renderCustomersTable() {
  const search = (document.getElementById("customerSearch")?.value || "").toLowerCase();
  const customers = CustomersAPI.getAll().filter(c =>
    !search || c.name.toLowerCase().includes(search) || c.email.toLowerCase().includes(search)
  );
  const tbody = document.getElementById("customersTableBody");

  if (customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--color-text-secondary);padding:2rem;">No customers found.</td></tr>`;
    return;
  }
  tbody.innerHTML = customers.map(c => `
    <tr>
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.phone}</td>
      <td>${c.totalBookings}</td>
      <td>${formatCurrency(c.totalSpending)}</td>
      <td>${formatDate(c.lastBooking)}</td>
    </tr>`).join("");
}

/* =========================================================
   REPORTS
   ========================================================= */
function renderReport() {
  const bookings = BookingsAPI.getAll();
  const activeBookings = bookings.filter(b => b.status !== "cancelled");
  const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalTickets = activeBookings.reduce((sum, b) => sum + b.numTickets, 0);
  const avgBooking = activeBookings.length ? totalRevenue / activeBookings.length : 0;
  const confirmed = bookings.filter(b => b.status === "confirmed" || b.status === "completed").length;
  const cancelled = bookings.filter(b => b.status === "cancelled").length;

  const eventCounts = {};
  const categoryCounts = {};
  activeBookings.forEach(b => {
    eventCounts[b.eventName] = (eventCounts[b.eventName] || 0) + b.numTickets;
    const ev = EventsAPI.getById(b.eventId);
    if (ev) categoryCounts[ev.category] = (categoryCounts[ev.category] || 0) + b.numTickets;
  });
  const mostPopularEvent = Object.entries(eventCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  const mostPopularCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  document.getElementById("reportSheet").innerHTML = `
    <h2>EventHub — Business Report</h2>
    <p class="report-date">Generated on ${formatDate(new Date().toISOString())}</p>
    <div class="report-grid">
      <div class="item"><div class="label">Total Revenue</div><div class="value">${formatCurrency(totalRevenue)}</div></div>
      <div class="item"><div class="label">Total Bookings</div><div class="value">${bookings.length}</div></div>
      <div class="item"><div class="label">Total Tickets Sold</div><div class="value">${totalTickets}</div></div>
      <div class="item"><div class="label">Average Booking Value</div><div class="value">${formatCurrency(avgBooking)}</div></div>
      <div class="item"><div class="label">Most Popular Event</div><div class="value" style="font-size:1rem;">${mostPopularEvent}</div></div>
      <div class="item"><div class="label">Most Popular Category</div><div class="value" style="font-size:1rem;">${mostPopularCategory}</div></div>
      <div class="item"><div class="label">Confirmed Bookings</div><div class="value">${confirmed}</div></div>
      <div class="item"><div class="label">Cancelled Bookings</div><div class="value">${cancelled}</div></div>
    </div>
  `;
}

/* =========================================================
   PAGINATION (shared for admin tables)
   ========================================================= */
function renderAdminPagination(containerId, totalItems, currentPage, onPageChange) {
  const container = document.getElementById(containerId);
  const totalPages = Math.ceil(totalItems / ADMIN_PAGE_SIZE);
  if (totalPages <= 1) { container.innerHTML = ""; return; }

  let html = `<button ${currentPage === 1 ? "disabled" : ""} data-page="prev">‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  html += `<button ${currentPage === totalPages ? "disabled" : ""} data-page="next">›</button>`;
  container.innerHTML = html;

  container.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      let page = btn.dataset.page;
      if (page === "prev") page = currentPage - 1;
      else if (page === "next") page = currentPage + 1;
      else page = Number(page);
      onPageChange(page);
    });
  });
}

/* =========================================================
   EXPORT / RESET (Settings)
   ========================================================= */
function exportJSON() {
  const data = {
    events: EventsAPI.getAll(),
    bookings: BookingsAPI.getAll(),
    customers: CustomersAPI.getAll()
  };
  downloadFile("eventhub-data.json", JSON.stringify(data, null, 2), "application/json");
  showToast("Data exported as JSON.");
}

function exportBookingsCSV() {
  const bookings = BookingsAPI.getAll();
  const headers = ["Booking ID","Customer","Email","Event","Tickets","Seats","Amount","Date","Status"];
  const rows = bookings.map(b => [
    b.id, b.fullName, b.email, b.eventName, b.numTickets, b.seats.join(" "), b.totalAmount, formatDate(b.bookingDate), b.status
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  downloadFile("eventhub-bookings.csv", csv, "text/csv");
  showToast("Bookings exported as CSV.");
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function resetAllData() {
  showConfirm("This will erase all events, bookings and customers, and restore sample data. Continue?", () => {
    Storage.remove(STORAGE_KEYS.EVENTS);
    Storage.remove(STORAGE_KEYS.BOOKINGS);
    Storage.remove(STORAGE_KEYS.CUSTOMERS);
    initData();
    showToast("All data has been reset.");
    renderDashboard();
    renderEventsTable();
  }, "Reset All Data");
}

/* =========================================================
   INIT
   ========================================================= */
function initAdminPage() {
  initAdminNav();
  renderDashboard();
  renderEventsTable();

  document.getElementById("eventSearch").addEventListener("input", debounce(() => { adminEventsPage = 1; renderEventsTable(); }, 300));
  document.getElementById("eventStatusFilter").addEventListener("change", () => { adminEventsPage = 1; renderEventsTable(); });
  document.getElementById("bookingSearch").addEventListener("input", debounce(() => { adminBookingsPage = 1; renderBookingsTable(); }, 300));
  document.getElementById("bookingStatusFilter").addEventListener("change", () => { adminBookingsPage = 1; renderBookingsTable(); });
  document.getElementById("customerSearch").addEventListener("input", debounce(renderCustomersTable, 300));

  document.querySelectorAll("#eventsTable th[data-sort]").forEach(th => {
    th.addEventListener("click", () => {
      const field = th.dataset.sort;
      eventSort.dir = (eventSort.field === field && eventSort.dir === "asc") ? "desc" : "asc";
      eventSort.field = field;
      renderEventsTable();
    });
  });
  document.querySelectorAll("#bookingsTable th[data-sort]").forEach(th => {
    th.addEventListener("click", () => {
      const field = th.dataset.sort;
      bookingSort.dir = (bookingSort.field === field && bookingSort.dir === "asc") ? "desc" : "asc";
      bookingSort.field = field;
      renderBookingsTable();
    });
  });

  document.getElementById("addEventBtn").addEventListener("click", () => openEventModal());
  document.getElementById("eventModalClose").addEventListener("click", closeEventModal);
  document.getElementById("eventFormCancel").addEventListener("click", closeEventModal);
  document.getElementById("eventFormSave").addEventListener("click", saveEventForm);
  document.getElementById("eventModalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "eventModalOverlay") closeEventModal();
  });

  document.getElementById("settingsThemeBtn").addEventListener("click", toggleTheme);
  document.getElementById("exportJsonBtn").addEventListener("click", exportJSON);
  document.getElementById("exportCsvBtn").addEventListener("click", exportBookingsCSV);
  document.getElementById("resetDataBtn").addEventListener("click", resetAllData);
}

document.addEventListener("DOMContentLoaded", initAdminPage);
