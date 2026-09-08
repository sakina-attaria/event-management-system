/* ============================================
   BOOKING.JS — Seat Selection, Countdown, Validation
   ============================================ */

let currentEvent = null;
let selectedSeats = [];
let countdownInterval = null;
let secondsLeft = 10 * 60;

const DISCOUNT_THRESHOLD = 4;
const DISCOUNT_RATE = 0.10;
const TAX_RATE = 0.05;

/* ---------- Init page ---------- */
function initBookingPage() {
  const eventId = getQueryParam("id");
  currentEvent = eventId ? EventsAPI.getById(eventId) : null;

  const infoBox = document.getElementById("bookingEventInfo");
  if (!currentEvent) {
    infoBox.innerHTML = `<div class="empty-state"><h3>Event not found</h3><a href="index.html" class="btn btn-primary mt-md">Back to Events</a></div>`;
    document.querySelector(".booking-layout").style.display = "none";
    return;
  }

  infoBox.innerHTML = `
    <div class="booking-event-summary">
      <img src="${currentEvent.image}" alt="${currentEvent.name}">
      <div>
        <h2>${currentEvent.name}</h2>
        <p>${formatDate(currentEvent.date)} · ${formatTime(currentEvent.time)} · ${currentEvent.location}</p>
        <p class="price-tag">${formatCurrency(currentEvent.price)} / ticket</p>
      </div>
    </div>`;

  renderSeatMap();
  startCountdown();
  updatePriceBreakdown();

  document.getElementById("bookingForm").addEventListener("submit", handleBookingSubmit);
}

/* ---------- Seat Map ---------- */
function renderSeatMap() {
  const seatMap = document.getElementById("seatMap");
  const bookedSeats = EventsAPI.bookedSeatsFor(currentEvent.id);

  let html = "";
  for (let r = 0; r < currentEvent.rows; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    html += `<div class="seat-row">`;
    for (let s = 1; s <= currentEvent.seatsPerRow; s++) {
      const seatId = `${rowLabel}${s}`;
      const isBooked = bookedSeats.includes(seatId);
      html += `<button type="button" class="seat ${isBooked ? "booked" : ""}" data-seat="${seatId}" ${isBooked ? "disabled" : ""} aria-label="Seat ${seatId}">${s}</button>`;
    }
    html += `</div>`;
  }
  seatMap.innerHTML = html;

  seatMap.addEventListener("click", (e) => {
    const btn = e.target.closest(".seat");
    if (!btn || btn.classList.contains("booked")) return;
    toggleSeat(btn);
  });
}

function toggleSeat(btn) {
  const seatId = btn.dataset.seat;
  if (selectedSeats.includes(seatId)) {
    selectedSeats = selectedSeats.filter(s => s !== seatId);
    btn.classList.remove("selected");
  } else {
    selectedSeats.push(seatId);
    btn.classList.add("selected");
  }
  document.getElementById("numTickets").value = selectedSeats.length || 1;
  updatePriceBreakdown();
}

/* ---------- Price Calculation ---------- */
function updatePriceBreakdown() {
  const tickets = selectedSeats.length;
  const subtotal = tickets * currentEvent.price;
  const discount = tickets >= DISCOUNT_THRESHOLD ? subtotal * DISCOUNT_RATE : 0;
  const taxable = subtotal - discount;
  const tax = taxable * TAX_RATE;
  const total = taxable + tax;

  document.getElementById("pbSubtotal").textContent = formatCurrency(subtotal);
  document.getElementById("pbDiscount").textContent = "- " + formatCurrency(discount);
  document.getElementById("pbTax").textContent = "+ " + formatCurrency(tax);
  document.getElementById("pbTotal").textContent = formatCurrency(total);

  return { tickets, subtotal, discount, tax, total };
}

/* ---------- Countdown Timer ---------- */
function startCountdown() {
  secondsLeft = 10 * 60;
  updateCountdownDisplay();
  countdownInterval = setInterval(() => {
    secondsLeft--;
    updateCountdownDisplay();
    if (secondsLeft <= 0) {
      clearInterval(countdownInterval);
      expireBookingSession();
    }
  }, 1000);
}

function updateCountdownDisplay() {
  const m = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const s = (secondsLeft % 60).toString().padStart(2, "0");
  const el = document.getElementById("countdownTimer");
  if (el) el.textContent = `${m}:${s}`;
}

function expireBookingSession() {
  showModal({
    title: "Session Expired",
    bodyHTML: "<p>Your booking session has expired. Please select your seats again.</p>",
    buttons: [{ label: "Restart", className: "btn-primary", onClick: () => location.reload() }]
  });
}

/* ---------- Form Validation ---------- */
function validateBookingForm() {
  let valid = true;
  const fullName = document.getElementById("fullName");
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");

  [fullName, email, phone].forEach(clearFieldError);

  if (!Validate.required(fullName.value)) {
    setFieldError(fullName, "Full name is required.");
    valid = false;
  }
  if (!Validate.required(email.value) || !Validate.email(email.value)) {
    setFieldError(email, "Enter a valid email address.");
    valid = false;
  }
  if (!Validate.required(phone.value) || !Validate.phone(phone.value)) {
    setFieldError(phone, "Enter a valid phone number.");
    valid = false;
  }
  if (selectedSeats.length === 0) {
    showToast("Please select at least one seat.", "error");
    valid = false;
  }
  return valid;
}

/* ---------- Submit Booking ---------- */
function handleBookingSubmit(e) {
  e.preventDefault();
  if (!validateBookingForm()) return;

  showLoading();

  setTimeout(() => {
    const pricing = updatePriceBreakdown();
    const booking = {
      eventId: currentEvent.id,
      eventName: currentEvent.name,
      fullName: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      seats: [...selectedSeats],
      numTickets: pricing.tickets,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      tax: pricing.tax,
      totalAmount: pricing.total,
      status: "confirmed"
    };

    const saved = BookingsAPI.add(booking);
    clearInterval(countdownInterval);
    hideLoading();

    showModal({
      title: "Booking Confirmed 🎉",
      bodyHTML: `
        <p>Your booking ID is <strong>${saved.id}</strong>.</p>
        <p>Seats: ${saved.seats.join(", ")}</p>
        <p>Total paid: ${formatCurrency(saved.totalAmount)}</p>`,
      buttons: [{ label: "View My Bookings", className: "btn-primary", onClick: () => { window.location.href = "my-bookings.html"; } }]
    });
  }, 600);
}

document.addEventListener("DOMContentLoaded", initBookingPage);
