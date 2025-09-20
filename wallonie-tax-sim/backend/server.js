
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { getMakes, getModels, getYears, getTrims, getSpecs } = require('./providers');
const { computeTMC } = require('./services/tmc');
const { computeAnnualTax } = require('./services/annual_tax');

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.get('/api/health', (req,res)=>res.json({ok:true}));

app.get('/api/makes', async (req,res)=> res.json(await getMakes()));
app.get('/api/models', async (req,res)=>{
  const { make } = req.query; if(!make) return res.status(400).json({error:"Param 'make' requis"});
  res.json(await getModels(make));
});
app.get('/api/years', async (req,res)=>{
  const { make, model } = req.query; if(!make || !model) return res.status(400).json({error:"Params 'make' et 'model' requis"});
  res.json(await getYears(make, model));
});
app.get('/api/trims', async (req,res)=>{
  const { make, model, year } = req.query; if(!make || !model || !year) return res.status(400).json({error:"Params 'make','model','year' requis"});
  res.json(await getTrims(make, model, Number(year)));
});
app.get('/api/specs', async (req,res)=>{
  const { provider_key } = req.query; if(!provider_key) return res.status(400).json({error:"Param 'provider_key' requis"});
  res.json(await getSpecs(provider_key));
});
app.get('/api/quote', async (req,res)=>{
  const { provider_key, year } = req.query;
  if(!provider_key || !year) return res.status(400).json({ error: "Params 'provider_key' et 'year' requis" });
  const spec = await getSpecs(provider_key);
  if(!spec) return res.status(404).json({ error:"Finition introuvable" });
  const tmc = computeTMC(spec, Number(year));
  const tax = computeAnnualTax(spec);
  res.json({ tmc, taxe_annuelle: tax, details: { spec, vehYear: Number(year) } });
});
app.listen(PORT, ()=>console.log(`API sur http://localhost:${PORT}`));
