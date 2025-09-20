// backend/providers/rdw.js
const fetch = require("node-fetch");

// En mode multi, on ne peut pas lier directement un model_id CarQuery à RDW.
// On laisse getSpecs neutre et on pourra l'utiliser plus tard via une recherche texte si besoin.
async function getSpecs(/* provider_key */) {
  return null;
}

// (Optionnel) helper si tu fais une route custom pour enrichir par texte:
async function searchByText(make, model, year) {
  const url = `https://opendata.rdw.nl/resource/m9d7-ebf2.json?merk=${encodeURIComponent(make)}&handelsbenaming=${encodeURIComponent(model)}&datum_eerste_toelating=${year}0101`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (!Array.isArray(data) || !data.length) return null;
  const c = data[0];
  return {
    kw: c.netto_maximumvermogen ? Number(c.netto_maximumvermogen) : null,
    cc: c.cilinderinhoud ? Number(c.cilinderinhoud) : null,
    fuel: c.brandstof_omschrijving || null,
    co2_wltp: c.co2_uitstoot_gecombineerd_wltp ? Number(c.co2_uitstoot_gecombineerd_wltp) : null,
    cycle: "WLTP",
    mma: c.toegestane_maximum_massa_voertuig ? Number(c.toegestane_maximum_massa_voertuig) : null,
    is_hybrid: /hybride/i.test(c.brandstof_omschrijving || ""),
    is_electric: /(elektr|electric)/i.test(c.brandstof_omschrijving || "")
  };
}

module.exports = { getSpecs, searchByText };
