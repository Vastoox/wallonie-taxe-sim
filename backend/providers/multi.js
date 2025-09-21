// backend/providers/multi.js
import db from "./db.js";
import * as carquery from "./carquery.js";
import * as rdw from "./rdw.js"; // pas encore utilisé ici, mais gardé pour plus tard

// --------- Catalogue ---------
export async function getMakes() {
  try {
    const makes = await carquery.getMakes();
    if (makes?.length) return makes;
    console.warn("CarQuery.getMakes renvoie vide -> fallback DB");
  } catch (e) {
    console.warn("CarQuery.getMakes ERROR:", e.message);
  }
  const rows = await db(`SELECT DISTINCT make FROM v_catalogue ORDER BY make`);
  return rows.map((r) => r.make);
}

export async function getModels(make) {
  try {
    const models = await carquery.getModels(make);
    if (models?.length) return models;
    console.warn(`CarQuery.getModels(${make}) vide -> fallback DB`);
  } catch (e) {
    console.warn(`CarQuery.getModels(${make}) ERROR:`, e.message);
  }
  const rows = await db(
    `SELECT DISTINCT model FROM v_catalogue WHERE make=$1 ORDER BY model`,
    [make]
  );
  return rows.map((r) => r.model);
}

export async function getYears(make, model) {
  try {
    const years = await carquery.getYears(make, model);
    if (years?.length) return years;
    console.warn(`CarQuery.getYears(${make}, ${model}) vide -> fallback DB`);
  } catch (e) {
    console.warn(`CarQuery.getYears(${make}, ${model}) ERROR:`, e.message);
  }
  const rows = await db(
    `SELECT DISTINCT year FROM v_catalogue WHERE make=$1 AND model=$2 ORDER BY year DESC`,
    [make, model]
  );
  return rows.map((r) => r.year);
}

// --------- Moteurs (trims) ---------
export async function getEngines(make, model, year) {
  try {
    const trims = await carquery.getTrims(make, model, year);
    if (trims?.length) return trims;
    console.warn(
      `CarQuery.getTrims(${make}, ${model}, ${year}) vide -> fallback DB`
    );
  } catch (e) {
    console.warn(
      `CarQuery.getTrims(${make}, ${model}, ${year}) ERROR:`,
      e.message
    );
  }
  const rows = await db(
    `SELECT trim_id, engine
       FROM v_catalogue
      WHERE make=$1 AND model=$2 AND year=$3
      ORDER BY engine`,
    [make, model, year]
  );
  return rows;
}

// --------- Devis ---------
export async function getQuote({ trimId }) {
  if (!trimId) return { error: "trimId requis" };
  const rows = await db(
    `SELECT tmc_estimate AS tmc, annual_tax_estimate AS taxe_annuelle
       FROM v_trim_quote
      WHERE trim_id = $1`,
    [trimId]
  );
  return rows[0] || { error: "Données introuvables pour ce moteur" };
}
