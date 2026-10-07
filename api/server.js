const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
const port = Number(process.env.PORT || 3000);
const salt = process.env.READ_HASH_SALT || "change-this-in-production";
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "*").split(",").map(x => x.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  }
}));
app.use(express.json({ limit: "20kb" }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)
    ? { rejectUnauthorized: false }
    : undefined
});

pool.on("error", error => {
  console.error("unexpected database pool error", error);
});

async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL não definida; a API iniciará, mas as estatísticas ficarão indisponíveis.");
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS read_events (
      id BIGSERIAL PRIMARY KEY,
      novel_id VARCHAR(120) NOT NULL,
      volume INTEGER NOT NULL DEFAULT 1,
      chapter VARCHAR(120) NOT NULL,
      visitor_hash CHAR(64) NOT NULL,
      event_day DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (novel_id, volume, chapter, visitor_hash, event_day)
    );
    CREATE INDEX IF NOT EXISTS read_events_novel_idx ON read_events (novel_id);
    CREATE INDEX IF NOT EXISTS read_events_created_idx ON read_events (created_at);
  `);
}

function clean(value, fallback = "") {
  return String(value ?? fallback).trim().slice(0, 120);
}

function visitorHash(visitorId) {
  return crypto.createHash("sha256").update(`${salt}:${visitorId}`).digest("hex");
}

app.get("/api/health", async (_req, res) => {
  try {
    if (!process.env.DATABASE_URL) return res.json({ ok: true, database: false });
    await pool.query("SELECT 1");
    return res.json({ ok: true, database: true });
  } catch (error) {
    return res.status(503).json({ ok: false, database: false, error: "database_unavailable" });
  }
});

app.post("/api/reads", async (req, res) => {
  const novelId = clean(req.body.novelId);
  const chapter = clean(req.body.chapter);
  const visitorId = clean(req.body.visitorId);
  const volume = Math.max(1, Math.min(999, Number(req.body.volume || 1)));

  if (!novelId || !chapter || !visitorId) {
    return res.status(400).json({ ok: false, error: "novelId, chapter e visitorId são obrigatórios" });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ ok: false, error: "database_not_configured" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO read_events (novel_id, volume, chapter, visitor_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (novel_id, volume, chapter, visitor_hash, event_day) DO NOTHING
       RETURNING id`,
      [novelId, volume, chapter, visitorHash(visitorId)]
    );
    return res.status(201).json({ ok: true, counted: result.rowCount === 1 });
  } catch (error) {
    console.error("read event error", error);
    return res.status(500).json({ ok: false, error: "read_event_failed" });
  }
});

app.get("/api/stats", async (_req, res) => {
  if (!process.env.DATABASE_URL) return res.status(503).json({ ok: false, error: "database_not_configured" });
  try {
    const total = await pool.query("SELECT COUNT(*)::int AS total FROM read_events");
    const novels = await pool.query(`
      SELECT novel_id AS "novelId", COUNT(*)::int AS reads
      FROM read_events
      GROUP BY novel_id
      ORDER BY reads DESC, novel_id ASC
    `);
    return res.json({ ok: true, total: total.rows[0].total, novels: novels.rows });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "stats_failed" });
  }
});

app.get("/api/ranking", async (req, res) => {
  if (!process.env.DATABASE_URL) return res.status(503).json({ ok: false, error: "database_not_configured" });
  const limit = Math.max(1, Math.min(50, Number(req.query.limit || 5)));
  try {
    const result = await pool.query(`
      SELECT novel_id AS "novelId", COUNT(*)::int AS reads
      FROM read_events
      GROUP BY novel_id
      ORDER BY reads DESC, novel_id ASC
      LIMIT $1
    `, [limit]);
    return res.json({ ok: true, ranking: result.rows });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "ranking_failed" });
  }
});

let server;

initDb().then(() => {
  server = app.listen(port, () => console.log(`NovelHub API running on port ${port}`));
}).catch(error => {
  console.error("database initialization failed", error);
  process.exit(1);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  if (server) await new Promise(resolve => server.close(resolve));
  await pool.end();
  process.exit(0);
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

