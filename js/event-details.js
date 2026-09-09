/* ============================================
   EVENT-DETAILS.JS — Single Event Details Page
   ============================================ */

function renderEventDetails() {
  const container = document.getElementById("detailsContainer");
  if (!container) return;

  const eventId = getQueryParam("id");
  const event = eventId ? EventsAPI.getById(eventId) : null;

  if (!event) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Event not found</h3>
        <p>The event you're looking for doesn't exist or was removed.</p>
        <a href="index.html" class="btn btn-primary mt-md">Back to Events</a>
      </div>`;
    return;
  }

  const availableSeats = EventsAPI.availableSeatCount(event.id);

  container.innerHTML = `
    <div class="event-details-grid">
      <div class="details-image">
        <img src="${event.image}" alt="${event.name}" style="width:100%;border-radius:var(--radius);box-shadow:var(--shadow-lg);">
      </div>
      <div class="details-info">
        <span class="badge ${event.status}" style="position:static;display:inline-block;margin-bottom:0.6rem;">${capitalize(event.status)}</span>
        <span class="category">${event.category}</span>
        <h1>${event.name}</h1>
        <p style="color:var(--color-text-secondary);margin:0.8rem 0;">${event.description}</p>

        <div class="event-meta" style="font-size:0.95rem;gap:0.6rem;margin:1rem 0;">
          <span>📅 ${formatDate(event.date)} · ${formatTime(event.time)}</span>
          <span>📍 ${event.location}</span>
          <span>🎟️ ${availableSeats} of ${event.totalSeats} seats available</span>
        </div>

        <div class="ticket-divider" style="margin:1.2rem 0;"></div>

        <div class="flex-between">
          <span class="price-tag" style="font-size:1.5rem;">${formatCurrency(event.price)} <small style="font-size:0.8rem;color:var(--color-text-secondary);font-weight:400;">/ ticket</small></span>
          ${availableSeats > 0
            ? `<a href="booking.html?id=${event.id}" class="btn btn-primary">Book Tickets</a>`
            : `<button class="btn btn-outline" disabled>Sold Out</button>`}
        </div>
      </div>
    </div>

    <section class="mt-md">
      <h2>Seating Information</h2>
      <p style="color:var(--color-text-secondary);margin-top:0.4rem;">
        This venue has ${event.rows} rows with ${event.seatsPerRow} seats per row (${event.totalSeats} total seats).
        Seats are assigned during checkout on the booking page.
      </p>
    </section>
  `;
}

document.addEventListener("DOMContentLoaded", renderEventDetails);
