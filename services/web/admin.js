const list = document.querySelector("#reportList");
const ticketList = document.querySelector("#ticketList");
const statusFilter = document.querySelector("#statusFilter");
const refresh = document.querySelector("#refresh");

const labels = {
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

async function loadAll() {
  const [reports, tickets] = await Promise.all([loadReports(), loadTickets()]);
  renderStats(reports, tickets);
}

async function loadReports() {
  list.innerHTML = "<p class='message'>Loading reports...</p>";
  const params = new URLSearchParams();
  if (statusFilter.value) params.set("status", statusFilter.value);

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

  ticketList.innerHTML = tickets.length
    ? tickets.map(renderTicket).join("")
    : "<p class='message'>No tickets yet.</p>";
  return tickets;
}

function renderStats(reports, tickets) {
  const open = reports.filter((report) => ["submitted", "reviewing"].includes(report.status)).length;
  const resolved = reports.filter((report) => report.status === "resolved").length;
  const active = tickets.filter((ticket) => ticket.status === "active").length;
  const protectedFare = tickets.reduce((sum, ticket) => sum + Math.max(0, ticket.accumulated_fare_thb), 0);

  document.querySelector("#openReports").textContent = open;
  document.querySelector("#resolvedReports").textContent = resolved;
  document.querySelector("#activeTickets").textContent = active;
  document.querySelector("#fareProtected").textContent = `${protectedFare} THB`;
}

function renderReport(report) {
  const image = report.image_url
    ? `<img class="thumb" src="${report.image_url}" alt="Report evidence" />`
    : `<div class="thumb empty">No image</div>`;

  return `
    <article class="report-card">
      ${image}
      <div class="report-body">
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
        <p class="meta">${new Date(report.created_at).toLocaleString()} | ${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}</p>
        <div class="actions">
          <a class="button secondary compact" target="_blank" href="https://www.google.com/maps?q=${report.latitude},${report.longitude}">Open map</a>
          <button class="button secondary compact analyze" data-id="${report.id}">Analyze with AI</button>
        </div>
      </div>
    </article>
  `;
}

function renderTicket(ticket) {
  return `
    <article class="ops-ticket">
      <img src="/api/tickets/${ticket.id}/qr.svg" alt="Ticket QR" />
      <div>
        <p class="chip">${ticket.status}</p>
        <h3>${escapeHtml(ticket.holder_name)}</h3>
        <p class="meta">${escapeHtml(ticket.origin)} to ${escapeHtml(ticket.destination)}</p>
      </div>
      <div class="ops-ticket-fare">
        <strong>${ticket.accumulated_fare_thb}/45 THB</strong>
        <span>${ticket.rides_count} rides</span>
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
  if (!event.target.matches(".analyze")) return;
  const res = await fetch(`/api/reports/${event.target.dataset.id}/analyze`, { method: "POST" });
  const payload = await res.json();
  alert(payload.message || "AI analysis placeholder");
});

statusFilter.addEventListener("change", loadAll);
refresh.addEventListener("click", loadAll);
loadAll();
