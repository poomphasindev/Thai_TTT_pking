const reportForm = document.querySelector("#reportForm");
const message = document.querySelector("#message");
const useLocation = document.querySelector("#useLocation");
const useNow = document.querySelector("#useNow");
const incidentTime = document.querySelector("#incidentTime");
const ticketForm = document.querySelector("#ticketForm");
const ticketMessage = document.querySelector("#ticketMessage");
const ticketQr = document.querySelector("#ticketQr");
const qrEmpty = document.querySelector("#qrEmpty");
const tapTicket = document.querySelector("#tapTicket");
const tapHistory = document.querySelector("#tapHistory");
const refreshTicket = document.querySelector("#refreshTicket");
const flipTicket = document.querySelector("#flipTicket");
const simulateRoute = document.querySelector("#simulateRoute");
const routeOrigin = document.querySelector("#routeOrigin");
const routeDestination = document.querySelector("#routeDestination");
const swapRoute = document.querySelector("#swapRoute");
const routeList = document.querySelector("#routeList");
const routeDetail = document.querySelector("#routeDetail");
const routeSummaryStrip = document.querySelector("#routeSummaryStrip");
const recommendGrid = document.querySelector("#recommendGrid");
const copyRoute = document.querySelector("#copyRoute");
const languageToggle = document.querySelector("#languageToggle");
const poiCarousel = document.querySelector("#poiCarousel");

let activeTicketId = localStorage.getItem("activeTicketId");
let activeRouteIndex = 0;
let lang = localStorage.getItem("lang") || "th";
let map;
let mapMarkers = [];

const i18n = {
  th: {
    brand_subtitle: "ระบบเดินทางท่องเที่ยวกรุงเทพฯ",
    nav_route: "เส้นทาง",
    nav_explore: "สำรวจ",
    nav_ticket: "บัตร",
    nav_report: "แจ้งปัญหา",
    hero_badge: "โครงการนำร่องกรุงเทพฯ",
    hero_cap_note: "จำลองตั๋วร่วมเพดานค่าโดยสาร",
    hero_eyebrow: "Tourism-grade transit OS",
    hero_title: "เที่ยวกรุงเทพฯ แบบรู้ทาง รู้ราคา และใช้บัตรเดียวจบ",
    hero_body: "เส้นทางแบบยึดแลนด์มาร์ก, POI กรุงเทพฯ ที่คัดมาแล้ว, จำลอง fare cap และระบบแจ้งปัญหาแบบ manual-first สำหรับนักท่องเที่ยว",
    hero_cta_route: "ค้นหาเส้นทาง",
    hero_cta_ticket: "เปิดบัตรเดินทาง",
    metric_landmarks: "แลนด์มาร์กกรุงเทพฯ",
    metric_modes: "โหมดเดินทาง",
    metric_pass: "บัตรนักท่องเที่ยว",
    back: "‹ กลับ",
    smart_route: "Smart route",
    route_title: "ผลการค้นหาเส้นทาง",
    from: "จาก",
    to: "ถึง",
    calculate_route: "คำนวณเส้นทาง",
    recommended: "เส้นทางแนะนำ",
    route_disclaimer: "ราคาและเวลาเป็น simulation ที่สมเหตุสมผลสำหรับ pitch",
    all_routes: "เส้นทางทั้งหมด",
    time_note: "* เวลาโดยประมาณ ไม่รวมเวลารอรถ/เรือ",
    route_detail: "รายละเอียดเส้นทาง",
    copy_summary: "คัดลอกสรุป",
    explore_eyebrow: "สำรวจรอบจุดหมาย",
    map_legend: "แผนที่จริงพร้อม fallback จาก brochure",
    ticket_eyebrow: "Digital joint ticket",
    ticket_title: "บัตรเดินทาง QR แบบแตะใช้จริง",
    passenger_name: "ชื่อผู้โดยสาร",
    origin: "ต้นทาง",
    destination: "ปลายทาง",
    issue_pass: "ออกบัตรตั๋วร่วม",
    show_qr: "แตะเพื่อแสดง QR",
    qr_instruction: "แสดง QR นี้ที่ประตูรถไฟฟ้า รถเมล์ หรือเรือที่รองรับ",
    tap_title: "แตะบัตรและคุมค่าโดยสารไม่เกิน 45 บาท",
    report_eyebrow: "Manual-first incident report",
    report_title: "แจ้งปัญหาการเดินทาง",
    report_badge: "ไม่ต้องพึ่ง AI",
  },
  en: {
    brand_subtitle: "Bangkok tourist mobility",
    nav_route: "Route",
    nav_explore: "Explore",
    nav_ticket: "Pass",
    nav_report: "Report",
    hero_badge: "Bangkok-only pilot",
    hero_cap_note: "Joint Ticket cap simulation",
    hero_eyebrow: "Tourism-grade transit OS",
    hero_title: "Bangkok trips with clear routes, clear fares, one smart pass.",
    hero_body: "Landmark-first routing, curated Bangkok POIs, fare-cap simulation, and manual-first incident reporting for tourists.",
    hero_cta_route: "Plan route",
    hero_cta_ticket: "Open travel pass",
    metric_landmarks: "Bangkok landmarks",
    metric_modes: "Transit modes",
    metric_pass: "Tourist pass",
    back: "‹ Back",
    smart_route: "Smart route",
    route_title: "Route search results",
    from: "From",
    to: "To",
    calculate_route: "Calculate route",
    recommended: "Recommended routes",
    route_disclaimer: "Pitch-safe fare and time simulations",
    all_routes: "All routes",
    time_note: "* Estimated travel time excludes waiting time",
    route_detail: "Route detail",
    copy_summary: "Copy summary",
    explore_eyebrow: "Explore around destination",
    map_legend: "Live map with brochure fallback",
    ticket_eyebrow: "Digital joint ticket",
    ticket_title: "Tap-ready QR travel pass",
    passenger_name: "Passenger name",
    origin: "Origin",
    destination: "Destination",
    issue_pass: "Issue Joint Ticket",
    show_qr: "Tap to show QR",
    qr_instruction: "Show this QR at supported rail, bus, or boat gates.",
    tap_title: "Tap the card and cap total travel cost at 45 THB",
    report_eyebrow: "Manual-first incident report",
    report_title: "Report a transit issue",
    report_badge: "No AI required",
  },
};

const landmarks = [
  {
    id: "siam",
    th: "สยาม",
    en: "Siam",
    category: "Shopping / interchange",
    lat: 13.7466,
    lng: 100.5347,
    node: "BTS CEN",
    modes: ["BTS", "Walk"],
    tip_th: "จุดต่อสายหลัก ใกล้ BACC, MBK และสยามสแควร์",
    tip_en: "Major interchange near BACC, MBK, and Siam Square.",
  },
  {
    id: "wat-arun",
    th: "วัดอรุณ",
    en: "Wat Arun",
    category: "Temple",
    lat: 13.7437,
    lng: 100.4889,
    node: "Pier N8",
    modes: ["MRT", "Boat", "Walk"],
    tip_th: "เหมาะช่วงเย็น ต่อ MRT สนามไชยแล้วข้ามเรือ",
    tip_en: "Best near sunset. Use MRT Sanam Chai plus ferry/boat.",
  },
  {
    id: "grand-palace",
    th: "พระบรมมหาราชวัง",
    en: "Grand Palace",
    category: "Royal landmark",
    lat: 13.7500,
    lng: 100.4913,
    node: "Pier N9",
    modes: ["MRT", "Boat", "Walk"],
    tip_th: "ควรตรวจเวลาเปิดและ dress code ก่อนเดินทาง",
    tip_en: "Check opening hours and dress code before visiting.",
  },
  {
    id: "wat-mangkon",
    th: "วัดมังกร / เยาวราช",
    en: "Wat Mangkon / Yaowarat",
    category: "Temple / street food",
    lat: 13.7422,
    lng: 100.5090,
    node: "MRT BL29",
    modes: ["BTS", "MRT", "Walk"],
    tip_th: "เหมาะช่วงเย็นสำหรับ street food และ heritage walk",
    tip_en: "Best in the evening for street food and heritage walking.",
  },
  {
    id: "iconsiam",
    th: "ไอคอนสยาม",
    en: "ICONSIAM",
    category: "Shopping / riverfront",
    lat: 13.7266,
    lng: 100.5106,
    node: "Pier CAT",
    modes: ["BTS", "Boat"],
    tip_th: "ใช้ BTS สะพานตากสินแล้วต่อ shuttle boat",
    tip_en: "Use BTS Saphan Taksin and connect to shuttle boat.",
  },
  {
    id: "chatuchak",
    th: "ตลาดนัดจตุจักร",
    en: "Chatuchak Weekend Market",
    category: "Market",
    lat: 13.7996,
    lng: 100.5501,
    node: "BTS N8 / MRT BL13",
    modes: ["BTS", "MRT", "Walk"],
    tip_th: "เหมาะวันเสาร์-อาทิตย์ ระวังอากาศร้อนและคนหนาแน่น",
    tip_en: "Best on weekends. Expect heat and crowds.",
  },
  {
    id: "bacc",
    th: "หอศิลป์กรุงเทพฯ",
    en: "Bangkok Art and Culture Centre",
    category: "Art",
    lat: 13.7465,
    lng: 100.5300,
    node: "BTS W1",
    modes: ["BTS", "Walk"],
    tip_th: "เดินจาก BTS สนามกีฬาแห่งชาติได้สะดวก",
    tip_en: "Easy walk from BTS National Stadium.",
  },
  {
    id: "khaosan",
    th: "ถนนข้าวสาร",
    en: "Khao San Road",
    category: "Nightlife",
    lat: 13.7590,
    lng: 100.4976,
    node: "Bus / Boat",
    modes: ["Boat", "Bus", "Walk"],
    tip_th: "เหมาะใช้เรือไปท่าพระอาทิตย์แล้วเดินต่อ",
    tip_en: "Use boat to Phra Arthit Pier, then walk.",
  },
];

const routeTemplates = [
  {
    label: { th: "ถูกที่สุด", en: "Cheapest" },
    modes: ["BTS", "MRT"],
    fare: 49,
    cappedFare: 45,
    minutes: 20,
    stations: 9,
    note: {
      th: "ต่อ BTS กับ MRT หนึ่งครั้ง เหมาะกับนักท่องเที่ยวที่ต้องการคุมค่าใช้จ่ายและเดินน้อย",
      en: "One BTS to MRT transfer. Good for tourists who want low cost and minimal walking.",
    },
  },
  {
    label: { th: "เร็วที่สุด", en: "Fastest" },
    modes: ["BTS", "MRT", "Walk"],
    fare: 57,
    cappedFare: 45,
    minutes: 18,
    stations: 10,
    note: {
      th: "ใช้ระบบรางเป็นหลัก ค่าโดยสารจริงถูกจำลองให้ cap ที่ 45 บาท",
      en: "Rail-heavy route. Simulated final charge is capped at 45 THB.",
    },
  },
  {
    label: { th: "เที่ยวสวยสุด", en: "Most scenic" },
    modes: ["BTS", "Boat", "Walk"],
    fare: 90,
    cappedFare: 45,
    minutes: 42,
    stations: 7,
    note: {
      th: "เหมาะกับแลนด์มาร์กริมแม่น้ำ เห็นวิวเจ้าพระยาและจุดถ่ายรูป",
      en: "Best for river landmarks with Chao Phraya views and photo stops.",
    },
  },
];

const poiImages = {
  "wat-arun": "/assets/wat-arun-hero.jpg",
  "grand-palace": "/assets/generated/bangkok-brochure-en-cover.jpg",
  "wat-mangkon": "/assets/generated/bangkok-brochure-th-cover.jpg",
  iconsiam: "/assets/generated/bangkok-map-preview.jpg",
  siam: "/assets/generated/bangkok-brochure-en-cover.jpg",
  chatuchak: "/assets/generated/bangkok-brochure-th-cover.jpg",
  bacc: "/assets/generated/bangkok-brochure-en-cover.jpg",
  khaosan: "/assets/generated/bangkok-map-preview.jpg",
};

const money = new Intl.NumberFormat("en-US");

function t(key) {
  return i18n[lang][key] || i18n.en[key] || key;
}

function applyI18n() {
  document.documentElement.lang = lang;
  languageToggle.textContent = lang === "th" ? "EN" : "TH";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  populateLandmarkSelects();
  renderRoutes(activeRouteIndex);
  renderExplore();
}

languageToggle.addEventListener("click", () => {
  lang = lang === "th" ? "en" : "th";
  localStorage.setItem("lang", lang);
  applyI18n();
});

function populateLandmarkSelects() {
  const oldOrigin = routeOrigin.value || "siam";
  const oldDestination = routeDestination.value || "wat-arun";
  const options = landmarks.map((place) => `<option value="${place.id}">${place[lang]} · ${place.node}</option>`).join("");
  routeOrigin.innerHTML = options;
  routeDestination.innerHTML = options;
  routeOrigin.value = landmarks.some((p) => p.id === oldOrigin) ? oldOrigin : "siam";
  routeDestination.value = landmarks.some((p) => p.id === oldDestination) ? oldDestination : "wat-arun";
  updateStationBanner();
}

routeOrigin.addEventListener("change", () => {
  updateStationBanner();
  renderRoutes(activeRouteIndex);
});

routeDestination.addEventListener("change", () => {
  updateStationBanner();
  renderRoutes(activeRouteIndex);
  renderExplore();
});

swapRoute.addEventListener("click", () => {
  const origin = routeOrigin.value;
  routeOrigin.value = routeDestination.value;
  routeDestination.value = origin;
  updateStationBanner();
  renderRoutes(activeRouteIndex);
  renderExplore();
});

simulateRoute.addEventListener("click", () => {
  activeRouteIndex = (activeRouteIndex + 1) % routeTemplates.length;
  renderRoutes(activeRouteIndex);
});

recommendGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-route-index]");
  if (!card) return;
  activeRouteIndex = Number(card.dataset.routeIndex);
  renderRoutes(activeRouteIndex);
});

routeList.addEventListener("click", (event) => {
  const row = event.target.closest("[data-route-index]");
  if (!row) return;
  activeRouteIndex = Number(row.dataset.routeIndex);
  renderRoutes(activeRouteIndex);
});

copyRoute.addEventListener("click", async () => {
  const origin = selectedOrigin();
  const dest = selectedDestination();
  const route = routeTemplates[activeRouteIndex];
  const summary = `${origin.en} -> ${dest.en}: ${route.modes.join(" + ")}, ${route.minutes} min, ${route.cappedFare} THB capped fare`;
  await navigator.clipboard?.writeText(summary);
  copyRoute.textContent = lang === "th" ? "คัดลอกแล้ว" : "Copied";
  setTimeout(() => (copyRoute.textContent = t("copy_summary")), 1200);
});

function selectedOrigin() {
  return landmarks.find((place) => place.id === routeOrigin.value) || landmarks[0];
}

function selectedDestination() {
  return landmarks.find((place) => place.id === routeDestination.value) || landmarks[1];
}

function renderRoutes(selectedIndex = 0) {
  const selected = routeTemplates[selectedIndex];
  const origin = selectedOrigin();
  const dest = selectedDestination();

  recommendGrid.innerHTML = routeTemplates.map((route, index) => `
    <button class="recommend-card ${index === selectedIndex ? "active" : ""}" data-route-index="${index}" type="button">
      <span>${route.label[lang]}</span>
      <strong>${route.cappedFare} ${lang === "th" ? "บาท" : "THB"}</strong>
      <small>${route.minutes} ${lang === "th" ? "นาที" : "min"} · ${route.stations} ${lang === "th" ? "สถานี" : "stops"}</small>
    </button>
  `).join("");

  routeSummaryStrip.innerHTML = `
    <div><strong>${selected.cappedFare}</strong><span>${lang === "th" ? "บาท" : "THB"}</span></div>
    <div><strong>~${selected.minutes}</strong><span>${lang === "th" ? "นาที" : "min"}</span></div>
    <div><strong>${selected.stations}</strong><span>${lang === "th" ? "สถานี" : "stops"}</span></div>
  `;

  routeList.innerHTML = routeTemplates.map((route, index) => `
    <button class="dense-route ${index === selectedIndex ? "active" : ""}" data-route-index="${index}" type="button">
      <div class="mode-badges">${route.modes.map(modeBadge).join("")}</div>
      <div><b>${route.cappedFare}</b><span>${lang === "th" ? "บาท" : "THB"}</span></div>
      <div><b>${route.minutes}</b><span>${lang === "th" ? "นาที" : "min"}</span></div>
      <div><b>${route.stations}</b><span>${lang === "th" ? "สถานี" : "stops"}</span></div>
    </button>
  `).join("");

  const steps = buildRouteSteps(origin, dest, selected);
  routeDetail.innerHTML = `
    <div class="route-note">
      <strong>${selected.label[lang]}: ${origin[lang]} → ${dest[lang]}</strong>
      <p>${selected.note[lang]}</p>
      <span>Normal fare ${selected.fare} THB · Joint Ticket charged ${selected.cappedFare} THB · Saved ${Math.max(0, selected.fare - selected.cappedFare)} THB</span>
    </div>
    <div class="leg-timeline">
      ${steps.map(renderStep).join("")}
    </div>
  `;

  document.querySelector("#ticketOriginInput").value = origin.en;
  document.querySelector("#ticketDestinationInput").value = dest.en;
}

function buildRouteSteps(origin, dest, route) {
  const scenic = route.modes.includes("Boat");
  if (origin.id === dest.id) {
    return [{ type: "walk", mode: "Walk", color: "gray", code: "0 min", title: origin[lang], subtitle: lang === "th" ? "คุณอยู่ที่จุดหมายแล้ว" : "You are already at the destination.", fare: 0 }];
  }

  if (scenic) {
    return [
      { type: "ride", mode: "BTS", color: "green", code: origin.node.split(" ").at(-1), title: origin[lang], subtitle: lang === "th" ? "ขึ้นระบบรางไปยังสะพานตากสิน" : "Take rail toward Saphan Taksin.", fare: 28 },
      { type: "walk", mode: "Walk", color: "gray", code: "3 min", title: lang === "th" ? "ท่าสาทร" : "Sathorn Pier", subtitle: lang === "th" ? "เดินเชื่อมต่อท่าเรือ" : "Short walk to the pier.", fare: 0 },
      { type: "ride", mode: "Boat", color: "teal", code: dest.node.split(" ").at(-1), title: dest[lang], subtitle: dest.tip_en && lang === "en" ? dest.tip_en : dest.tip_th, fare: route.fare - 28 },
    ];
  }

  return [
    { type: "ride", mode: "BTS", color: "green", code: origin.node.split(" ").at(-1), title: origin[lang], subtitle: lang === "th" ? "เริ่มจากสถานีที่ใกล้ต้นทางที่สุด" : "Start from the nearest origin station.", fare: 17 },
    { type: "walk", mode: "Walk", color: "gray", code: "4-6 min", title: lang === "th" ? "เปลี่ยนสาย" : "Transfer", subtitle: lang === "th" ? "เดินตามป้ายเชื่อมต่อโดยไม่ออกนอกระบบ" : "Follow transfer signs without leaving the transit area.", fare: 0 },
    { type: "ride", mode: "MRT", color: "blue", code: dest.node.split(" ").at(-1), title: dest[lang], subtitle: dest.tip_en && lang === "en" ? dest.tip_en : dest.tip_th, fare: route.fare - 17 },
  ];
}

function renderStep(step) {
  const fare = step.fare > 0 ? `<strong class="leg-fare">฿ ${step.fare}</strong>` : "";
  return `
    <article class="leg ${step.type}">
      <div class="leg-rail ${step.color}"><span></span></div>
      <div class="leg-main">
        <div class="leg-row">
          <span class="mode-pill ${step.color}">${step.mode}</span>
          <span class="station-code">${step.code}</span>
          <h4>${escapeHtml(step.title)}</h4>
          ${fare}
        </div>
        <p>${escapeHtml(step.subtitle)}</p>
      </div>
    </article>
  `;
}

function updateStationBanner() {
  const origin = selectedOrigin();
  const dest = selectedDestination();
  const [originMode, originCode] = splitNode(origin.node);
  const [destMode, destCode] = splitNode(dest.node);
  document.querySelector("#originName").textContent = origin[lang];
  document.querySelector("#destinationName").textContent = dest[lang];
  document.querySelector("#originNode").innerHTML = `<b class="${nodeClass(originMode)}">${originMode}</b> <em>${originCode}</em>`;
  document.querySelector("#destinationNode").innerHTML = `<b class="${nodeClass(destMode)}">${destMode}</b> <em>${destCode}</em>`;
}

function splitNode(node) {
  const parts = node.split(" ");
  return [parts[0], parts.slice(1).join(" ") || "-"];
}

function nodeClass(mode) {
  if (mode === "MRT") return "mrt";
  if (mode === "Pier") return "boat";
  return "";
}

function modeBadge(mode) {
  return `<span class="mode-logo ${mode.toLowerCase()}">${mode}</span>`;
}

function renderExplore() {
  const dest = selectedDestination();
  document.querySelector("#exploreTitle").textContent = `${dest[lang]} area`;
  document.querySelector("#mapFocus").textContent = `${dest.lat.toFixed(4)}, ${dest.lng.toFixed(4)}`;

  const nearby = [dest, ...landmarks.filter((place) => place.id !== dest.id).slice(0, 5)];
  poiCarousel.innerHTML = nearby.map((place, index) => `
    <article class="poi-card">
      <img src="${poiImages[place.id] || "/assets/generated/bangkok-brochure-en-cover.jpg"}" alt="${escapeHtml(place.en)}" />
      <div>
        <span>${index === 0 ? "Destination" : "Nearby"}</span>
        <h3>${escapeHtml(place[lang])}</h3>
        <p>${escapeHtml(place.category)} · ${place.node}</p>
      </div>
    </article>
  `).join("");

  updateMap(dest, nearby);
}

function initMap() {
  if (!window.maplibregl) {
    document.querySelector(".map-shell").classList.add("map-offline");
    return;
  }
  const dest = selectedDestination();
  try {
    map = new maplibregl.Map({
      container: "map",
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [dest.lng, dest.lat],
      zoom: 13.4,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => renderExplore());
    map.on("error", () => document.querySelector(".map-shell").classList.add("map-offline"));
  } catch {
    document.querySelector(".map-shell").classList.add("map-offline");
  }
}

function updateMap(dest, places) {
  if (!map) return;
  mapMarkers.forEach((marker) => marker.remove());
  mapMarkers = places.map((place, index) => {
    const el = document.createElement("div");
    el.className = `map-marker ${index === 0 ? "active" : ""}`;
    el.textContent = index === 0 ? "★" : "•";
    return new maplibregl.Marker({ element: el }).setLngLat([place.lng, place.lat]).addTo(map);
  });
  map.flyTo({ center: [dest.lng, dest.lat], zoom: 14, essential: false });
}

useLocation.addEventListener("click", () => {
  if (!navigator.geolocation) {
    message.textContent = "Geolocation is not supported by this browser.";
    return;
  }
  message.textContent = "Requesting location...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      reportForm.latitude.value = pos.coords.latitude.toFixed(6);
      reportForm.longitude.value = pos.coords.longitude.toFixed(6);
      message.textContent = "Location updated.";
    },
    () => {
      message.textContent = "Could not read location. You can enter it manually.";
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
});

useNow.addEventListener("click", () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  incidentTime.value = local.toISOString().slice(0, 16);
});

ticketForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  ticketMessage.textContent = "Generating ticket...";

  const formData = new FormData(ticketForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const ticket = await request("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    activeTicketId = ticket.id;
    localStorage.setItem("activeTicketId", ticket.id);
    ticketMessage.textContent = "Ticket ready. Tap card to show QR.";
    renderTicket(ticket);
    await loadTaps(ticket.id);
  } catch (error) {
    ticketMessage.textContent = error.message;
  }
});

refreshTicket.addEventListener("click", async () => {
  if (!activeTicketId) {
    ticketMessage.textContent = "No active ticket yet.";
    return;
  }
  await loadTicket(activeTicketId);
});

flipTicket.addEventListener("click", () => {
  document.querySelector("#ticketCard").classList.toggle("is-flipped");
});

tapTicket.addEventListener("click", async () => {
  if (!activeTicketId) {
    ticketMessage.textContent = "Generate a ticket first.";
    return;
  }

  const payload = {
    mode: document.querySelector("#tapMode").value,
    station_name: document.querySelector("#tapStation").value,
    fare_thb: Number(document.querySelector("#tapFare").value),
  };

  try {
    const result = await request(`/api/tickets/${activeTicketId}/tap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    renderTicket(result.ticket);
    await loadTaps(activeTicketId);
    ticketMessage.textContent = result.saved_thb > 0
      ? `Fare capped. Saved ${result.saved_thb} THB on this tap.`
      : "Tap recorded.";
  } catch (error) {
    ticketMessage.textContent = error.message;
  }
});

reportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "Submitting report...";

  try {
    const payload = await request("/api/reports", {
      method: "POST",
      body: new FormData(reportForm),
    });

    reportForm.reset();
    reportForm.latitude.value = "13.7563";
    reportForm.longitude.value = "100.5018";
    message.textContent = `Report submitted: ${payload.id.slice(0, 8).toUpperCase()}`;
  } catch (error) {
    message.textContent = error.message;
  }
});

async function loadTicket(ticketId) {
  try {
    const ticket = await request(`/api/tickets/${ticketId}`);
    renderTicket(ticket);
    await loadTaps(ticket.id);
  } catch {
    localStorage.removeItem("activeTicketId");
    activeTicketId = null;
  }
}

async function loadTaps(ticketId) {
  const taps = await request(`/api/tickets/${ticketId}/taps`);
  tapHistory.innerHTML = taps.length
    ? taps.map((tap) => `
      <div class="timeline-item ticket-tap">
        <span>${tap.mode}</span>
        <strong>${escapeHtml(tap.station_name)}</strong>
        <small>Fare ${tap.fare_thb} THB, charged ${tap.charged_thb} THB</small>
      </div>
    `).join("")
    : "<p class='message'>No taps yet. Try the operator simulation.</p>";
}

function renderTicket(ticket) {
  document.querySelector("#ticketStatus").textContent = ticket.status;
  document.querySelector("#ticketHolder").textContent = ticket.holder_name;
  document.querySelector("#ticketUsed").textContent = money.format(ticket.accumulated_fare_thb);
  document.querySelector("#ticketRides").textContent = ticket.rides_count;
  document.querySelector("#ticketValid").textContent = new Date(ticket.valid_until).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  document.querySelector("#passOrigin").textContent = ticket.origin;
  document.querySelector("#passDestination").textContent = ticket.destination;

  ticketQr.src = `/api/tickets/${ticket.id}/qr.svg?ts=${Date.now()}`;
  ticketQr.hidden = false;
  qrEmpty.hidden = true;
}

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.detail || "Request failed");
  return payload;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

applyI18n();
initMap();
if (activeTicketId) loadTicket(activeTicketId);
