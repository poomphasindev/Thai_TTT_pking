const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const state = {
  lang: localStorage.getItem("lang") || "en",
  mode: "rail",
  activeTicketId: localStorage.getItem("activeTicketId"),
  map: null,
  markers: [],
  countdownSeconds: 299,
};

const copy = {
  en: {
    brandSub: "Bangkok Tourist Mobility OS",
    navRoute: "Route",
    navExplore: "Explore",
    navTicket: "Ticket",
    navReport: "Report",
    heroBadge: "Bangkok-only pilot",
    heroTitle: "Navigate Bangkok like a local.",
    heroBody: "Landmark-first routing, transparent multimodal fares, and a live digital Joint Ticket for rail, bus, and boat.",
    origin: "Origin",
    destination: "Destination landmark",
    planRoute: "Plan route",
    recommendedRoute: "Recommended route",
    finalFare: "Final fare",
    time: "Time",
    stops: "Stops",
    saved: "Saved",
    fareBreakdown: "Receipt-style fare breakdown",
    routeDetails: "Route details",
    exploreAround: "Explore around destination",
    touristContext: "Tourist context",
    wowFactor: "The wow factor",
    ticketTitle: "3D Holographic Joint Ticket",
    generateTicket: "Generate ticket",
    reportTitle: "Report a transit issue",
    reportBody: "No Vision AI required. Provide clear manual evidence first.",
  },
  th: {
    brandSub: "ระบบเดินทางท่องเที่ยวกรุงเทพฯ",
    navRoute: "เส้นทาง",
    navExplore: "สำรวจ",
    navTicket: "บัตร",
    navReport: "แจ้งปัญหา",
    heroBadge: "โครงการนำร่องกรุงเทพฯ",
    heroTitle: "เที่ยวกรุงเทพฯ แบบรู้ทาง รู้ราคา และใช้บัตรเดียวจบ",
    heroBody: "เส้นทางแบบยึดแลนด์มาร์ก ค่าโดยสารโปร่งใส และบัตรตั๋วร่วมดิจิทัลสำหรับรถไฟฟ้า รถเมล์ และเรือ",
    origin: "ต้นทาง",
    destination: "แลนด์มาร์กปลายทาง",
    planRoute: "ค้นหาเส้นทาง",
    recommendedRoute: "เส้นทางแนะนำ",
    finalFare: "จ่ายจริง",
    time: "เวลา",
    stops: "สถานี",
    saved: "ประหยัด",
    fareBreakdown: "รายละเอียดค่าโดยสารแบบใบเสร็จ",
    routeDetails: "รายละเอียดเส้นทาง",
    exploreAround: "สำรวจรอบจุดหมาย",
    touristContext: "บริบทสำหรับนักท่องเที่ยว",
    wowFactor: "ฟีเจอร์เด่น",
    ticketTitle: "บัตรตั๋วร่วม 3D Holographic",
    generateTicket: "ออกบัตรเดินทาง",
    reportTitle: "แจ้งปัญหาการเดินทาง",
    reportBody: "ใช้แบบ manual-first ก่อน ไม่ต้องพึ่ง Vision AI และให้หลักฐานครบถ้วน",
  },
};

const landmarks = [
  {
    id: "siam",
    en: "Siam",
    th: "สยาม",
    node: "BTS CEN",
    lat: 13.7466,
    lng: 100.5347,
    image: "/assets/generated/bangkok-brochure-en-cover.jpg",
    context: { en: "Shopping, arts, and major rail interchange.", th: "ย่านช้อปปิ้ง ศิลปะ และจุดต่อรถไฟฟ้าหลัก" },
  },
  {
    id: "wat-arun",
    en: "Wat Arun",
    th: "วัดอรุณ",
    node: "Pier N8",
    lat: 13.7437,
    lng: 100.4889,
    image: "/assets/landmarks/wat-arun.jpg",
    context: { en: "Riverside temple, best around sunset.", th: "วัดริมแม่น้ำเจ้าพระยา เหมาะช่วงเย็น" },
  },
  {
    id: "grand-palace",
    en: "Grand Palace",
    th: "พระบรมมหาราชวัง",
    node: "Pier N9",
    lat: 13.7500,
    lng: 100.4913,
    image: "/assets/landmarks/grand-palace.jpg",
    context: { en: "Royal landmark. Check dress code and opening hours.", th: "แลนด์มาร์กราชสำนัก ควรตรวจ dress code และเวลาเปิด" },
  },
  {
    id: "yaowarat",
    en: "Wat Mangkon / Yaowarat",
    th: "วัดมังกร / เยาวราช",
    node: "MRT BL29",
    lat: 13.7422,
    lng: 100.5090,
    image: "/assets/landmarks/yaowarat.jpg",
    context: { en: "Street food, Chinatown heritage, evening walk.", th: "street food, ย่านจีนเก่า และเดินเที่ยวช่วงเย็น" },
  },
  {
    id: "iconsiam",
    en: "ICONSIAM",
    th: "ไอคอนสยาม",
    node: "Pier CAT",
    lat: 13.7266,
    lng: 100.5106,
    image: "/assets/generated/bangkok-map-preview.jpg",
    context: { en: "Riverfront shopping and indoor Thai market experience.", th: "ศูนย์การค้าริมน้ำและโซนตลาดไทยในร่ม" },
  },
  {
    id: "chatuchak",
    en: "Chatuchak Weekend Market",
    th: "ตลาดนัดจตุจักร",
    node: "BTS N8 / MRT BL13",
    lat: 13.7996,
    lng: 100.5501,
    image: "/assets/generated/bangkok-brochure-th-cover.jpg",
    context: { en: "Weekend market. Expect heat, crowds, and long walking.", th: "ตลาดสุดสัปดาห์ ควรเผื่ออากาศร้อนและการเดินเยอะ" },
  },
];

const routeModes = {
  rail: {
    title: { en: "BTS + MRT to destination", th: "BTS + MRT ไปยังจุดหมาย" },
    note: { en: "Fast, predictable, and protected by the Joint Ticket cap.", th: "เร็ว คาดการณ์ง่าย และจำลองเพดานตั๋วร่วม" },
    time: 20,
    stops: 9,
    fare: 49,
    total: 45,
    lines: [
      { label: "BTS nearest station transfer", fare: 17 },
      { label: "MRT / rail connection", fare: 32 },
    ],
    steps: ["Start at nearest BTS/MRT node", "Transfer at interchange", "Walk 4-8 min to landmark"],
  },
  bus: {
    title: { en: "City bus + short walk", th: "รถเมล์ + เดินต่อ" },
    note: { en: "Cheapest when traffic is light. Best for flexible tourists.", th: "ถูกที่สุดเมื่อรถไม่ติด เหมาะกับคนยืดหยุ่นเรื่องเวลา" },
    time: 38,
    stops: 12,
    fare: 24,
    total: 24,
    lines: [
      { label: "Air-conditioned city bus", fare: 24 },
      { label: "Walk to landmark", fare: 0 },
    ],
    steps: ["Board tourist-friendly bus corridor", "Track nearby stop", "Walk 5-10 min to landmark"],
  },
  boat: {
    title: { en: "Rail + Chao Phraya boat", th: "รถไฟฟ้า + เรือเจ้าพระยา" },
    note: { en: "Most scenic for riverside landmarks and photo stops.", th: "วิวดีที่สุดสำหรับแลนด์มาร์กริมแม่น้ำและจุดถ่ายรูป" },
    time: 42,
    stops: 7,
    fare: 66,
    total: 45,
    lines: [
      { label: "Rail to Saphan Taksin", fare: 45 },
      { label: "Chao Phraya boat segment", fare: 21 },
    ],
    steps: ["Take rail to Saphan Taksin", "Walk to Sathorn Pier", "Boat ride to river landmark"],
  },
};

function t(key) {
  return copy[state.lang][key] || copy.en[key] || key;
}

function currentOrigin() {
  return landmarks.find((item) => item.id === $("#originSelect").value) || landmarks[0];
}

function currentDestination() {
  return landmarks.find((item) => item.id === $("#destinationSelect").value) || landmarks[1];
}

function localName(place) {
  return place[state.lang] || place.en;
}

function applyLanguage() {
  document.documentElement.lang = state.lang;
  $("#langToggle").textContent = state.lang === "en" ? "TH" : "EN";
  $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  fillSelects();
  renderRoute();
  renderExplore();
}

function fillSelects() {
  const oldOrigin = $("#originSelect").value || "siam";
  const oldDestination = $("#destinationSelect").value || "wat-arun";
  const options = landmarks.map((place) => `<option value="${place.id}">${localName(place)} · ${place.node}</option>`).join("");
  $("#originSelect").innerHTML = options;
  $("#destinationSelect").innerHTML = options;
  $("#originSelect").value = oldOrigin;
  $("#destinationSelect").value = oldDestination;
}

function renderRoute() {
  const mode = routeModes[state.mode];
  const origin = currentOrigin();
  const dest = currentDestination();
  const saved = Math.max(0, mode.fare - mode.total);
  $("#routeTitle").textContent = `${localName(origin)} → ${localName(dest)}`;
  $("#routeNote").textContent = mode.note[state.lang];
  $("#routeTime").textContent = `~${mode.time} ${state.lang === "th" ? "นาที" : "min"}`;
  $("#routeStops").textContent = `${mode.stops} ${state.lang === "th" ? "สถานี" : "stops"}`;
  $("#routeSaved").textContent = `${saved} THB`;
  $("#finalFare").textContent = `${mode.total}฿`;
  $("#ticketOrigin").value = origin.en;
  $("#ticketDestination").value = dest.en;

  $("#farePanel").innerHTML = `
    <div class="space-y-3 text-sm font-semibold">
      ${mode.lines.map((line) => `<div class="flex justify-between"><span>${line.label}</span><span>${line.fare} THB</span></div>`).join("")}
      <div class="border-t border-dashed border-slate-300 pt-3 flex justify-between text-slate-500"><span>Subtotal</span><span>${mode.fare} THB</span></div>
      <div class="rounded-2xl bg-amber-100 px-4 py-3 flex justify-between font-black text-amber-800"><span>✨ Joint Ticket Cap Applied</span><span>-${saved} THB</span></div>
      <div class="flex items-end justify-between pt-1"><span class="text-base font-black">Total billed today</span><span class="text-3xl font-black text-transit-teal">${mode.total} THB</span></div>
    </div>`;

  $("#routeSteps").innerHTML = mode.steps.map((step, index) => `
    <div class="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <div class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-transit-mint text-sm font-black text-transit-teal">${index + 1}</div>
      <div><p class="font-black">${step}</p><p class="text-sm font-semibold text-slate-500">${index === 2 ? dest.context[state.lang] : "Fare/time simulation for pitch-safe routing."}</p></div>
    </div>`).join("");

  $$(".mode-btn").forEach((button) => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle("bg-white", active);
    button.classList.toggle("text-transit-blue", active);
    button.classList.toggle("text-white/80", !active);
  });
}

function initMap() {
  const dest = currentDestination();
  if (!window.maplibregl) return;
  try {
    state.map = new maplibregl.Map({
      container: "map",
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [dest.lng, dest.lat],
      zoom: 13.5,
      attributionControl: false,
    });
    state.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    state.map.on("load", () => renderExplore());
    state.map.on("error", () => $("#map").classList.add("hidden"));
  } catch {
    $("#map").classList.add("hidden");
  }
}

function renderExplore() {
  const dest = currentDestination();
  $("#exploreTitle").textContent = `${localName(dest)} area`;
  $("#mapContext").textContent = dest.context[state.lang];
  $("#mapFallback").src = dest.image;
  const nearby = [dest, ...landmarks.filter((place) => place.id !== dest.id).slice(0, 4)];
  $("#poiCarousel").innerHTML = nearby.map((place, index) => `
    <article class="min-w-[250px] overflow-hidden rounded-[1.75rem] bg-white shadow-card">
      <img class="h-36 w-full object-cover" src="${place.image}" alt="${place.en}" />
      <div class="p-4">
        <span class="rounded-full ${index === 0 ? "bg-transit-mint text-transit-teal" : "bg-blue-100 text-transit-blue"} px-3 py-1 text-xs font-black">${index === 0 ? "Destination" : "Nearby"}</span>
        <h3 class="mt-3 text-lg font-black">${localName(place)}</h3>
        <p class="mt-1 text-sm font-semibold text-slate-500">${place.node} · ${place.context[state.lang]}</p>
      </div>
    </article>`).join("");

  if (state.map) {
    state.markers.forEach((marker) => marker.remove());
    state.markers = nearby.map((place, index) => {
      const el = document.createElement("div");
      el.className = `map-marker ${index === 0 ? "active" : ""}`;
      el.textContent = index === 0 ? "★" : "•";
      return new maplibregl.Marker({ element: el }).setLngLat([place.lng, place.lat]).addTo(state.map);
    });
    state.map.flyTo({ center: [dest.lng, dest.lat], zoom: 14, essential: false });
  }
}

function wireEvents() {
  $("#langToggle").addEventListener("click", () => {
    state.lang = state.lang === "en" ? "th" : "en";
    localStorage.setItem("lang", state.lang);
    applyLanguage();
  });

  $("#originSelect").addEventListener("change", renderRoute);
  $("#destinationSelect").addEventListener("change", () => {
    renderRoute();
    renderExplore();
  });
  $("#planRouteBtn").addEventListener("click", () => {
    $("#farePanel").classList.remove("hidden");
    document.querySelector("#fareChevron").classList.add("rotate-180");
  });
  $$(".mode-btn").forEach((button) => button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    renderRoute();
  }));
  $("#fareToggle").addEventListener("click", () => {
    $("#farePanel").classList.toggle("hidden");
    $("#fareChevron").classList.toggle("rotate-180");
  });

  $("#tapToUseBtn").addEventListener("click", () => {
    const shell = document.querySelector(".ticket-shell");
    shell.classList.toggle("flipped");
    $("#tapToUseBtn").textContent = shell.classList.contains("flipped") ? "Hide QR" : "Tap to Use";
  });

  $("#ticketForm").addEventListener("submit", submitTicket);
  $("#reportForm").addEventListener("submit", submitReport);
  $("#useNow").addEventListener("click", () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    $("#incidentTime").value = local.toISOString().slice(0, 16);
  });

  $("#aiFab").addEventListener("click", openSheet);
  $("#closeSheet").addEventListener("click", closeSheet);
  $("#sheetOverlay").addEventListener("click", closeSheet);
  $("#chatForm").addEventListener("submit", sendChat);
}

async function submitTicket(event) {
  event.preventDefault();
  $("#ticketMessage").textContent = "Generating ticket...";
  try {
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const ticket = await request("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    state.activeTicketId = ticket.id;
    localStorage.setItem("activeTicketId", ticket.id);
    renderTicket(ticket);
    $("#ticketMessage").textContent = "Ticket ready. Tap to show QR.";
  } catch (error) {
    $("#ticketMessage").textContent = error.message;
  }
}

function renderTicket(ticket) {
  $("#ticketStatus").textContent = ticket.status.toUpperCase();
  $("#ticketHolder").textContent = ticket.holder_name;
  $("#ticketUsed").textContent = ticket.accumulated_fare_thb;
  $("#ticketBilled").textContent = ticket.accumulated_fare_thb;
  $("#ticketRides").textContent = ticket.rides_count;
  $("#ticketQr").src = `/api/tickets/${ticket.id}/qr.svg?ts=${Date.now()}`;
  $("#ticketQr").hidden = false;
  $("#qrEmpty").hidden = true;
}

async function submitReport(event) {
  event.preventDefault();
  $("#message").textContent = "Submitting report...";
  try {
    const payload = await request("/api/reports", { method: "POST", body: new FormData(event.currentTarget) });
    event.currentTarget.reset();
    $("#message").textContent = `Report submitted: ${payload.id.slice(0, 8).toUpperCase()}`;
  } catch (error) {
    $("#message").textContent = error.message;
  }
}

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  const payload = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(payload.detail || "Request failed");
  return payload;
}

function startCountdown() {
  setInterval(() => {
    state.countdownSeconds = state.countdownSeconds <= 0 ? 299 : state.countdownSeconds - 1;
    const m = String(Math.floor(state.countdownSeconds / 60)).padStart(2, "0");
    const s = String(state.countdownSeconds % 60).padStart(2, "0");
    $("#ticketCountdown").textContent = `Valid for ${m}:${s}`;
  }, 1000);
}

function openSheet() {
  $("#aiSheet").classList.add("open");
  $("#sheetOverlay").classList.remove("pointer-events-none", "bg-slate-950/0");
  $("#sheetOverlay").classList.add("bg-slate-950/35");
}

function closeSheet() {
  $("#aiSheet").classList.remove("open");
  $("#sheetOverlay").classList.add("pointer-events-none", "bg-slate-950/0");
  $("#sheetOverlay").classList.remove("bg-slate-950/35");
}

function sendChat(event) {
  event.preventDefault();
  const input = $("#chatInput");
  const value = input.value.trim();
  if (!value) return;
  $("#chatLog").insertAdjacentHTML("beforeend", `<div class="ml-auto max-w-[86%] rounded-3xl rounded-br-md bg-transit-teal px-4 py-3 text-sm font-semibold leading-6 text-white">${escapeHtml(value)}</div>`);
  input.value = "";
  setTimeout(() => {
    $("#chatLog").insertAdjacentHTML("beforeend", `<div class="max-w-[86%] rounded-3xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">For this Bangkok pilot, I recommend ${routeModes[state.mode].title.en}. Your fare remains protected by the 45 THB cap simulation.</div>`);
    $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
  }, 360);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

async function loadExistingTicket() {
  if (!state.activeTicketId) return;
  try {
    renderTicket(await request(`/api/tickets/${state.activeTicketId}`));
  } catch {
    localStorage.removeItem("activeTicketId");
  }
}

fillSelects();
wireEvents();
applyLanguage();
initMap();
startCountdown();
loadExistingTicket();
