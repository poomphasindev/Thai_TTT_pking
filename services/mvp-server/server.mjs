import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const webDir = path.join(rootDir, "services/web");
const dataDir = path.join(rootDir, "data");
const uploadDir = path.join(dataDir, "uploads");
const dbPath = path.join(dataDir, "reports.json");
const port = Number(process.env.PORT || 8000);
const maxBodyBytes = 10 * 1024 * 1024;

const categories = new Set([
  "taxi_refusal",
  "overpricing",
  "broken_pavement",
  "unsafe_crossing",
  "unclear_signage",
  "crowding",
  "harassment",
  "lost_property",
  "other",
]);
const statuses = new Set(["submitted", "reviewing", "resolved", "rejected"]);
const mimeByExt = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
]);
const imageExtByMime = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

await mkdir(uploadDir, { recursive: true });
await ensureDb();

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (url.pathname === "/api/health" && req.method === "GET") {
      return json(res, 200, { status: "ok" });
    }

    if (url.pathname === "/api/reports" && req.method === "POST") {
      return createReport(req, res);
    }

    if (url.pathname === "/api/reports" && req.method === "GET") {
      return listReports(url, res);
    }

    const statusMatch = url.pathname.match(/^\/api\/reports\/([^/]+)\/status$/);
    if (statusMatch && req.method === "PATCH") {
      return updateStatus(req, res, statusMatch[1]);
    }

    const analyzeMatch = url.pathname.match(/^\/api\/reports\/([^/]+)\/analyze$/);
    if (analyzeMatch && req.method === "POST") {
      return analyzeReport(res, analyzeMatch[1]);
    }

    return serveStatic(url, res);
  } catch (error) {
    console.error(error);
    return json(res, 500, { detail: "Internal server error" });
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`MVP server running at http://127.0.0.1:${port}`);
});

async function createReport(req, res) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    return json(res, 415, { detail: "Expected multipart/form-data" });
  }

  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1]
    || contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2];
  if (!boundary) return json(res, 400, { detail: "Missing multipart boundary" });

  const body = await readBody(req);
  const parts = parseMultipart(body, boundary);
  const fields = new Map();
  let imageUrl = null;

  for (const part of parts) {
    if (!part.name) continue;
    if (part.filename) {
      if (part.data.length === 0) continue;
      const ext = imageExtByMime.get(part.contentType);
      if (!ext) return json(res, 400, { detail: "Only JPEG, PNG, and WEBP images are supported." });
      const fileName = `${randomUUID().replaceAll("-", "")}${ext}`;
      await writeFile(path.join(uploadDir, fileName), part.data);
      imageUrl = `/uploads/${fileName}`;
    } else {
      fields.set(part.name, part.data.toString("utf8").trim());
    }
  }

  const category = fields.get("category");
  const description = fields.get("description");
  const latitude = Number(fields.get("latitude"));
  const longitude = Number(fields.get("longitude"));

  if (!categories.has(category)) return json(res, 400, { detail: "Invalid category" });
  if (!description || description.length < 5) return json(res, 400, { detail: "Description is too short" });
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return json(res, 400, { detail: "Invalid latitude" });
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return json(res, 400, { detail: "Invalid longitude" });

  const now = new Date().toISOString();
  const report = {
    id: randomUUID().replaceAll("-", ""),
    category,
    description,
    latitude,
    longitude,
    image_url: imageUrl,
    status: "submitted",
    reporter_name: fields.get("reporter_name") || null,
    contact: fields.get("contact") || null,
    ai_category: null,
    ai_confidence: null,
    ai_summary: null,
    created_at: now,
    updated_at: now,
  };

  const reports = await readReports();
  reports.unshift(report);
  await writeReports(reports);
  return json(res, 201, report);
}

async function listReports(url, res) {
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  let reports = await readReports();
  if (status) reports = reports.filter((report) => report.status === status);
  if (category) reports = reports.filter((report) => report.category === category);
  return json(res, 200, reports);
}

async function updateStatus(req, res, id) {
  const payload = JSON.parse((await readBody(req)).toString("utf8") || "{}");
  if (!statuses.has(payload.status)) return json(res, 400, { detail: "Invalid status" });

  const reports = await readReports();
  const report = reports.find((item) => item.id === id);
  if (!report) return json(res, 404, { detail: "Report not found" });

  report.status = payload.status;
  report.updated_at = new Date().toISOString();
  await writeReports(reports);
  return json(res, 200, report);
}

async function analyzeReport(res, id) {
  const reports = await readReports();
  if (!reports.some((report) => report.id === id)) {
    return json(res, 404, { detail: "Report not found" });
  }
  return json(res, 200, {
    report_id: id,
    enabled: false,
    message: "AI analysis is reserved for the next sprint. MVP uses manual category selection first.",
    result: {},
  });
}

async function serveStatic(url, res) {
  let requestedPath = decodeURIComponent(url.pathname);
  if (requestedPath === "/") requestedPath = "/index.html";

  const baseDir = requestedPath.startsWith("/uploads/") ? dataDir : webDir;
  const filePath = path.normalize(path.join(baseDir, requestedPath));
  if (!filePath.startsWith(baseDir)) return text(res, 403, "Forbidden");

  const ext = path.extname(filePath);
  const mime = mimeByExt.get(ext) || "application/octet-stream";
  try {
    res.writeHead(200, { "Content-Type": mime });
    createReadStream(filePath).pipe(res);
  } catch {
    text(res, 404, "Not found");
  }
}

async function ensureDb() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(dbPath, "utf8");
  } catch {
    await writeFile(dbPath, "[]");
  }
}

async function readReports() {
  const raw = await readFile(dbPath, "utf8");
  return JSON.parse(raw || "[]");
}

async function writeReports(reports) {
  await writeFile(dbPath, `${JSON.stringify(reports, null, 2)}\n`);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBodyBytes) {
        req.destroy();
        reject(new Error("Request body too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseMultipart(body, boundary) {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const segments = splitBuffer(body, boundaryBuffer).slice(1, -1);
  return segments.map((segment) => {
    let part = segment;
    if (part.subarray(0, 2).toString() === "\r\n") part = part.subarray(2);
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd < 0) return {};

    const rawHeaders = part.subarray(0, headerEnd).toString("utf8");
    let data = part.subarray(headerEnd + 4);
    if (data.subarray(data.length - 2).toString() === "\r\n") data = data.subarray(0, data.length - 2);

    const disposition = rawHeaders.match(/content-disposition:([^\r\n]+)/i)?.[1] || "";
    const name = disposition.match(/name="?([^";]+)"?/)?.[1];
    const filename = disposition.match(/filename="?([^";]*)"?/)?.[1];
    const contentType = rawHeaders.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim() || "text/plain";
    return { name, filename, contentType, data };
  });
}

function splitBuffer(buffer, separator) {
  const parts = [];
  let offset = 0;
  let index = buffer.indexOf(separator, offset);
  while (index !== -1) {
    parts.push(buffer.subarray(offset, index));
    offset = index + separator.length;
    index = buffer.indexOf(separator, offset);
  }
  parts.push(buffer.subarray(offset));
  return parts;
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function text(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(payload);
}
