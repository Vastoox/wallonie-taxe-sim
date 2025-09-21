// backend/server.js
import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL ? { rejectUnauthorized: false } : false,
});

// Santé
app.get("/health", async (_req, res) => {
  try { await pool.query("select 1"); return res.json({ ok: true }); }
  catch (e) { return res.status(500).json({ ok:false, error: e.message }); }
});

// Marques
app.get("/api/makes", async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT DISTINCT make FROM v_trim_quote ORDER BY make"
  );
  res.json(rows.map(r => r.make));
});

// Modèles
app.get("/api/models", async (req, res) => {
  const { make } = req.query;
  if (!make) return res.status(400).json({ error: "make manquant" });
  const { rows } = await pool.query(
    "SELECT DISTINCT model FROM v_trim_quote WHERE make=$1 ORDER BY model",
    [make]
  );
  res.json(rows.map(r => r.model));
});

// Années
app.get("/api/years", async (req, res) => {
  const { make, model } = req.query;
  if (!make || !model) return res.status(400).json({ error: "make/model manquant" });
  const { rows } = await pool.query(
    "SELECT DISTINCT year FROM v_trim_quote WHERE make=$1 AND model=$2 ORDER BY year DESC",
    [make, model]
  );
  res.json(rows.map(r => r.year));
});

// Moteurs
app.get("/api/engines", async (req, res) => {
  const { make, model, year } = req.query;
  if (!make || !model || !year) return res.status(400).json({ error: "make/model/year manquant" });
  const { rows } = await pool.query(
    "SELECT trim_id, engine FROM v_trim_quote WHERE make=$1 AND model=$2 AND year=$3 ORDER BY engine",
    [make, model, year]
  );
  res.json(rows);
});

// Devis final (TMC + taxe)
app.get("/api/quote", async (req, res) => {
  const { trimId } = req.query;
  if (!trimId) return res.status(400).json({ error: "trimId manquant" });
  const { rows } = await pool.query("SELECT * FROM v_trim_quote WHERE trim_id=$1", [trimId]);
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  const r = rows[0];
  res.json({
    make:r.make, model:r.model, year:r.year, engine:r.engine,
    kw:r.kw, cc:r.cc, co2:r.co2, cycle:r.cycle, mma:r.mma, fuel:r.fuel,
    tmc:Number(r.tmc_estimate), taxe_annuelle:Number(r.annual_tax_estimate),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("API on", PORT));
