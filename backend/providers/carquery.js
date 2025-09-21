// backend/providers/carquery.js
// CarQuery: https://www.carqueryapi.com/documentation/api-usage/

const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const BASE = 'https://www.carqueryapi.com/api/0.3/';

async function q(params) {
  const u = new URL(BASE);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  // CarQuery renvoie du JSON "normal" si on NE met PAS callback
  const r = await fetch(u.toString(), { timeout: 20000 });
  if (!r.ok) throw new Error(`CarQuery ${u} -> ${r.status}`);
  return r.json();
}

module.exports = {
  name: 'carquery',

  // ========= CATALOGUE =========
  async getMakes() {
    // le filtre sold_in_eu donne un catalogue plus pertinent
    const js = await q({ cmd: 'getMakes', sold_in_eu: 1 });
    // { Makes: [{ make_id, make_display, make_country, ...}] }
    const makes = (js.Makes || [])
      .map(m => m.make_display || m.make || m.make_id)
      .filter(Boolean);
    // dédoublonnage + tri
    return Array.from(new Set(makes)).sort((a,b)=>a.localeCompare(b));
  },

  async getModels(make) {
    if (!make) return [];
    const js = await q({ cmd: 'getModels', make, sold_in_eu: 1 });
    // { Models: [{ model_name, model_make_id, ...}] }
    const models = (js.Models || [])
      .map(m => m.model_name)
      .filter(Boolean);
    return Array.from(new Set(models)).sort((a,b)=>a.localeCompare(b));
  },

  async getYears(make, model) {
    if (!make || !model) return [];
    // renvoie { Years: { min_year, max_year } }
    const js = await q({ cmd: 'getYears', make, model });
    const y = js.Years || {};
    const min = parseInt(y.min_year, 10);
    const max = parseInt(y.max_year, 10);
    if (!min || !max || min > max) return [];
    const years = [];
    for (let k = max; k >= min; k--) years.push(k);
    return years;
  },

  // CarQuery peut lister des “trims”, mais ne fournit pas toujours CO2/MMA.
  // On ne l'utilise qu'en secours (le provider multi s’en charge).
  async getEngines(/* make, model, year */) {
    return []; // on laisse le multi gérer (DB d’abord, puis fallback CarQuery si besoin)
  }
};
