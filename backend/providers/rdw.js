import fetch from "node-fetch";

export async function getSpecs(make, model, year) {
  const url = `https://opendata.rdw.nl/resource/m9d7-ebf2.json?merk=${encodeURIComponent(make)}&handelsbenaming=${encodeURIComponent(model)}&datum_eerste_toelating=${year}0101`;
  const resp = await fetch(url);
  const data = await resp.json();

  if (!data.length) return null;

  const car = data[0];
  return {
    kw: parseInt(car.netto_maximumvermogen || car.vermogens, 10) || null,
    cc: parseInt(car.cilinderinhoud, 10) || null,
    fuel: car.brandstof_omschrijving || "Unknown",
    co2_wltp: parseInt(car.co2_uitstoot_gecombineerd_wltp, 10) || null,
    cycle: "WLTP",
    mma: parseInt(car.toegestane_maximum_massa_voertuig, 10) || null,
    is_hybrid: car.brandstof_omschrijving?.toLowerCase().includes("hybride") || false,
    is_electric: car.brandstof_omschrijving?.toLowerCase().includes("elektr") || false,
  };
}
