// backend/providers/carquery.js
const fetch = require("node-fetch");

// CarQuery renvoie du JSONP → on nettoie
function stripJSONP(s){ return JSON.parse(s.replace(/^\?\(|\);?$/g, "")); }

async function getMakes(){
  const url = "https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getMakes&sold_in_eu=1";
  const raw = await fetch(url).then(r=>r.text());
  const json = stripJSONP(raw);
  const makes = (json.Makes || []).map(m => m.make_display || m.make_id);
  // tri + unique
  return [...new Set(makes)].sort((a,b)=>a.localeCompare(b));
}

async function getModels(make){
  const url = `https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getModels&make=${encodeURIComponent(make)}`;
  const raw = await fetch(url).then(r=>r.text());
  const json = stripJSONP(raw);
  const models = (json.Models || []).map(m => m.model_name).filter(Boolean);
  return [...new Set(models)].sort((a,b)=>a.localeCompare(b));
}

async function getYears(make, model){
  // On récupère les trims et on extrait les années distinctes
  const url = `https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
  const raw = await fetch(url).then(r=>r.text());
  const json = stripJSONP(raw);
  const years = (json.Trims || []).map(t => Number(t.model_year)).filter(Boolean);
  return [...new Set(years)].sort((a,b)=>b-a);
}

async function getTrims(make, model, year){
  const url = `https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`;
  const raw = await fetch(url).then(r=>r.text());
  const json = stripJSONP(raw);
  return (json.Trims || []).map(t => ({
    id: `${t.model_id}-${t.model_trim || t.model_engine_fuel || ""}`,
    name: t.model_trim || `${t.model_engine_fuel || "N/A"} • ${t.model_engine_power_kw || "?"} kW`,
    provider_key: t.model_id,      // utilisé ensuite par /api/specs
    year: Number(t.model_year)
  }));
}

// CarQuery n’a pas WLTP/MMA fiables → on ne renvoie que ce qu’on peut.
async function getSpecs(provider_key){
  const url = `https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getModel&model=${encodeURIComponent(provider_key)}`;
  const raw = await fetch(url).then(r=>r.text());
  const json = stripJSONP(raw);
  const m = json[0] || {};
  return {
    kw: m.model_engine_power_kw ? Number(m.model_engine_power_kw) : null,
    cc: m.model_engine_cc ? Number(m.model_engine_cc) : null,
    fuel: m.model_engine_fuel || null,
    co2_wltp: null,
    cycle: "WLTP",
    mma: null,
    is_hybrid: /hybrid/i.test(m.model_engine_fuel || ""),
    is_electric: /electric/i.test(m.model_engine_fuel || "")
  };
}

module.exports = { getMakes, getModels, getYears, getTrims, getSpecs };
