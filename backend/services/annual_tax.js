
const fs = require('fs'); const path = require('path');
const table = JSON.parse(fs.readFileSync(path.join(__dirname,'..','config','tc_table.json'),'utf8'));
function computeAnnualTax(spec){ if(spec.is_electric) return 0; const cc=spec.cc||0; const row = table.find(r=>cc>=r.cc_min && cc<=r.cc_max); return row?Math.round(row.tax):null; }
module.exports = { computeAnnualTax };
