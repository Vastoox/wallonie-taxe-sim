// ESM
import fetch from "node-fetch"; // si tu n'as pas node-fetch, remplace par global fetch (Node 18+)

const BASE = "https://www.carqueryapi.com/api/0.3/";

async function cq(params) {
  const u = new URL(BASE);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u.toString(), { timeout: 20000 });
  if (!r.ok) throw new Error(`CarQuery ${u} -> ${r.status}`);
  return r.json();
}

export async function getMakes() {
  const js = await cq({ cmd: "getMakes", sold_in_eu: 1 });
  const makes = (js.Makes || [])
    .map(m => m.make_display || m.make || m.make_id)
    .filter(Boolean);
  return [...new Set(makes)].sort((a, b) => a.localeCompare(b));
}

export async function getModels(make) {
  if (!make) return [];
  const js = await cq({ cmd: "getModels", make, sold_in_eu: 1 });
  const models = (js.Models || []).map(m => m.model_name).filter(Boolean);
  return [...new Set(models)].sort((a, b) => a.localeCompare(b));
}

export async function getYears(make, model) {
  if (!make || !model) return [];
  const js = await cq({ cmd: "getYears", make, model });
  const y = js.Years || {};
  const min = parseInt(y.min_year, 10);
  const max = parseInt(y.max_year, 10);
  if (!min || !max || min > max) return [];
  const years = [];
  for (let k = max; k >= min; k--) years.push(k);
  return years;
}

// fallback trims si DB n'a rien (multi s’en servira)
export async function getTrims(make, model, year) {
  const js = await cq({ cmd: "getTrims", make, model, year });
  return (js.Trims || []).map(t => ({
    trim_id: null,
    engine: t.model_trim || t.model_engine_position || t.model_variant || "Moteur"
  }));
}
