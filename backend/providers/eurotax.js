
const fetch = require('node-fetch');
function ok(){ return process.env.EUROTAX_BASE_URL && process.env.EUROTAX_API_KEY; }
async function getMakes(){ return []; } async function getModels(){ return []; } async function getYears(){ return []; } async function getTrims(){ return []; }
async function getSpecs(provider_key){
  if(!ok()) return null;
  // const url = `${process.env.EUROTAX_BASE_URL}/vehicles/${encodeURIComponent(provider_key)}?country=BE`;
  // const r = await fetch(url,{ headers:{ 'x-api-key': process.env.EUROTAX_API_KEY }}); const data = await r.json();
  // return { kw, cc, fuel, co2_wltp, cycle:"WLTP", mma, is_hybrid, is_electric };
  return null;
}
module.exports = { getMakes, getModels, getYears, getTrims, getSpecs };
