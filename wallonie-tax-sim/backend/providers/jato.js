
const fetch = require('node-fetch');
function ok(){ return process.env.JATO_BASE_URL && process.env.JATO_API_KEY; }
async function getMakes(){ return []; } async function getModels(){ return []; } async function getYears(){ return []; } async function getTrims(){ return []; }
async function getSpecs(provider_key){
  if(!ok()) return null;
  // const url = `${process.env.JATO_BASE_URL}/vehicles/${encodeURIComponent(provider_key)}?market=BE`;
  // const r = await fetch(url,{ headers:{ Authorization:`Bearer ${process.env.JATO_API_KEY}` }}); const data = await r.json();
  // return { kw, cc, fuel, co2_wltp, cycle:"WLTP", mma, is_hybrid, is_electric };
  return null;
}
module.exports = { getMakes, getModels, getYears, getTrims, getSpecs };
