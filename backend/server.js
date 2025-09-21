import express from "express";
import cors from "cors";
import * as multi from "./providers/multi.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, provider: "multi" });
});

app.get("/api/makes", async (req, res) => {
  try { res.json(await multi.getMakes()); }
  catch (e) { console.error(e); res.status(500).json({ error: "makes_failed" }); }
});

app.get("/api/models", async (req, res) => {
  try { res.json(await multi.getModels(req.query.make)); }
  catch (e) { console.error(e); res.status(500).json({ error: "models_failed" }); }
});

app.get("/api/years", async (req, res) => {
  try { res.json(await multi.getYears(req.query.make, req.query.model)); }
  catch (e) { console.error(e); res.status(500).json({ error: "years_failed" }); }
});

app.get("/api/engines", async (req, res) => {
  try { res.json(await multi.getEngines(req.query.make, req.query.model, req.query.year)); }
  catch (e) { console.error(e); res.status(500).json({ error: "engines_failed" }); }
});

app.get("/api/quote", async (req, res) => {
  try {
    const out = await multi.getQuote(req.query);
    if (out?.error) return res.status(409).json(out);
    res.json(out);
  } catch (e) { console.error(e); res.status(500).json({ error: "quote_failed" }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ API en ligne sur ${PORT}`));
