const list = document.querySelector("#reportList");
const detail = document.querySelector("#reportDetail");
const ticketList = document.querySelector("#ticketList");
const statusFilter = document.querySelector("#statusFilter");
const categoryFilter = document.querySelector("#categoryFilter");
const refresh = document.querySelector("#refresh");
const walletTopupForm = document.querySelector("#walletTopupForm");
const walletAdminMessage = document.querySelector("#walletAdminMessage");
const cityInsightList = document.querySelector("#cityInsightList");

let cachedReports = [];
let cachedTickets = [];
let selectedReportId = null;

const labels = {
  qr_scan_failed: "QR scan failed",
  wrong_vehicle_guidance: "Wrong vehicle guidance",
  missed_transfer: "Missed transfer",
  service_delay: "Service delay",
  vehicle_crowding: "Crowding / unsafe boarding",
  fare_charge_dispute: "Fare charge dispute",
  staff_validation_issue: "Staff validation issue",
  app_route_mismatch: "App route mismatch",
  accessibility_issue: "Accessibility issue",
  taxi_refusal: "Taxi refusal",
  overpricing: "Overpricing",
  broken_pavement: "Broken pavement",
  unsafe_crossing: "Unsafe crossing",
  unclear_signage: "Unclear signage",
  crowding: "Crowding",
  harassment: "Harassment",
  lost_property: "Lost property",
  other: "Other",
};

const mockCityInsights = [
  {
    label: "Top OD pair",
    value: "Siam → Wat Arun",
    metric: "38% of demo journeys",
    action: "Add clearer MRT Sanam Chai + Tha Tien pier guidance.",
  },
  {
    label: "Missed transfer cluster",
    value: "Saphan Taksin / Sathorn Pier",
    metric: "14 re-plan events",
    action: "Show Exit 2, pier photo, and boat direction before arrival.",
  },
  {
    label: "QR failure hotspot",
    value: "Pier validator queue",
    metric: "8 scan-failed reports",
    action: "Deploy staff scanner fallback and offline QR validation.",
  },
  {
    label: "Feeder gap",
    value: "Tha Tien → Grand Palace",
    metric: "11 long-walk recoveries",
    action: "Recommend short EV feeder during hot/rainy time windows.",
  },
  {
    label: "Tourist safety signal",
    value: "Yaowarat evening crowding",
    metric: "High after 18:30",
    action: "Suggest MRT Wat Mangkon exits and less crowded return route.",
  },
];

async function loadAll() {
  const [reports, tickets] = await Promise.all([loadReports(), loadTickets()]);
  cachedReports = reports;
  cachedTickets = tickets;
  renderStats(reports, tickets);
  renderCityInsights(reports, tickets);
  if (selectedReportId) renderDetail(reports.find((report) => report.id === selectedReportId));
}

async function loadReports() {
  list.innerHTML = "<p class='message'>Loading reports...</p>";
  const params = new URLSearchParams();
  if (statusFilter.value) params.set("status", statusFilter.value);
  if (categoryFilter.value) params.set("category", categoryFilter.value);

  const res = await fetch(`/api/reports?${params}`);
  const reports = await res.json();
  if (!res.ok) {
    list.innerHTML = `<p class='message'>${reports.detail || "Could not load reports."}</p>`;
    return [];
  }

  list.innerHTML = reports.length
    ? reports.map(renderReport).join("")
    : "<p class='message'>No reports yet.</p>";
  return reports;
}

async function loadTickets() {
  ticketList.innerHTML = "<p class='message'>Loading tickets...</p>";
  const res = await fetch("/api/tickets");
  const tickets = await res.json();
  if (!res.ok) {
    ticketList.innerHTML = `<p class='message'>${tickets.detail || "Could not load tickets."}</p>`;
    return [];
  }

  ticketList.innerHTML = Array.isArray(tickets) && tickets.length
    ? tickets.map(renderTicket).join("")
    : "<p class='message'>No tickets yet.</p>";
  return Array.isArray(tickets) ? tickets : [tickets].filter(Boolean);
}

function renderStats(reports, tickets) {
  const open = reports.filter((report) => ["submitted", "reviewing"].includes(report.status)).length;
  const high = reports.filter((report) => report.severity === "high").length;
  const active = tickets.filter((ticket) => ticket.status === "active").length;
  const protectedFare = tickets.reduce((sum, ticket) => sum + Math.max(0, ticket.accumulated_fare_thb), 0);

  document.querySelector("#openReports").textContent = open;
  document.querySelector("#highSeverity").textContent = high;
  document.querySelector("#activeTickets").textContent = active;
  document.querySelector("#fareProtected").textContent = `${protectedFare} THB`;
}

function renderCityInsights(reports, tickets) {
  const dynamicSignals = [
    {
      label: "Live report queue",
      value: `${reports.filter((report) => ["submitted", "reviewing"].includes(report.status)).length} unresolved cases`,
      metric: `${reports.filter((report) => report.category === "wrong_vehicle_guidance" || report.category === "missed_transfer").length} route guidance issues`,
      action: "Use these cases to tune transfer instructions and AI recovery prompts.",
    },
    {
      label: "Fare cap usage",
      value: `${tickets.reduce((sum, ticket) => sum + ticket.accumulated_fare_thb, 0)} THB validated`,
      metric: `${tickets.filter((ticket) => ticket.accumulated_fare_thb >= 45).length} cap-protected tickets`,
      action: "Shows how much duplicate-entry friction the fair-fare layer absorbs.",
    },
  ];
  cityInsightList.innerHTML = [...dynamicSignals, ...mockCityInsights].map((item) => `
    <article class="intel-card">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      <small>${escapeHtml(item.metric)}</small>
      <p>${escapeHtml(item.action)}</p>
    </article>
  `).join("");
}

function renderReport(report) {
  const image = report.image_url
    ? `<img class="thumb" src="${report.image_url}" alt="Report evidence" />`
    : `<div class="thumb empty">No image</div>`;

  return `
    <article class="ops-report ${report.id === selectedReportId ? "active" : ""}" data-id="${report.id}">
      ${image}
      <div class="ops-report-body">
        <div class="report-head">
          <div>
            <p class="chip">${labels[report.category] || report.category}</p>
            <h3>${escapeHtml(report.description)}</h3>
          </div>
          <select data-id="${report.id}" class="status-select">
            ${["submitted", "reviewing", "resolved", "rejected"].map((status) => `
              <option value="${status}" ${report.status === status ? "selected" : ""}>${status}</option>
            `).join("")}
          </select>
        </div>
        <div class="ops-meta-grid">
          <span>${report.transport_mode || "unknown mode"}</span>
          <span>${report.vehicle_id || "no vehicle ID"}</span>
          <span>${report.severity || "medium"}</span>
          <span>${new Date(report.created_at).toLocaleString()}</span>
        </div>
        <div class="actions">
          <button class="button secondary compact inspect" data-id="${report.id}">Inspect</button>
          <a class="button secondary compact" target="_blank" href="https://www.google.com/maps?q=${report.latitude},${report.longitude}">Map</a>
          <button class="button danger compact delete" data-id="${report.id}">Delete</button>
        </div>
      </div>
    </article>
  `;
}

function renderDetail(report) {
  if (!report) {
    detail.innerHTML = "<p class='detail-empty'>Select a report to inspect evidence, vehicle ID, location, and timeline.</p>";
    return;
  }
  selectedReportId = report.id;
  detail.innerHTML = `
    <div class="detail-case">
      ${report.image_url ? `<img src="${report.image_url}" alt="Evidence" />` : `<div class="thumb empty">No image</div>`}
      <p class="chip">${labels[report.category] || report.category}</p>
      <h3>${escapeHtml(report.description)}</h3>
      <dl>
        <div><dt>Status</dt><dd>${report.status}</dd></div>
        <div><dt>Severity</dt><dd>${report.severity || "-"}</dd></div>
        <div><dt>Mode</dt><dd>${report.transport_mode || "-"}</dd></div>
        <div><dt>Vehicle ID</dt><dd>${report.vehicle_id || "-"}</dd></div>
        <div><dt>Incident time</dt><dd>${report.incident_time ? new Date(report.incident_time).toLocaleString() : "-"}</dd></div>
        <div><dt>Location</dt><dd>${escapeHtml(report.location_label || "-")}</dd></div>
        <div><dt>Coordinates</dt><dd>${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}</dd></div>
        <div><dt>Contact</dt><dd>${escapeHtml(report.contact || "-")}</dd></div>
      </dl>
    </div>
  `;
}

function renderTicket(ticket) {
  const nextRawFare = ticket.rides_count % 3 === 0 ? 17 : ticket.rides_count % 3 === 1 ? 21 : 32;
  const nextCharge = Math.min(nextRawFare, Math.max(0, 45 - ticket.accumulated_fare_thb));
  return `
    <article class="ops-ticket">
      <img src="/api/tickets/${ticket.id}/qr.svg" alt="Ticket QR" />
      <div>
        <p class="chip">${ticket.status}</p>
        <h3>${escapeHtml(ticket.holder_name)}</h3>
        <p class="meta">${escapeHtml(ticket.origin)} to ${escapeHtml(ticket.destination)}</p>
        <p class="meta">Next scan: raw ${nextRawFare} THB, charge ${nextCharge} THB after cap</p>
      </div>
      <div class="ops-ticket-fare">
        <strong>${ticket.accumulated_fare_thb}/45 THB</strong>
        <span>${ticket.rides_count} rides</span>
        <button class="button secondary compact validate-ticket" data-id="${ticket.id}" data-fare="${nextRawFare}">Validate scan</button>
      </div>
    </article>
  `;
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

list.addEventListener("change", async (event) => {
  if (!event.target.matches(".status-select")) return;
  await fetch(`/api/reports/${event.target.dataset.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: event.target.value }),
  });
  await loadAll();
});

list.addEventListener("click", async (event) => {
  const inspect = event.target.closest(".inspect, .ops-report");
  if (inspect && !event.target.matches("select, .delete, a")) {
    const reportId = inspect.dataset.id;
    const report = cachedReports.find((item) => item.id === reportId);
    renderDetail(report);
    list.querySelectorAll(".ops-report").forEach((card) => card.classList.toggle("active", card.dataset.id === reportId));
    return;
  }

  const del = event.target.closest(".delete");
  if (del) {
    const ok = confirm("Delete this report? This cannot be undone.");
    if (!ok) return;
    await fetch(`/api/reports/${del.dataset.id}`, { method: "DELETE" });
    if (selectedReportId === del.dataset.id) selectedReportId = null;
    await loadAll();
  }
});

statusFilter.addEventListener("change", loadAll);
categoryFilter.addEventListener("change", loadAll);
refresh.addEventListener("click", loadAll);
walletTopupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  walletAdminMessage.textContent = "Adding wallet credit...";
  const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
  payload.amount_thb = Number(payload.amount_thb);
  const res = await fetch("/api/wallet/admin-credit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const user = await res.json();
  walletAdminMessage.textContent = res.ok
    ? `${user.display_name} balance is now ${user.balance_thb} THB.`
    : (user.detail || "Could not add wallet credit.");
});
ticketList.addEventListener("click", async (event) => {
  const button = event.target.closest(".validate-ticket");
  if (!button) return;
  button.disabled = true;
  button.textContent = "Validating...";
  await fetch(`/api/tickets/${button.dataset.id}/tap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "bus",
      station_name: "Operator console scan",
      fare_thb: Number(button.dataset.fare),
    }),
  });
  await loadAll();
});
loadAll();
