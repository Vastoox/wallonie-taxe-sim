// backend/providers/carquery.js
const fetch = require("node-fetch");

function stripJSONP(s) {
  // CarQuery renvoie JSONP style ?({...});
  return JSON.parse(String(s).trim().replace(/^\?\(|\);?$/g, ""));
}

async function fetchText(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; CarQueryProxy/1.0)" },
    timeout: 15000,
  });
  return r.text();
}

async function tryCQ(urls) {
  let lastErr;
  for (const u of urls) {
    try {
      const raw = await fetchText(u);
      // Si Cloudflare renvoie une page HTML, on évite le JSON.parse qui crashe
      if (/^\s*</.test(raw)) { lastErr = new Error("HTML received instead of JSONP"); continue; }
      return stripJSONP(raw);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("CarQuery unreachable");
}

async function getMakes() {
  const urls = [
    "https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getMakes&sold_in_eu=1",
    "https://carqueryapi.com/api/0.3/?callback=?&cmd=getMakes&sold_in_eu=1",
  ];
  try {
    const json = await tryCQ(urls);
    const makes = (json.Makes || []).map(m => m.make_display || m.make_id).filter(Boolean);
    const unique = [...new Set(makes)].sort((a,b)=>a.localeCompare(b));
    // Fallback minimal si la liste est anormalement courte
    return unique.length >= 10 ? unique : ["Audi","BMW","Citroën","Dacia","Fiat","Ford","Mercedes-Benz","Peugeot","Renault","Volkswagen"];
  } catch {
    return ["Audi","BMW","Citroën","Dacia","Fiat","Ford","Mercedes-Benz","Peugeot","Renault","Volkswagen"];
  }
}

async function getModels(make) {
  const urls = [
    `https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getModels&make=${encodeURIComponent(make)}`,
    `https://carqueryapi.com/api/0.3/?callback=?&cmd=getModels&make=${encodeURIComponent(make)}`,
  ];
  const json = await tryCQ(urls);
  const models = (json.Models || []).map(m => m.model_name).filter(Boolean);
  return [...new Set(models)].sort((a,b)=>a.localeCompare(b));
}

async function getYears(make, model) {
  const urls = [
    `https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
    `https://carqueryapi.com/api/0.3/?callback=?&cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
  ];
  const json = await tryCQ(urls);
  const years = (json.Trims || []).map(t => Number(t.model_year)).filter(Boolean);
  return [...new Set(years)].sort((a,b)=>b-a);
}

async function getTrims(make, model, year) {
  const urls = [
    `https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`,
    `https://carqueryapi.com/api/0.3/?callback=?&cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`,
  ];
  const json = await tryCQ(urls);
  return (json.Trims || []).map(t => ({
    id: `${t.model_id}-${t.model_trim || t.model_engine_fuel || ""}`,
    name: t.model_trim || `${t.model_engine_fuel || "N/A"} • ${t.model_engine_power_kw || "?"} kW`,
    provider_key: t.model_id,
    year: Number(t.model_year),
  }));
}

async function getSpecs(provider_key) {
  const urls = [
    `https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getModel&model=${encodeURIComponent(provider_key)}`,
    `https://carqueryapi.com/api/0.3/?callback=?&cmd=getModel&model=${encodeURIComponent(provider_key)}`,
  ];
  const json = await tryCQ(urls);
  const m = json[0] || {};
  return {
    kw: m.model_engine_power_kw ? Number(m.model_engine_power_kw) : null,
    cc: m.model_engine_cc ? Number(m.model_engine_cc) : null,
    fuel: m.model_engine_fuel || null,
    co2_wltp: null,
    cycle: "WLTP",
    mma: null,
    is_hybrid: /hybrid/i.test(m.model_engine_fuel || ""),
    is_electric: /electric/i.test(m.model_engine_fuel || ""),
  };
}

module.exports = { getMakes, getModels, getYears, getTrims, getSpecs };

