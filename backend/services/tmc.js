
const fs = require('fs'); const path = require('path');
const conf = JSON.parse(fs.readFileSync(path.join(__dirname,'..','config','tmc_2025.json'),'utf8'));
function montantBase(kW, age){ const b = conf.MB_TABLE.find(r=>kW>=r.min && kW<=r.max).mb; if(age>=15) return 61.50; const k=String(Math.min(age,14)); return +(b*conf.DEGRESS[k]).toFixed(2); }
function coeffEnergie(spec){ if(spec.is_electric){ const kw=spec.kw||0; if(kw<=120)return 0.01; if(kw<=155)return 0.10; if(kw<=249)return 0.18; return 0.26; } if(spec.is_hybrid || /hybride/i.test(spec.fuel||"")) return 0.8; return 1; }
function computeTMC(spec, year){ const now=new Date().getFullYear(); const age=Math.max(0, now-year); const MB=montantBase(spec.kw||0, age); const C=coeffEnergie(spec);
  const Xc = (spec.cycle||'WLTP').toUpperCase()==='NEDC'?conf.X.NEDC:conf.X.WLTP; const co2Factor = spec.is_electric?1:((spec.co2_wltp||0)/Xc);
  const mma = spec.mma || conf.Y; let tmc = MB * co2Factor * (mma/conf.Y) * C; tmc = Math.max(conf.MIN, Math.min(conf.MAX, tmc)); return Math.round(tmc); }
module.exports = { computeTMC };
