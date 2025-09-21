const express = require('express');
const cors = require('cors');

// ⚠️ On force le provider "multi"
const provider = require('./providers/multi');

const app = express();
app.use(cors());
app.use(express.json());

// ===== HEALTH =====
app.get('/health', (req, res) => {
  res.json({ ok: true, provider: provider.name || 'multi' });
});

// ===== MAKES =====
app.get('/api/makes', async (req, res) => {
  try {
    const data = await provider.getMakes();
    res.json(data);
  } catch (e) {
    console.error('Error /api/makes', e);
    res.status(500).json({ error: 'makes_failed' });
  }
});

// ===== MODELS =====
app.get('/api/models', async (req, res) => {
  try {
    const { make } = req.query;
    const data = await provider.getModels(make);
    res.json(data);
  } catch (e) {
    console.error('Error /api/models', e);
    res.status(500).json({ error: 'models_failed' });
  }
});

// ===== YEARS =====
app.get('/api/years', async (req, res) => {
  try {
    const { make, model } = req.query;
    const data = await provider.getYears(make, model);
    res.json(data);
  } catch (e) {
    console.error('Error /api/years', e);
    res.status(500).json({ error: 'years_failed' });
  }
});

// ===== ENGINES =====
app.get('/api/engines', async (req, res) => {
  try {
    const { make, model, year } = req.query;
    const data = await provider.getEngines(make, model, year);
    res.json(data);
  } catch (e) {
    console.error('Error /api/engines', e);
    res.status(500).json({ error: 'engines_failed' });
  }
});

// ===== QUOTE =====
app.get('/api/quote', async (req, res) => {
  try {
    const { trimId } = req.query;
    const data = await provider.getQuote(trimId);
    if (data?.error) return res.status(409).json(data);
    res.json(data);
  } catch (e) {
    console.error('Error /api/quote', e);
    res.status(500).json({ error: 'quote_failed' });
  }
});

// ===== DEBUG PROVIDER (utile pour toi) =====
app.get('/api/debug/provider', (req, res) => {
  res.json({ using: provider.name || 'multi' });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API on ${PORT}, using provider: ${provider.name || 'multi'}`);
});
