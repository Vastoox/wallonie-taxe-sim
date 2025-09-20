
const dataset = [
  { make:"BMW", model:"5 Series", year:2018, engine:"520d (190 ch)", provider_key:"BMW|5 Series|2018|520d (190 ch)",
    specs:{ kw:140, cc:1995, fuel:"Diesel", co2_wltp:117, cycle:"WLTP", mma:2360, is_hybrid:false, is_electric:false } },
  { make:"BMW", model:"5 Series", year:2018, engine:"530e iPerformance", provider_key:"BMW|5 Series|2018|530e iPerformance",
    specs:{ kw:185, cc:1998, fuel:"Hybride", co2_wltp:49, cycle:"WLTP", mma:2345, is_hybrid:true, is_electric:false } },
  { make:"Mercedes-Benz", model:"E-Class", year:2018, engine:"E220d", provider_key:"Mercedes-Benz|E-Class|2018|E220d",
    specs:{ kw:143, cc:1950, fuel:"Diesel", co2_wltp:118, cycle:"WLTP", mma:2325, is_hybrid:false, is_electric:false } },
  { make:"Tesla", model:"Model 3", year:2021, engine:"Long Range AWD", provider_key:"Tesla|Model 3|2021|Long Range AWD",
    specs:{ kw:258, cc:0, fuel:"Électrique", co2_wltp:0, cycle:"WLTP", mma:2260, is_hybrid:false, is_electric:true } }
];
function uniq(a){ return [...new Set(a)] }
async function getMakes(){ return uniq(dataset.map(d=>d.make)).sort(); }
async function getModels(make){ return uniq(dataset.filter(d=>d.make===make).map(d=>d.model)).sort(); }
async function getYears(make, model){ return uniq(dataset.filter(d=>d.make===make && d.model===model).map(d=>d.year)).sort((a,b)=>b-a); }
async function getTrims(make, model, year){ return dataset.filter(d=>d.make===make&&d.model===model&&d.year===year).map(d=>({id:d.provider_key,name:d.engine,provider_key:d.provider_key,year:d.year})); }
async function getSpecs(provider_key){ const row = dataset.find(d=>d.provider_key===provider_key); return row?row.specs:null; }
module.exports = { getMakes, getModels, getYears, getTrims, getSpecs };
