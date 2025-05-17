const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();
const port = 4000;

app.use(bodyParser.json());

// Connexion à PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "trail",
  password: "Mdp-p0$tRoot",
  port: 5432,
});

// Route pour associer un UID à un dossard (si ce n’est pas déjà fait)
app.post("/api/dossards", async (req, res) => {
  const { uid } = req.body;

  try {
    // Vérifie si ce RFID est déjà associé
    const check = await pool.query("SELECT * FROM dossards WHERE uid = $1", [uid]);

    if (check.rows.length > 0) {
      return res.status(200).json({ message: "Carte déjà enregistrée." });
    }

    // Récupère un dossard libre
    const result = await pool.query("SELECT * FROM dossards WHERE disponible = true LIMIT 1");
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Aucun dossard disponible." });
    }

    const dossard = result.rows[0];

    // Associe l'UID et rend le dossard indisponible
    await pool.query("UPDATE dossards SET uid = $1, disponible = false WHERE iddossard = $2", [uid, dossard.iddossard]);

    res.status(200).json({ message: `UID associé au dossard ${dossard.numero}`, dossard: dossard.numero });
  } catch (error) {
    console.error("Erreur enregistrement dossard:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route pour enregistrer heure d’arrivée (et calcul du temps)
app.post("/api/temps-course", async (req, res) => {
  const { uid } = req.body;

  try {
    const result = await pool.query("SELECT * FROM dossards WHERE uid = $1", [uid]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "⚠️ Aucun dossard avec ce RFID" });
    }

    const dossard = result.rows[0];

    // Heure de départ déjà enregistrée ?
    if (!dossard.heure_depart) {
      const now = new Date();
      await pool.query("UPDATE dossards SET heure_depart = $1 WHERE uid = $2", [now, uid]);
      return res.status(200).json({ message: `Départ enregistré pour le dossard ${dossard.numero}` });
    }

    // Sinon, on enregistre l’heure d’arrivée
    const now = new Date();
    const temps = (now - new Date(dossard.heure_depart)) / 1000; // en secondes

    await pool.query("UPDATE dossards SET heure_arrivee = $1 WHERE uid = $2", [now, uid]);

    res.status(200).json({
      message: "Temps enregistré",
      temps: temps.toFixed(2),
      dossard: dossard.numero,
      heure_depart: dossard.heure_depart,
      heure_arrivee: now,
    });

  } catch (error) {
    console.error("Erreur enregistrement du temps:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Serveur démarré sur le port ${port}`);
});
