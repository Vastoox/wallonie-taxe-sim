
const fetch = require('node-fetch');
function stripJSONP(s){ return JSON.parse(s.replace(/^\?\(|\);?$/g, "")); }
async function getMakes(){ return ["BMW","Mercedes-Benz","Tesla"]; }
async function getModels(make){ const map={"BMW":["5 Series"],"Mercedes-Benz":["E-Class"],"Tesla":["Model 3"]}; return map[make]||[]; }
async function getYears(make,model){ const map={"BMW|5 Series":[2017,2018,2019,2020],"Mercedes-Benz|E-Class":[2017,2018,2019],"Tesla|Model 3":[2019,2020,2021,2022,2023]}; return (map[`${make}|${model}`]||[]).sort((a,b)=>b-a); }
async function getTrims(make, model, year){
  const url=`https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`;
  const raw=await fetch(url).then(r=>r.text()); const json=stripJSONP(raw);
  return (json.Trims||[]).map(t=>({id:`${t.model_id}-${t.model_trim}`,name:t.model_trim||`${t.model_engine_fuel}_${t.model_engine_power_kw}kW`,provider_key:t.model_id,year:t.model_year}));
}
async function getSpecs(provider_key){
  const url=`https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getModel&model=${provider_key}`;
  const raw=await fetch(url).then(r=>r.text()); const json=stripJSONP(raw); const m=json[0]||{};
  return { kw:m.model_engine_power_kw?Number(m.model_engine_power_kw):null, cc:m.model_engine_cc?Number(m.model_engine_cc):null,
    fuel:m.model_engine_fuel||null, co2_wltp:null, cycle:"WLTP", mma:null, is_hybrid:/hybrid/i.test(m.model_engine_fuel||""), is_electric:/electric/i.test(m.model_engine_fuel||"") };
}
module.exports = { getMakes, getModels, getYears, getTrims, getSpecs };
