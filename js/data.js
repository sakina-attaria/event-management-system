/* ============================================
   DATA.JS — Sample Data + LocalStorage Setup
   ============================================ */

const STORAGE_KEYS = {
  EVENTS: "ems_events",
  BOOKINGS: "ems_bookings",
  CUSTOMERS: "ems_customers",
  THEME: "ems_theme",
  SEATS: "ems_seat_locks"
};

/* ---------- Sample seed events ----------
   Replace image URLs with your own images in assets/images/
   if you want fully offline / custom photos. These Unsplash
   URLs are free-to-use (no copyright issue). */
const SEED_EVENTS = [
  {
    id: "EVT1001",
    name: "Sunburst Music Festival",
    category: "Music",
    description: "A full-day open-air festival featuring live bands, food trucks, and an evening fireworks show. Bring your friends and enjoy a summer night of great music.",
    date: "2026-10-12",
    time: "17:00",
    location: "Riverside Park, Lahore",
    price: 2500,
    totalSeats: 120,
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
    status: "upcoming",
    rows: 10,
    seatsPerRow: 12
  },
  {
    id: "EVT1002",
    name: "TechNova Conference 2026",
    category: "Conference",
    description: "Industry leaders share insights on AI, web development, and product design. Includes networking sessions and hands-on workshops.",
    date: "2026-11-03",
    time: "09:30",
    location: "Expo Center, Karachi",
    price: 4000,
    totalSeats: 80,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    status: "upcoming",
    rows: 8,
    seatsPerRow: 10
  },
  {
    id: "EVT1003",
    name: "Stand-Up Comedy Night",
    category: "Comedy",
    description: "An evening of laughter with top local comedians. Family-friendly show with a short intermission.",
    date: "2026-09-20",
    time: "20:00",
    location: "Arts Council Auditorium, Islamabad",
    price: 1200,
    totalSeats: 60,
    image: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&q=80",
    status: "upcoming",
    rows: 6,
    seatsPerRow: 10
  },
  {
    id: "EVT1004",
    name: "Modern Art Exhibition",
    category: "Art",
    description: "A curated showcase of contemporary paintings and sculptures from emerging local artists.",
    date: "2026-08-15",
    time: "11:00",
    location: "City Gallery, Lahore",
    price: 500,
    totalSeats: 100,
    image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80",
    status: "ongoing",
    rows: 10,
    seatsPerRow: 10
  },
  {
    id: "EVT1005",
    name: "Champions Football Cup",
    category: "Sports",
    description: "Local league finals — two top teams compete for the season trophy. Concession stands available.",
    date: "2026-07-05",
    time: "16:30",
    location: "National Stadium, Karachi",
    price: 1800,
    totalSeats: 150,
    image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80",
    status: "completed",
    rows: 15,
    seatsPerRow: 10
  },
  {
    id: "EVT1006",
    name: "Startup Pitch Night",
    category: "Conference",
    description: "Early-stage founders pitch to a panel of investors. Open Q&A and networking reception follows.",
    date: "2026-12-01",
    time: "18:00",
    location: "Innovation Hub, Islamabad",
    price: 800,
    totalSeats: 70,
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80",
    status: "upcoming",
    rows: 7,
    seatsPerRow: 10
  }
];

/* ---------- Generic storage helpers ---------- */
const Storage = {
  get(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error("Storage read error:", key, e);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("Storage write error:", key, e);
      return false;
    }
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};

/* ---------- Seed / initialize data on first run ---------- */
function initData() {
  if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
    Storage.set(STORAGE_KEYS.EVENTS, SEED_EVENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    Storage.set(STORAGE_KEYS.BOOKINGS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    Storage.set(STORAGE_KEYS.CUSTOMERS, []);
  }
}
initData();

/* ---------- Data access layer ---------- */
const EventsAPI = {
  getAll() {
    return Storage.get(STORAGE_KEYS.EVENTS, []);
  },
  getById(id) {
    return this.getAll().find(ev => ev.id === id) || null;
  },
  add(event) {
    const events = this.getAll();
    event.id = "EVT" + (1000 + events.length + 1) + Math.floor(Math.random() * 90 + 10);
    events.push(event);
    Storage.set(STORAGE_KEYS.EVENTS, events);
    return event;
  },
  update(id, updates) {
    const events = this.getAll();
    const idx = events.findIndex(ev => ev.id === id);
    if (idx === -1) return null;
    events[idx] = { ...events[idx], ...updates };
    Storage.set(STORAGE_KEYS.EVENTS, events);
    return events[idx];
  },
  delete(id) {
    const events = this.getAll().filter(ev => ev.id !== id);
    Storage.set(STORAGE_KEYS.EVENTS, events);
  },
  bookedSeatsFor(eventId) {
    const bookings = BookingsAPI.getAll().filter(
      b => b.eventId === eventId && b.status !== "cancelled"
    );
    return bookings.flatMap(b => b.seats || []);
  },
  availableSeatCount(eventId) {
    const event = this.getById(eventId);
    if (!event) return 0;
    return event.totalSeats - this.bookedSeatsFor(eventId).length;
  }
};

const BookingsAPI = {
  getAll() {
    return Storage.get(STORAGE_KEYS.BOOKINGS, []);
  },
  getById(id) {
    return this.getAll().find(b => b.id === id) || null;
  },
  getByCustomerEmail(email) {
    return this.getAll().filter(b => b.email.toLowerCase() === email.toLowerCase());
  },
  add(booking) {
    const bookings = this.getAll();
    booking.id = "BKG" + Date.now().toString().slice(-8);
    booking.bookingDate = new Date().toISOString();
    bookings.push(booking);
    Storage.set(STORAGE_KEYS.BOOKINGS, bookings);
    CustomersAPI.upsertFromBooking(booking);
    return booking;
  },
  updateStatus(id, status) {
    const bookings = this.getAll();
    const idx = bookings.findIndex(b => b.id === id);
    if (idx === -1) return null;
    bookings[idx].status = status;
    Storage.set(STORAGE_KEYS.BOOKINGS, bookings);
    return bookings[idx];
  }
};

const CustomersAPI = {
  getAll() {
    return Storage.get(STORAGE_KEYS.CUSTOMERS, []);
  },
  upsertFromBooking(booking) {
    const customers = this.getAll();
    let customer = customers.find(c => c.email.toLowerCase() === booking.email.toLowerCase());
    if (customer) {
      customer.totalBookings += 1;
      customer.totalSpending += booking.totalAmount;
      customer.lastBooking = booking.bookingDate;
    } else {
      customer = {
        name: booking.fullName,
        email: booking.email,
        phone: booking.phone,
        totalBookings: 1,
        totalSpending: booking.totalAmount,
        lastBooking: booking.bookingDate
      };
      customers.push(customer);
    }
    Storage.set(STORAGE_KEYS.CUSTOMERS, customers);
  }
};
