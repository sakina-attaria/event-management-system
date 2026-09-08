/* ============================================
   MY-BOOKINGS.JS — View & Manage User Bookings
   ============================================ */

function initMyBookingsPage() {
  const form = document.getElementById("lookupForm");
  const savedEmail = sessionStorage.getItem("ems_last_lookup_email");

  if (savedEmail) {
    document.getElementById("lookupEmail").value = savedEmail;
    renderBookingsFor(savedEmail);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const emailField = document.getElementById("lookupEmail");
    clearFieldError(emailField);

    if (!Validate.required(emailField.value) || !Validate.email(emailField.value)) {
      setFieldError(emailField, "Enter a valid email address.");
      return;
    }

    sessionStorage.setItem("ems_last_lookup_email", emailField.value.trim());
    renderBookingsFor(emailField.value.trim());
  });
}

function renderBookingsFor(email) {
  const list = document.getElementById("bookingsList");
  const emptyState = document.getElementById("bookingsEmpty");
  const bookings = BookingsAPI.getByCustomerEmail(email)
    .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

  if (bookings.length === 0) {
    list.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  list.innerHTML = bookings.map(b => `
    <div class="booking-card">
      <div class="booking-card-header">
        <div>
          <h3>${b.eventName}</h3>
          <span class="seats-left">Booking ID: ${b.id}</span>
        </div>
        <span class="badge status-${b.status}" style="position:static;">${capitalize(b.status)}</span>
      </div>
      <div class="booking-card-body">
        <span>🎟️ Seats: ${b.seats.join(", ")}</span>
        <span>👤 ${b.numTickets} ticket(s)</span>
        <span>💰 ${formatCurrency(b.totalAmount)}</span>
        <span>📅 Booked on ${formatDate(b.bookingDate)}</span>
      </div>
      ${b.status !== "cancelled" ? `<button class="btn btn-outline btn-sm cancel-booking-btn" data-id="${b.id}">Cancel Booking</button>` : ""}
    </div>
  `).join("");

  list.querySelectorAll(".cancel-booking-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const bookingId = btn.dataset.id;
      showConfirm(
        "Are you sure you want to cancel this booking? This cannot be undone.",
        () => {
          BookingsAPI.updateStatus(bookingId, "cancelled");
          showToast("Booking cancelled successfully.", "success");
          renderBookingsFor(email);
        },
        "Cancel Booking"
      );
    });
  });
}

document.addEventListener("DOMContentLoaded", initMyBookingsPage);
