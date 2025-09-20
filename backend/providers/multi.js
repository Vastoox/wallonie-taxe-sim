// backend/providers/multi.js
const { reconcile } = require('../services/reconcile');

const registry = {
  mock: require('./mock'),
  carquery: require('./carquery'),
  jato: require('./jato'),
  autovista: require('./autovista'),
  eurotax: require('./eurotax'),
  rdw: require('./rdw'), // ← AJOUT
};

function enabledProviders() {
  const list = (process.env.ENABLED_PROVIDERS || 'mock').split(',').map(s=>s.trim()).filter(Boolean);
  return list.filter(name => registry[name]);
}

async function getFirstProvider(){
  const names = enabledProviders();
  for (const n of names){ if (registry[n]) return registry[n]; }
  return registry.mock;
}

async function getMakes(){ return (await getFirstProvider()).getMakes(); }
async function getModels(make){ return (await getFirstProvider()).getModels(make); }
async function getYears(make, model){ return (await getFirstProvider()).getYears(make, model); }
async function getTrims(make, model, year){ return (await getFirstProvider()).getTrims(make, model, year); }

async function getSpecs(provider_key){
  const names = enabledProviders();
  const all = [];
  for (const n of names){
    const prov = registry[n];
    try{
      const spec = await prov.getSpecs(provider_key);
      if (spec) all.push({ provider: n, spec });
    }catch(e){ /* ignore */ }
  }
  return reconcile(all);
}

module.exports = { getMakes, getModels, getYears, getTrims, getSpecs };
