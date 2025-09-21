// backend/providers/multi.js
// Agrège CarQuery (catalogue large) + ta DB RDW (v_catalogue) pour les moteurs / trim_id.

const { Pool } = require('pg');
const carquery = require('./carquery');            // CarQuery = catalogue riche
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const ssl =
  (process.env.PGSSL || '').toLowerCase() === 'require'
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl
});

// Helpers DB (RDW)
async function db(query, params = []) {
  const { rows } = await pool.query(query, params);
  return rows;
}

module.exports = {
  name: 'multi',

  // ====== MAKES ======
  // 1) CarQuery (très large)  2) Fallback DB si CarQuery indispo
  async getMakes() {
    try {
      const makes = await carquery.getMakes();
      if (makes?.length) return makes;
    } catch (e) {
      console.warn('CarQuery.getMakes failed:', e.message);
    }
    const rows = await db(`SELECT DISTINCT make FROM v_catalogue ORDER BY make`);
    return rows.map(r => r.make);
  },

  // ====== MODELS ======
  async getModels(make) {
    if (!make) return [];
    try {
      const models = await carquery.getModels(make);
      if (models?.length) return models;
    } catch (e) {
      console.warn('CarQuery.getModels failed:', e.message);
    }
    const rows = await db(
      `SELECT DISTINCT model FROM v_catalogue WHERE make=$1 ORDER BY model`,
      [make]
    );
    return rows.map(r => r.model);
  },

  // ====== YEARS ======
  async getYears(make, model) {
    if (!make || !model) return [];
    try {
      const years = await carquery.getYears(make, model);
      if (years?.length) return years;
    } catch (e) {
      console.warn('CarQuery.getYears failed:', e.message);
    }
    const rows = await db(
      `SELECT DISTINCT year
         FROM v_catalogue
        WHERE make=$1 AND model=$2
        ORDER BY year DESC`,
      [make, model]
    );
    return rows.map(r => r.year);
  },

  // ====== ENGINES (avec trim_id pour devis) ======
  async getEngines(make, model, year) {
    if (!make || !model || !year) return [];
    // 1) RDW (v_catalogue) => on obtient trim_id + engine (=> devis possible)
    const rows = await db(
      `SELECT DISTINCT trim_id, engine
         FROM v_catalogue
        WHERE make=$1 AND model=$2 AND year=$3
        ORDER BY engine`,
      [make, model, year]
    );
    if (rows.length) return rows.map(r => ({ trim_id: r.trim_id, engine: r.engine }));

    // 2) Fallback CarQuery (si RDW n'a pas ce cas) => pas de trim_id, on prévient côté front
    try {
      const u = new URL('https://www.carqueryapi.com/api/0.3/');
      u.searchParams.set('cmd', 'getTrims');
      u.searchParams.set('make', make);
      u.searchParams.set('model', model);
      u.searchParams.set('year', year);
      const r = await fetch(u.toString());
      if (r.ok) {
        const js = await r.json();
        const trims = (js.Trims || []).map(t => ({
          trim_id: null,
          engine: t.model_trim || t.model_engine_position || t.model_variant || 'Moteur'
        }));
        return trims;
      }
    } catch (e) {
      console.warn('CarQuery.getTrims fallback failed:', e.message);
    }
    return [];
  },

  // ====== QUOTE ======
  // Normalement déjà géré ailleurs (services/quote). Si besoin :
  async getQuote(trimId) {
    const q = await db(
      `SELECT make, model, year, engine, kw, co2, cycle, mma, fuel
         FROM v_trim_quote
        WHERE trim_id=$1`,
      [trimId]
    );
    if (!q.length) {
      return { error: 'Données techniques introuvables pour ce moteur (trim_id inconnu)' };
    }
    // Le calcul SQL peut être fait dans la DB via une fonction, sinon côté Node :
    const row = q[0];
    // Ici on suppose que tu as une fonction SQL pour la TMC + taxe (recommandé)
    const calc = await db(
      `SELECT
         f_compute_tmc($1,$2,$3,$4,$5,$6) AS tmc,
         f_compute_annual_tax($7,$5, false) AS taxe_annuelle`,
      [row.kw, row.co2, row.cycle, row.mma, row.fuel, row.year, row.cc]
    );
    return {
      ...row,
      ...calc[0]
    };
  }
};
