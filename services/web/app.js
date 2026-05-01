const reportForm = document.querySelector("#reportForm");
const message = document.querySelector("#message");
const useLocation = document.querySelector("#useLocation");
const ticketForm = document.querySelector("#ticketForm");
const ticketMessage = document.querySelector("#ticketMessage");
const ticketQr = document.querySelector("#ticketQr");
const qrEmpty = document.querySelector("#qrEmpty");
const tapTicket = document.querySelector("#tapTicket");
const tapHistory = document.querySelector("#tapHistory");
const refreshTicket = document.querySelector("#refreshTicket");
const flipTicket = document.querySelector("#flipTicket");
const passCardInner = document.querySelector("#passCardInner");
const simulateRoute = document.querySelector("#simulateRoute");
const routeOrigin = document.querySelector("#routeOrigin");
const routeDestination = document.querySelector("#routeDestination");
const swapRoute = document.querySelector("#swapRoute");
const routeList = document.querySelector("#routeList");
const routeDetail = document.querySelector("#routeDetail");
const routeSummaryStrip = document.querySelector("#routeSummaryStrip");
const recommendGrid = document.querySelector("#recommendGrid");
const copyRoute = document.querySelector("#copyRoute");

let activeTicketId = localStorage.getItem("activeTicketId");
let activeRouteIndex = 0;

const routeOptions = [
  {
    label: "ถูกที่สุด",
    modes: ["BTS", "MRT"],
    fare: 49,
    cappedFare: 45,
    minutes: 20,
    stations: 9,
    note: "ต่อสายที่อโศก/สุขุมวิท เดินสั้น เหมาะสำหรับไปเยาวราชและวัดมังกร",
    steps: [
      { type: "ride", mode: "BTS", color: "green", code: "E3", title: "นานา", subtitle: "ขึ้น BTS Sukhumvit Line", fare: 17 },
      { type: "ride", mode: "BTS", color: "green", code: "E4", title: "อโศก", subtitle: "ลงสถานีอโศกเพื่อเปลี่ยนสาย", fare: 0 },
      { type: "walk", mode: "Walk", color: "gray", code: "5 min", title: "เดิน 5 นาที", subtitle: "เชื่อมต่อสถานี MRT สุขุมวิท", fare: 0 },
      { type: "ride", mode: "MRT", color: "blue", code: "BL22", title: "สุขุมวิท", subtitle: "ผ่านศูนย์ฯ สิริกิติ์, คลองเตย, ลุมพินี, สีลม, สามย่าน, หัวลำโพง", fare: 32 },
      { type: "ride", mode: "MRT", color: "blue", code: "BL29", title: "วัดมังกร", subtitle: "เดินต่อสู่เยาวราชและวัดมังกร", fare: 0 },
    ],
  },
  {
    label: "เร็วที่สุด",
    modes: ["BTS", "MRT"],
    fare: 57,
    cappedFare: 45,
    minutes: 18,
    stations: 10,
    note: "จ่ายจริงถูก cap เหลือ 45 บาท เหมาะเมื่อเวลาสำคัญกว่าเส้นทางชมวิว",
    steps: [
      { type: "ride", mode: "BTS", color: "green", code: "E3", title: "นานา", subtitle: "ขึ้น BTS ไปอโศก", fare: 17 },
      { type: "walk", mode: "Walk", color: "gray", code: "4 min", title: "เชื่อมต่อ MRT", subtitle: "ทางเดินในอาคาร Interchange", fare: 0 },
      { type: "ride", mode: "MRT", color: "blue", code: "BL22", title: "สุขุมวิท", subtitle: "ขบวนถี่ เหมาะช่วงเร่งด่วน", fare: 40 },
      { type: "ride", mode: "MRT", color: "blue", code: "BL29", title: "วัดมังกร", subtitle: "ถึงพื้นที่แลนด์มาร์ก", fare: 0 },
    ],
  },
  {
    label: "เที่ยวสวยสุด",
    modes: ["BTS", "Boat", "Walk"],
    fare: 90,
    cappedFare: 45,
    minutes: 40,
    stations: 17,
    note: "เน้นประสบการณ์นักท่องเที่ยว ล่องเจ้าพระยาและเห็นแลนด์มาร์กริมแม่น้ำ",
    steps: [
      { type: "ride", mode: "BTS", color: "green", code: "E3", title: "นานา", subtitle: "ขึ้น BTS ไปสยามแล้วต่อสายสีลม", fare: 17 },
      { type: "ride", mode: "BTS", color: "green", code: "S6", title: "สะพานตากสิน", subtitle: "ลงเพื่อเชื่อมต่อท่าเรือสาทร", fare: 28 },
      { type: "walk", mode: "Walk", color: "gray", code: "3 min", title: "เดินไปท่าสาทร", subtitle: "ทางเชื่อมสั้น เห็นป้ายชัด", fare: 0 },
      { type: "ride", mode: "Boat", color: "teal", code: "N8", title: "เรือเจ้าพระยา", subtitle: "ผ่าน ICONSIAM, วัดอรุณ, ท่าช้าง", fare: 45 },
      { type: "walk", mode: "Walk", color: "gray", code: "6 min", title: "เดินสู่แลนด์มาร์ก", subtitle: "เหมาะสำหรับถ่ายรูปช่วงเย็น", fare: 0 },
    ],
  },
];

const money = new Intl.NumberFormat("en-US");

routeOrigin.addEventListener("change", updateStationBanner);
routeDestination.addEventListener("change", updateStationBanner);

swapRoute.addEventListener("click", () => {
  const originIndex = routeOrigin.selectedIndex;
  routeOrigin.selectedIndex = Math.min(routeDestination.selectedIndex, routeOrigin.options.length - 1);
  routeDestination.selectedIndex = Math.min(originIndex, routeDestination.options.length - 1);
  updateStationBanner();
  renderRoutes(activeRouteIndex);
});

simulateRoute.addEventListener("click", () => {
  activeRouteIndex = (activeRouteIndex + 1) % routeOptions.length;
  renderRoutes(activeRouteIndex);
});

recommendGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-route-index]");
  if (!card) return;
  activeRouteIndex = Number(card.dataset.routeIndex);
  renderRoutes(activeRouteIndex);
});

copyRoute.addEventListener("click", async () => {
  const route = routeOptions[activeRouteIndex];
  const summary = `${routeOrigin.value} -> ${routeDestination.value}: ${route.modes.join(" + ")}, ${route.minutes} min, fare ${route.fare} THB, capped ${route.cappedFare} THB`;
  await navigator.clipboard?.writeText(summary);
  copyRoute.textContent = "คัดลอกแล้ว";
  setTimeout(() => (copyRoute.textContent = "คัดลอกสรุป"), 1200);
});

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

function renderRoutes(selectedIndex = 0) {
  const selected = routeOptions[selectedIndex];
  document.querySelectorAll(".recommend-card").forEach((card, index) => {
    const route = routeOptions[index];
    card.classList.toggle("active", index === selectedIndex);
    card.innerHTML = `
      <span>${route.label}</span>
      <strong>${route.cappedFare} บาท</strong>
      <small>${route.minutes} นาที · ${route.stations} สถานี</small>
    `;
  });

  routeSummaryStrip.innerHTML = `
    <div><strong>${selected.cappedFare}</strong><span>บาท</span></div>
    <div><strong>~${selected.minutes}</strong><span>นาที</span></div>
    <div><strong>${selected.stations}</strong><span>สถานี</span></div>
  `;

  routeList.innerHTML = routeOptions.map((route, index) => `
    <button class="dense-route ${index === selectedIndex ? "active" : ""}" data-route-index="${index}" type="button">
      <div class="mode-badges">${route.modes.map(modeBadge).join("")}</div>
      <div><b>${route.cappedFare}</b><span>บาท</span></div>
      <div><b>${route.minutes}</b><span>นาที</span></div>
      <div><b>${route.stations}</b><span>สถานี</span></div>
    </button>
  `).join("");

  routeDetail.innerHTML = `
    <div class="route-note">
      <strong>${selected.label}</strong>
      <p>${selected.note}</p>
      <span>Normal fare ${selected.fare} THB · Joint ticket charged ${selected.cappedFare} THB · Saved ${Math.max(0, selected.fare - selected.cappedFare)} THB</span>
    </div>
    <div class="leg-timeline">
      ${selected.steps.map(renderStep).join("")}
    </div>
  `;
}

routeList.addEventListener("click", (event) => {
  const row = event.target.closest("[data-route-index]");
  if (!row) return;
  activeRouteIndex = Number(row.dataset.routeIndex);
  renderRoutes(activeRouteIndex);
});

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
  const origin = routeOrigin.options[routeOrigin.selectedIndex];
  const destination = routeDestination.options[routeDestination.selectedIndex];
  const [originMode, originCode] = (origin.dataset.code || "").split(" ");
  const [destMode, destCode] = (destination.dataset.code || "").split(" ");
  document.querySelector("#originName").textContent = origin.textContent;
  document.querySelector("#destinationName").textContent = destination.textContent;
  document.querySelector(".station-banner div:first-child p").innerHTML = `<b>${originMode}</b> <em>${originCode}</em>`;
  document.querySelector(".station-banner div:last-child p").innerHTML = `<b class="${destMode === "MRT" ? "mrt" : ""}">${destMode}</b> <em>${destCode}</em>`;
}

function modeBadge(mode) {
  return `<span class="mode-logo ${mode.toLowerCase()}">${mode}</span>`;
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

updateStationBanner();
renderRoutes(activeRouteIndex);
if (activeTicketId) loadTicket(activeTicketId);
