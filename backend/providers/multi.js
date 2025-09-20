
const { reconcile } = require('../services/reconcile');
const registry = { mock:require('./mock'), carquery:require('./carquery'), jato:require('./jato'), autovista:require('./autovista'), eurotax:require('./eurotax') };
function enabled(){ return (process.env.ENABLED_PROVIDERS||'mock').split(',').map(s=>s.trim()).filter(Boolean).filter(n=>registry[n]); }
async function first(){ const n=enabled(); for(const k of n){ if(registry[k]) return registry[k]; } return registry.mock; }
async function getMakes(){ return (await first()).getMakes(); }
async function getModels(m){ return (await first()).getModels(m); }
async function getYears(m,mo){ return (await first()).getYears(m,mo); }
async function getTrims(m,mo,y){ return (await first()).getTrims(m,mo,y); }
async function getSpecs(provider_key){
  const names = enabled(); const all=[];
  for(const n of names){ const p = registry[n]; try{ const s = await p.getSpecs(provider_key); if(s) all.push({provider:n,spec:s}); }catch(e){} }
  return reconcile(all);
}
module.exports = { getMakes, getModels, getYears, getTrims, getSpecs };
