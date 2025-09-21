import express from "express";
import cors from "cors";
import * as multi from "./providers/multi.js";

const app = express();
app.use(cors());
app.use(express.json());

// ---- Routes API ---- //
app.get("/api/makes", async (req, res) => {
  try {
    const makes = await multi.getMakes();
    res.json(makes);
  } catch (err) {
    console.error("Erreur /api/makes:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/models", async (req, res) => {
  try {
    const { make } = req.query;
    const models = await multi.getModels(make);
    res.json(models);
  } catch (err) {
    console.error("Erreur /api/models:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/years", async (req, res) => {
  try {
    const { make, model } = req.query;
    const years = await multi.getYears(make, model);
    res.json(years);
  } catch (err) {
    console.error("Erreur /api/years:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/engines", async (req, res) => {
  try {
    const { make, model, year } = req.query;
    const engines = await multi.getEngines(make, model, year);
    res.json(engines);
  } catch (err) {
    console.error("Erreur /api/engines:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/quote", async (req, res) => {
  try {
    const q = await multi.getQuote(req.query);
    res.json(q);
  } catch (err) {
    console.error("Erreur /api/quote:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ---- Lancement ---- //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API en ligne sur le port ${PORT}`);
});
