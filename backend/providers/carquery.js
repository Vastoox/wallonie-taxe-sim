// CarQuery renvoie du JSONP. On fetch du texte et on "dé-JSONP-ise".
const BASE = "https://www.carqueryapi.com/api/0.3/";

// retire l’enveloppe JSONP:  callbackName({...});
function parseJSONP(text) {
  // supprime ce qui est avant la 1re parenthèse ouvrante et la parenthèse fermante finale + ';' éventuel
  const json = text.replace(/^[^(]+\(/, "").replace(/\);?\s*$/, "");
  return JSON.parse(json);
}

async function cq(params) {
  const u = new URL(BASE);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  // IMPORTANT: CarQuery retourne JSONP -> pas d'accept header JSON
  const r = await fetch(u.toString(), { method: "GET" });
  if (!r.ok) throw new Error(`CarQuery ${u} -> ${r.status}`);
  const txt = await r.text();
  return parseJSONP(txt);
}

export async function getMakes() {
  const js = await cq({ cmd: "getMakes", sold_in_eu: 1 });
  const makes = (js.Makes || [])
    .map(m => m.make_display || m.make || m.make_id)
    .filter(Boolean);
  // Unicité + tri alpha
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

export async function getTrims(make, model, year) {
  if (!make || !model || !year) return [];
  const js = await cq({ cmd: "getTrims", make, model, year });
  return (js.Trims || []).map(t => ({
    trim_id: null, // pas de devis si on n’a pas d’ID DB
    engine: t.model_trim || t.model_engine_position || t.model_variant || "Moteur",
  }));
}
