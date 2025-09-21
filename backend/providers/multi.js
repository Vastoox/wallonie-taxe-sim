import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "require" ? { rejectUnauthorized: false } : false,
});

// ---- Fonctions ---- //
export async function getMakes() {
  const { rows } = await pool.query("SELECT DISTINCT make FROM v_trim_quote ORDER BY make");
  return rows.map(r => r.make);
}

export async function getModels(make) {
  const { rows } = await pool.query(
    "SELECT DISTINCT model FROM v_trim_quote WHERE make=$1 ORDER BY model",
    [make]
  );
  return rows.map(r => r.model);
}

export async function getYears(make, model) {
  const { rows } = await pool.query(
    "SELECT DISTINCT year FROM v_trim_quote WHERE make=$1 AND model=$2 ORDER BY year DESC",
    [make, model]
  );
  return rows.map(r => r.year);
}

export async function getEngines(make, model, year) {
  const { rows } = await pool.query(
    "SELECT trim_id, engine FROM v_trim_quote WHERE make=$1 AND model=$2 AND year=$3 ORDER BY engine",
    [make, model, year]
  );
  return rows;
}

export async function getQuote({ trimId }) {
  const { rows } = await pool.query(
    "SELECT tmc_estimate AS tmc, annual_tax_estimate AS taxe_annuelle FROM v_trim_quote WHERE trim_id=$1",
    [trimId]
  );
  return rows[0] || {};
}
