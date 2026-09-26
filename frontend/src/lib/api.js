// Mock local para preview del frontend SIN backend
// Este archivo shorea las requests al API y devuelve datos locales cuando no hay backend disponible.
// NO se usa en producción — solo para desarrollo local cuando el backend no está disponible.

import axios from "axios";

const backendUrl = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
export const api = axios.create({
  baseURL: `${backendUrl}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Mock de respuestas para cuando el backend no está disponible
const MOCK_ENABLED = !backendUrl; // Habilitado solo cuando no hay backend URL configurada

async function mockGetConfig() {
  return {
    data: {
      theme: {
        accent: "#E56B9E",
        background: "#FFFFFF",
        surface: "#FFF3F7",
        text: "#2E2126",
        muted: "#97707F",
        border: "#F5D3E2",
      },
      services: {
        mujer: [
          {
            id: "knotless",
            name: "Knotless",
            type: "matrix",
            lengths: { Hombro: [65, 55, 50, 45], Espalda: [75, 65, 60, 55], Cintura: [85, 75, 70, 65], Glúteos: [95, 85, 80, 75] },
            base: 45,
            duration: "3 – 5h",
            extras: ["extra-pequeno", "extra-largura"],
            descEs: "Trenzas sin nudo ultraligeras. Precio según largura y grosor.",
            descEn: "Ultra-light knotless braids. Price by length and thickness.",
          },
          {
            id: "boho",
            name: "Box Braids",
            type: "matrix",
            lengths: { Hombro: [55, 50, 45, 40], Espalda: [65, 60, 55, 50], Cintura: [75, 70, 65, 60], Glúteos: [85, 80, 75, 70] },
            base: 40,
            duration: "3 – 5h",
            extras: ["extra-pequeno", "extra-largura"],
            descEs: "Estilo atemporal con divisiones perfectas y acabados duraderos.",
            descEn: "Timeless style with perfect parting and long-lasting finishes.",
          },
        ],
        hombre: [
          {
            id: "cornrows",
            name: "Cornrows",
            type: "matrix",
            lengths: { Corto: [40, 35, 30], Mediano: [50, 45, 40], Largo: [60, 55, 50] },
            base: 35,
            duration: "2 – 4h",
            extras: ["diseno"],
            descEs: "Trenzas cercladas limpias y duraderas para hombres.",
            descEn: "Clean, long-lasting cornrows for men.",
          },
        ],
        extras: [
          { id: "extra-largura", nameEs: "Extra largura", nameEn: "Extra length", price: 20 },
          { id: "rizos-puntas", nameEs: "Rizos en las puntas", nameEn: "Curled ends", price: 5 },
          { id: "kanekalon-lisa", nameEs: "Kanekalon lisa", nameEn: "Straight kanekalon", price: 6 },
        ],
      },
      extras: [
        { id: "extra-pequeno", nameEs: "Extra pequeño", nameEn: "Extra small", price: 20 },
        { id: "extra-largura", nameEs: "Extra largura", nameEn: "Extra length", price: 20 },
        { id: "rizos-puntas", nameEs: "Rizos en las puntas", nameEn: "Curled ends", price: 5 },
        { id: "kanekalon-lisa", nameEs: "Kanekalon lisa", nameEn: "Straight kanekalon", price: 6, qty: true },
        { id: "kanekalon-rizada", nameEs: "Kanekalon rizada", nameEn: "Curly kanekalon", price: 15, qty: true },
        { id: "kanekalon-afro", nameEs: "Kanekalon afro", nameEn: "Afro kanekalon", price: 15, qty: true },
      ],
      site_content: {
        es: {
          booking: {
            title: "Reserva tu cita",
            subtitle: "Elige servicio, día y hora. Joana recibe una notificación al móvil al instante.",
            steps: [
              { title: "Elige tu servicio", desc: "Consulta el catálogo y escoge el estilo." },
              { title: "Día y hora", desc: "Dinos cuándo te viene mejor." },
              { title: "Confirmación", desc: "Joana te confirma tu hueco al instante." },
            ],
          },
        },
        en: {
          booking: {
            title: "Book your appointment",
            subtitle: "Choose service, date and time. Joana gets an instant notification.",
            steps: [
              { title: "Choose your service", desc: "Browse the catalog and pick your style." },
              { title: "Date and time", desc: "Tell us when it works best for you." },
              { title: "Confirmation", desc: "Joana confirms your slot instantly." },
            ],
          },
        },
      },
    },
  };
}

async function mockGetMedia() {
  return {
    data: [
      {
        id: "mock-1",
        type: "image",
        url: "https://images.unsplash.com/photo-1594254773847-9fce26e950bc?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
        caption_es: "Knotless braids medianas con acabado impecable",
        caption_en: "Medium knotless braids with flawless finish",
        created_at: new Date().toISOString(),
      },
      {
        id: "mock-2",
        type: "image",
        url: "https://images.unsplash.com/photo-1586225954369-2f101f9787-504c7051df77?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
        caption_es: "Box braids largas estilo boho",
        caption_en: "Long box braids boho style",
        created_at: new Date().toISOString(),
      },
      {
        id: "mock-3",
        type: "video",
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        caption_es: "Demo de trenzas en movimiento",
        caption_en: "Braids in motion demo",
        created_at: new Date().toISOString(),
      },
    ],
  };
}

async function mockGetCalendar(date) {
  const start = date || new Date().toISOString().slice(0, 10);
  const end = new Date(new Date(start).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const dates = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(new Date(start).getTime() + i * 24 * 60 * 60 * 1000);
    const ds = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay();
    dates[ds] = {
      is_open: dayOfWeek !== 0 && dayOfWeek !== 6,
      full: dayOfWeek === 3 || dayOfWeek === 4,
      capacity: dayOfWeek === 3 || dayOfWeek === 4 ? 0 : 2,
      bookings_count: dayOfWeek === 3 || dayOfWeek === 4 ? 2 : Math.floor(Math.random() * 2),
      remaining_capacity: dayOfWeek === 3 || dayOfWeek === 4 ? 0 : Math.max(0, 2 - Math.floor(Math.random() * 2)),
    };
  }
  return { data: { dates } };
}

async function mockGetSlots(date) {
  const slots = [];
  for (let h = 10; h < 18; h++) {
    const taken = Math.random() < 0.3;
    slots.push({
      time: `${String(h).padStart(2, "0")}:00`,
      duration_minutes: 60,
      taken,
      available: !taken,
    });
    slots.push({
      time: `${String(h).padStart(2, "0")}:30`,
      duration_minutes: 60,
      taken: Math.random() < 0.4,
      available: !taken,
    });
  }
  return {
    data: {
      slots,
      taken: slots.filter((s) => s.taken).map((s) => s.time),
      available: slots.filter((s) => s.available).map((s) => s.time),
      is_open: true,
      daily_capacity: 2,
      bookings_count: 0,
      remaining_capacity: 2,
      duration_minutes: 60,
    },
  };
}

// Interceptar requests para mock
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!MOCK_ENABLED) throw error;

    const request = error.config;
    const method = request.method.toLowerCase();
    const url = request.url || "";

    if (method === "get" && url.includes("/config")) {
      return mockGetConfig();
    }
    if (method === "get" && url.includes("/media")) {
      return mockGetMedia();
    }
    if (method === "get" && url.includes("/bookings/calendar")) {
      const start = new URLSearchParams(url.split("?")[1] || "").get("start") || new Date().toISOString().slice(0, 10);
      return mockGetCalendar(start);
    }
    if (method === "get" && url.includes("/bookings/slots")) {
      const date = new URLSearchParams(url.split("?")[1] || "").get("date") || new Date().toISOString().slice(0, 10);
      return mockGetSlots(date);
    }

    // Para otras requests, devolver error silencioso para que el UI muestre estados vacíos
    return {
      data: null,
      status: 200,
      statusText: "OK",
      headers: {},
      config: request,
    };
  }
);

// ─── Helpers ──────────────────────────────────────────────────────────

export const resolveMediaUrl = (url) => {
  if (!url || url.startsWith("http")) return url;
  return `${backendUrl}${url}`;
};

export const formatApiError = (error) =>
  error?.response?.data?.detail || error?.message || "Ha ocurrido un error";
