// ESM
import pkg from "pg";
const { Pool } = pkg;

import * as carquery from "./carquery.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "require" ? { rejectUnauthorized: false } : false,
});

async function db(q, params = []) {
  const { rows } = await pool.query(q, params);
  return rows;
}

// ====== CATALOGUE ======
// CarQuery (large) -> si indispo, fallback DB
export async function getMakes() {
  try {
    const makes = await carquery.getMakes();
    if (makes?.length) return makes;
  } catch (e) { console.warn("CarQuery.getMakes:", e.message); }

  const rows = await db(`SELECT DISTINCT make FROM v_catalogue ORDER BY make`);
  return rows.map(r => r.make);
}

export async function getModels(make) {
  if (!make) return [];
  try {
    const models = await carquery.getModels(make);
    if (models?.length) return models;
  } catch (e) { console.warn("CarQuery.getModels:", e.message); }

  const rows = await db(
    `SELECT DISTINCT model FROM v_catalogue WHERE make=$1 ORDER BY model`,
    [make]
  );
  return rows.map(r => r.model);
}

export async function getYears(make, model) {
  if (!make || !model) return [];
  try {
    const years = await carquery.getYears(make, model);
    if (years?.length) return years;
  } catch (e) { console.warn("CarQuery.getYears:", e.message); }

  const rows = await db(
    `SELECT DISTINCT year FROM v_catalogue WHERE make=$1 AND model=$2 ORDER BY year DESC`,
    [make, model]
  );
  return rows.map(r => r.year);
}

// ====== ENGINES ======
// DB v_catalogue -> trim_id (=> devis possible). Sinon fallback CarQuery (trim_id null).
export async function getEngines(make, model, year) {
  if (!make || !model || !year) return [];
  const rows = await db(
    `SELECT DISTINCT trim_id, engine
       FROM v_catalogue
      WHERE make=$1 AND model=$2 AND year=$3
      ORDER BY engine`,
    [make, model, year]
  );
  if (rows.length) return rows;

  // fallback
  try {
    const trims = await carquery.getTrims(make, model, year);
    return trims;
  } catch (e) {
    console.warn("CarQuery.getTrims:", e.message);
    return [];
  }
}

// ====== QUOTE ======
// Prend les valeurs calculées dans v_trim_quote (ou appelle ta fonction SQL si tu l’as)
export async function getQuote(query) {
  const trimId = query.trimId;
  if (!trimId) return { error: "trimId requis" };

  const rows = await db(
    `SELECT tmc_estimate AS tmc, annual_tax_estimate AS taxe_annuelle
       FROM v_trim_quote
      WHERE trim_id = $1`,
    [trimId]
  );
  if (!rows.length) {
    return { error: "Données techniques introuvables pour ce moteur" };
  }
  return rows[0];
}
