
const fs = require('fs'); const path = require('path');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname,'..','config','reconciliation.json'),'utf8'));
function within(a,b,t){ if(a==null||b==null) return false; return Math.abs(a-b)<=t; }
function pickConsensus(cands, field, tol, priority){
  const vals = cands.map(c=>({provider:c.provider, v:c.spec[field]})).filter(x=>x.v!==null && x.v!==undefined);
  if(!vals.length) return { value:null, providers:[], agreement:0 };
  const groups=[];
  vals.forEach(x=>{ let g=groups.find(g=>within(g.value,x.v,tol)); if(!g) groups.push({value:x.v,items:[x]}); else g.items.push(x); });
  groups.sort((a,b)=>b.items.length-a.items.length);
  let winner = groups[0];
  if(groups.length>1 && groups[0].items.length===groups[1].items.length){
    const aBest = groups[0].items.sort((x,y)=>priority.indexOf(x.provider)-priority.indexOf(y.provider))[0];
    const bBest = groups[1].items.sort((x,y)=>priority.indexOf(x.provider)-priority.indexOf(y.provider))[0];
    winner = priority.indexOf(aBest.provider)<=priority.indexOf(bBest.provider) ? groups[0] : groups[1];
  }
  const nums = winner.items.map(i=>i.v).sort((a,b)=>a-b);
  const mid = Math.floor(nums.length/2);
  const median = nums.length%2 ? nums[mid] : (nums[mid-1]+nums[mid])/2;
  return { value: median, providers: winner.items.map(i=>i.provider), agreement: winner.items.length/vals.length };
}
function reconcile(all){
  const pri = cfg.priority, tol = cfg.tolerances;
  const fields = [["kw",tol.kw],["co2_wltp",tol.co2_wltp],["mma",tol.mma],["cc",tol.cc]];
  const consensus={}, provenance={}, agrees=[];
  for(const [f,t] of fields){
    const r = pickConsensus(all,f,t,pri);
    consensus[f]=r.value; provenance[f]={providers:r.providers,agreement:r.agreement};
    if(r.value!==null) agrees.push(r.agreement);
  }
  function pickString(field){
    const vals = all.map(c=>({provider:c.provider,v:c.spec[field]})).filter(x=>x.v!==undefined && x.v!==null && x.v!=='');
    if(!vals.length) return { value:null, providers:[], agreement:0 };
    const counts={}; vals.forEach(x=>counts[x.v]=(counts[x.v]||0)+1);
    const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const topCount = entries[0][1]; const ties = entries.filter(e=>e[1]===topCount).map(e=>e[0]);
    let chosen = ties[0];
    if(ties.length>1){
      const byProv = vals.filter(v=>ties.includes(v.v)).sort((a,b)=>pri.indexOf(a.provider)-pri.indexOf(b.provider));
      chosen = byProv[0].v;
    }
    const provs = vals.filter(v=>v.v===chosen).map(v=>v.provider);
    return { value: chosen, providers: provs, agreement: provs.length/vals.length };
  }
  const fuel=pickString('fuel'), hybrid=pickString('is_hybrid'), electric=pickString('is_electric'), cycle=pickString('cycle');
  consensus.fuel=fuel.value; consensus.is_hybrid = (hybrid.value===true||hybrid.value==='true');
  consensus.is_electric=(electric.value===true||electric.value==='true'); consensus.cycle=cycle.value||'WLTP';
  provenance.fuel=fuel; provenance.is_hybrid=hybrid; provenance.is_electric=electric; provenance.cycle=cycle;
  if(agrees.length) agrees.push(fuel.agreement, hybrid.agreement, electric.agreement);
  const agreement = agrees.length ? (agrees.reduce((a,b)=>a+b,0)/agrees.length) : 0;
  return { ...consensus, _provenance: provenance, _agreement: agreement };
}
module.exports = { reconcile };
