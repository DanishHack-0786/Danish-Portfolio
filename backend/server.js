// Simple Express backend for the portfolio
// - POST /contact  -> stores messages in data/messages.json
// - GET  /projects -> serves data/projects.json
// - GET  /resume   -> serves a local resume PDF file
//
// How to run:
// 1. cd backend
// 2. npm install
// 3. node server.js
//
// Frontend note:
// The site works fine without this backend.
// The contact form will gracefully fall back if the server is not running.

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Paths
const DATA_DIR = path.join(__dirname, "data");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const RESUME_FILE = path.join(__dirname, "public", "resume.pdf");

// Basic middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Simple helper to read JSON safely
function readJsonSafe(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Simple helper to write JSON atomically
function writeJsonSafe(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing JSON:", err);
    return false;
  }
}

// POST /contact - store messages
app.post("/contact", (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: "name, email and message are required." });
  }

  const existing = readJsonSafe(MESSAGES_FILE, []);

  const entry = {
    id: Date.now().toString(),
    name,
    email,
    message,
    createdAt: new Date().toISOString(),
  };

  existing.push(entry);

  const ok = writeJsonSafe(MESSAGES_FILE, existing);
  if (!ok) {
    return res.status(500).json({ error: "Failed to save message." });
  }

  return res.json({ status: "ok" });
});

// GET /projects - list demo projects
app.get("/projects", (req, res) => {
  const projects = readJsonSafe(PROJECTS_FILE, []);
  res.json(projects);
});

// GET /resume - download resume.pdf
app.get("/resume", (req, res) => {
  if (!fs.existsSync(RESUME_FILE)) {
    return res.status(404).json({
      error: "Resume file not found. Place your resume as backend/public/resume.pdf.",
    });
  }
  res.download(RESUME_FILE, "resume.pdf");
});

app.listen(PORT, () => {
  console.log(`Portfolio backend running on http://localhost:${PORT}`);
});

