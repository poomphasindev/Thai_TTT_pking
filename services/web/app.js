const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const state = {
  lang: localStorage.getItem("lang") || "en",
  mode: "rail",
  placeCategory: "food",
  user: null,
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
    routeDetails: "Step-by-step journey",
    exploreAround: "Explore around destination",
    touristContext: "Tourist context",
    wowFactor: "The wow factor",
    ticketTitle: "3D Holographic Joint Ticket",
    generateTicket: "Issue my Joint Ticket",
    reportTitle: "Report a transit issue",
    reportBody: "Manual-first reporting with category, place, time, vehicle ID, and photo evidence. Vision AI can be added later without changing this flow.",
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
    routeDetails: "ลำดับการเดินทาง",
    exploreAround: "สำรวจรอบจุดหมาย",
    touristContext: "บริบทสำหรับนักท่องเที่ยว",
    wowFactor: "ฟีเจอร์เด่น",
    ticketTitle: "บัตรตั๋วร่วม 3D Holographic",
    generateTicket: "ออกบัตรตั๋วร่วม",
    reportTitle: "แจ้งปัญหาการเดินทาง",
    reportBody: "แจ้งแบบ manual-first เลือกหมวด ระบุสถานที่ เวลา เลขรถ และแนบรูปได้ ส่วน Vision AI เพิ่มต่อได้โดยไม่เปลี่ยน flow",
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
    node: "Tha Tien Pier / MRT Sanam Chai",
    lat: 13.7437,
    lng: 100.4889,
    image: "/assets/landmarks/wat-arun.jpg",
    context: { en: "Riverside temple, best around sunset.", th: "วัดริมแม่น้ำเจ้าพระยา เหมาะช่วงเย็น" },
  },
  {
    id: "grand-palace",
    en: "Grand Palace",
    th: "พระบรมมหาราชวัง",
    node: "MRT Sanam Chai / Pier N9",
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
    node: "Gold Line / Pier CAT",
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
    title: { en: "Rail-first route with gated transfer", th: "เส้นทางหลักด้วยรถไฟฟ้าและต่อระบบ" },
    note: { en: "Best default for tourists: clear stations, short walking, and capped daily billing.", th: "เหมาะสุดสำหรับนักท่องเที่ยว: สถานีชัด เดินน้อย และมีเพดานค่าโดยสารรายวัน" },
    time: 28,
    stops: 8,
    fare: 49,
    total: 45,
    lines: [
      { label: "BTS first segment", fare: 17 },
      { label: "MRT / river connection", fare: 32 },
    ],
    steps: [
      { icon: "1", title: "Start from origin node", th: "เริ่มจากสถานีต้นทาง", detail: "Walk to {originNode}. Keep the Joint Ticket ready before entering the paid area.", detailTh: "เดินไปที่ {originNode} เตรียมบัตรตั๋วร่วมก่อนเข้าสถานี" },
      { icon: "2", title: "Scan QR at first gate", th: "สแกน QR ที่ประตูแรก", detail: "Show the live QR. Backend records operator, station, time, and charged fare.", detailTh: "แสดง QR แบบ live ระบบบันทึกผู้ให้บริการ สถานี เวลา และค่าโดยสารที่ถูกคิด" },
      { icon: "3", title: "Transfer using the same pass", th: "ต่อระบบด้วยบัตรเดิม", detail: "At interchange, keep the same QR. The cap engine prevents charging over 45 THB today.", detailTh: "ตอนเปลี่ยนสายใช้ QR เดิม ระบบ cap จะไม่คิดเกิน 45 บาทต่อวัน" },
      { icon: "4", title: "Arrive near landmark", th: "ถึงสถานีใกล้แลนด์มาร์ก", detail: "Exit at {destNode}, then follow the walking hint to {destination}.", detailTh: "ออกที่ {destNode} แล้วเดินต่อไปยัง {destination}" },
    ],
  },
  bus: {
    title: { en: "Budget route with bus corridor", th: "เส้นทางประหยัดด้วยรถเมล์" },
    note: { en: "Lower fare, but time varies with traffic. Useful when tourists are not in a rush.", th: "ถูกกว่าแต่เวลาแปรผันตามรถติด เหมาะเมื่อไม่รีบ" },
    time: 42,
    stops: 12,
    fare: 24,
    total: 24,
    lines: [
      { label: "Air-conditioned city bus", fare: 24 },
      { label: "Walking connection", fare: 0 },
    ],
    steps: [
      { icon: "1", title: "Walk to verified bus stop", th: "เดินไปป้ายรถเมล์ที่ตรวจสอบแล้ว", detail: "The app points to the stop closest to {originNode}.", detailTh: "แอพชี้ป้ายที่ใกล้ {originNode} ที่สุด" },
      { icon: "2", title: "Board and show QR to staff", th: "ขึ้นรถและแสดง QR", detail: "The conductor can validate the pass or record a manual ticket ID.", detailTh: "กระเป๋ารถสามารถตรวจบัตรหรือบันทึก ticket ID แบบ manual ได้" },
      { icon: "3", title: "Get off near destination cluster", th: "ลงใกล้โซนจุดหมาย", detail: "Use the map pins to walk from the stop to {destination}.", detailTh: "ใช้ pin บนแผนที่เดินจากป้ายไปยัง {destination}" },
    ],
  },
  boat: {
    title: { en: "Scenic rail + Chao Phraya boat", th: "เส้นทางชมวิว รถไฟฟ้า + เรือเจ้าพระยา" },
    note: { en: "Most photogenic for riverside landmarks. The fare cap still keeps the pitch story simple.", th: "เหมาะกับแลนด์มาร์กริมแม่น้ำและการถ่ายรูป โดยยังมีเพดานค่าโดยสารให้เล่า pitch ง่าย" },
    time: 45,
    stops: 7,
    fare: 66,
    total: 45,
    lines: [
      { label: "Rail to river interchange", fare: 45 },
      { label: "Chao Phraya boat segment", fare: 21 },
    ],
    steps: [
      { icon: "1", title: "Ride rail to river interchange", th: "นั่งรถไฟฟ้าไปจุดต่อเรือ", detail: "Use {originNode} to reach Saphan Taksin or Sanam Chai depending on destination.", detailTh: "ใช้ {originNode} ไปจุดต่อเรือ เช่น สะพานตากสินหรือสนามไชยตามจุดหมาย" },
      { icon: "2", title: "Transfer to pier", th: "เดินต่อไปท่าเรือ", detail: "Follow pier signage. The app keeps the same ticket session active.", detailTh: "ตามป้ายไปท่าเรือ แอพยังใช้ session บัตรเดิมอยู่" },
      { icon: "3", title: "Scan with boat operator", th: "สแกนกับผู้ให้บริการเรือ", detail: "Boat fare is added until the 45 THB cap is reached.", detailTh: "ค่าเรือจะถูกคิดรวมจนถึงเพดาน 45 บาท" },
      { icon: "4", title: "Walk to landmark entrance", th: "เดินเข้าจุดหมาย", detail: "Exit at the nearest pier for {destination}.", detailTh: "ขึ้นจากท่าเรือที่ใกล้ {destination} ที่สุด" },
    ],
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

function hydrateStep(template, origin, dest) {
  const title = state.lang === "th" ? template.th : template.title;
  const detail = state.lang === "th" ? template.detailTh : template.detail;
  return {
    title,
    detail: detail
      .replaceAll("{originNode}", origin.node)
      .replaceAll("{destNode}", dest.node)
      .replaceAll("{destination}", localName(dest)),
  };
}

function renderRoute() {
  const mode = routeModes[state.mode];
  const origin = currentOrigin();
  const dest = currentDestination();
  const saved = Math.max(0, mode.fare - mode.total);
  $("#routeTitle").textContent = `${localName(origin)} → ${localName(dest)}`;
  $("#routeNote").textContent = mode.note[state.lang];
  $("#routeTime").textContent = `~${mode.time} ${state.lang === "th" ? "นาที" : "min"}`;
  $("#routeStops").textContent = `${mode.stops} ${state.lang === "th" ? "จุด/สถานี" : "nodes"}`;
  $("#routeSaved").textContent = `${saved} THB`;
  $("#finalFare").textContent = `${mode.total}฿`;
  $("#ticketOrigin").value = origin.en;
  $("#ticketDestination").value = dest.en;

  $("#farePanel").innerHTML = `
    <div class="space-y-3 text-sm font-semibold">
      ${mode.lines.map((line) => `<div class="flex justify-between gap-4"><span>${line.label}</span><span>${line.fare} THB</span></div>`).join("")}
      <div class="border-t border-dashed border-slate-300 pt-3 flex justify-between text-slate-500"><span>Subtotal without policy cap</span><span>${mode.fare} THB</span></div>
      <div class="rounded-2xl bg-amber-100 px-4 py-3 flex justify-between gap-4 font-black text-amber-800"><span>Joint Ticket Cap Applied</span><span>-${saved} THB</span></div>
      <div class="flex items-end justify-between pt-1"><span class="text-base font-black">Total billed today</span><span class="text-3xl font-black text-transit-teal">${mode.total} THB</span></div>
    </div>`;

  $("#routeSteps").innerHTML = mode.steps.map((step, index) => {
    const rendered = hydrateStep(step, origin, dest);
    return `
      <div class="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full ${index === 1 ? "bg-transit-ink text-white" : "bg-transit-mint text-transit-teal"} text-sm font-black">${step.icon}</div>
        <div>
          <p class="font-black">${rendered.title}</p>
          <p class="mt-1 text-sm font-semibold leading-6 text-slate-500">${rendered.detail}</p>
        </div>
      </div>`;
  }).join("");

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
      zoom: 14,
      attributionControl: false,
    });
    state.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    state.map.on("load", () => {
      $("#mapFallback").classList.add("opacity-0");
      renderExplore();
    });
    state.map.on("error", () => $("#mapFallback").classList.remove("opacity-0"));
  } catch {
    $("#mapFallback").classList.remove("opacity-0");
  }
}

async function renderExplore() {
  const dest = currentDestination();
  $("#exploreTitle").textContent = `${localName(dest)} area`;
  $("#mapContext").textContent = dest.context[state.lang];
  $("#mapFallback").src = dest.image;
  updatePlaceChips();

  const fallback = landmarks.filter((place) => place.id !== dest.id).slice(0, 4).map((place) => ({
    id: place.id,
    name: localName(place),
    latitude: place.lat,
    longitude: place.lng,
    kind: place.node,
    source: "Curated Bangkok landmark",
    distance_m: null,
    image: place.image,
  }));
  const places = await loadPlaces(dest, fallback);
  renderPoiCards([{ id: dest.id, name: localName(dest), latitude: dest.lat, longitude: dest.lng, kind: dest.node, source: "Selected destination", image: dest.image }, ...places]);
}

async function loadPlaces(dest, fallback) {
  try {
    const url = `/api/places/nearby?lat=${dest.lat}&lng=${dest.lng}&category=${state.placeCategory}&radius=1200`;
    const places = await request(url);
    return places.length ? places : fallback;
  } catch {
    return fallback;
  }
}

function renderPoiCards(places) {
  $("#poiCarousel").innerHTML = places.map((place, index) => {
    const image = place.image || imageForCategory(state.placeCategory, index);
    const label = index === 0 ? "Destination" : place.source === "OpenStreetMap" ? "OSM verified" : place.source;
    const distance = place.distance_m ? ` · ${place.distance_m}m` : "";
    return `
      <article class="min-w-[250px] overflow-hidden rounded-[1.75rem] bg-white shadow-card">
        <img class="h-36 w-full object-cover" src="${image}" alt="${escapeHtml(place.name)}" />
        <div class="p-4">
          <span class="rounded-full ${index === 0 ? "bg-transit-mint text-transit-teal" : "bg-blue-100 text-transit-blue"} px-3 py-1 text-xs font-black">${label}</span>
          <h3 class="mt-3 text-lg font-black">${escapeHtml(place.name)}</h3>
          <p class="mt-1 text-sm font-semibold text-slate-500">${escapeHtml(place.kind || "POI")}${distance}</p>
          <p class="mt-2 text-xs font-bold text-slate-400">Ratings can be upgraded with Google Places key.</p>
        </div>
      </article>`;
  }).join("");

  if (state.map) {
    state.markers.forEach((marker) => marker.remove());
    state.markers = places.map((place, index) => {
      const el = document.createElement("div");
      el.className = `map-marker ${index === 0 ? "active" : ""}`;
      el.textContent = index === 0 ? "★" : String(index);
      return new maplibregl.Marker({ element: el }).setLngLat([place.longitude, place.latitude]).addTo(state.map);
    });
    const dest = currentDestination();
    state.map.flyTo({ center: [dest.lng, dest.lat], zoom: 14, essential: false });
  }
}

function imageForCategory(category, index) {
  const images = {
    food: ["/assets/landmarks/yaowarat.jpg", "/assets/generated/bangkok-brochure-th-cover.jpg"],
    shopping: ["/assets/generated/bangkok-map-preview.jpg", "/assets/generated/bangkok-brochure-en-cover.jpg"],
    attractions: ["/assets/landmarks/wat-arun.jpg", "/assets/landmarks/grand-palace.jpg"],
    transport: ["/assets/generated/bangkok-map-preview.jpg", "/assets/landmarks/yaowarat.jpg"],
  };
  return images[category][index % images[category].length];
}

function updatePlaceChips() {
  $$(".place-chip").forEach((button) => {
    const active = button.dataset.placeCategory === state.placeCategory;
    button.classList.toggle("bg-transit-ink", active);
    button.classList.toggle("text-white", active);
    button.classList.toggle("bg-slate-100", !active);
    button.classList.toggle("text-slate-600", !active);
  });
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
    $("#fareChevron").classList.add("rotate-180");
    $("#routeSteps").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $$(".mode-btn").forEach((button) => button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    renderRoute();
  }));
  $$(".place-chip").forEach((button) => button.addEventListener("click", () => {
    state.placeCategory = button.dataset.placeCategory;
    renderExplore();
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

  $("#authButton").addEventListener("click", openAuthSheet);
  $("#closeAuthSheet").addEventListener("click", closeSheets);
  $("#authForm").addEventListener("submit", submitAuth);
  $("#logoutBtn").addEventListener("click", logout);
  $("#ticketForm").addEventListener("submit", submitTicket);

  $("#openReportBtn").addEventListener("click", openReportSheet);
  $("#navReportBtn").addEventListener("click", openReportSheet);
  $("#mobileReportBtn").addEventListener("click", openReportSheet);
  $("#closeReportSheet").addEventListener("click", closeSheets);
  $("#reportForm").addEventListener("submit", submitReport);
  $("#useNow").addEventListener("click", () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    $("#incidentTime").value = local.toISOString().slice(0, 16);
  });

  $("#aiFab").addEventListener("click", openAiSheet);
  $("#closeSheet").addEventListener("click", closeSheets);
  $("#sheetOverlay").addEventListener("click", closeSheets);
  $("#chatForm").addEventListener("submit", sendChat);
}

async function loadMe() {
  try {
    state.user = await request("/api/auth/me");
  } catch {
    state.user = null;
  }
  renderAuthState();
}

function renderAuthState() {
  const label = state.user ? state.user.display_name.split(" ")[0] : "Sign in";
  $("#authButton").textContent = label;
  $("#authMessage").textContent = state.user ? `Signed in as ${state.user.email}` : "";
  $("#logoutBtn").classList.toggle("hidden", !state.user);
}

async function submitAuth(event) {
  event.preventDefault();
  $("#authMessage").textContent = "Signing in...";
  try {
    state.user = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())),
    });
    renderAuthState();
    $("#authMessage").textContent = "Ready. You can issue a Joint Ticket now.";
    setTimeout(closeSheets, 450);
  } catch (error) {
    $("#authMessage").textContent = error.message;
  }
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  state.user = null;
  renderAuthState();
}

async function submitTicket(event) {
  event.preventDefault();
  if (!state.user) {
    $("#ticketMessage").textContent = "Sign in first so the ticket has an owner.";
    openAuthSheet();
    return;
  }
  $("#ticketMessage").textContent = "Issuing secure ticket...";
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
    $("#ticketMessage").textContent = "Ticket ready. Tap to show QR to operator.";
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
    const dest = currentDestination();
    event.currentTarget.elements.latitude.value = dest.lat;
    event.currentTarget.elements.longitude.value = dest.lng;
    const payload = await request("/api/reports", { method: "POST", body: new FormData(event.currentTarget) });
    event.currentTarget.reset();
    $("#message").textContent = `Report submitted: ${payload.id.slice(0, 8).toUpperCase()}. Ops can review it in the dashboard.`;
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

function openAuthSheet() {
  openSheet("#authSheet");
}

function openAiSheet() {
  openSheet("#aiSheet");
}

function openReportSheet() {
  openSheet("#reportSheet");
}

function openSheet(selector) {
  closeSheets(false);
  $(selector).classList.add("open");
  $("#sheetOverlay").classList.remove("pointer-events-none", "bg-slate-950/0");
  $("#sheetOverlay").classList.add("bg-slate-950/35");
}

function closeSheets(hideOverlay = true) {
  $$(".bottom-sheet").forEach((sheet) => sheet.classList.remove("open"));
  if (hideOverlay) {
    $("#sheetOverlay").classList.add("pointer-events-none", "bg-slate-950/0");
    $("#sheetOverlay").classList.remove("bg-slate-950/35");
  }
}

function sendChat(event) {
  event.preventDefault();
  const input = $("#chatInput");
  const value = input.value.trim();
  if (!value) return;
  $("#chatLog").insertAdjacentHTML("beforeend", `<div class="ml-auto max-w-[86%] rounded-3xl rounded-br-md bg-transit-teal px-4 py-3 text-sm font-semibold leading-6 text-white">${escapeHtml(value)}</div>`);
  input.value = "";
  setTimeout(() => {
    const mode = routeModes[state.mode];
    $("#chatLog").insertAdjacentHTML("beforeend", `<div class="max-w-[86%] rounded-3xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">For this Bangkok pilot, I recommend ${mode.title.en}. Start at ${currentOrigin().node}, keep the Joint Ticket QR ready, and your daily billing stays within the 45 THB cap simulation.</div>`);
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
loadMe();
loadExistingTicket();
