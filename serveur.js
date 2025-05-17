const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();
const port = 4000;

app.use(bodyParser.json());

// Connexion à la base PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "trail",
  password: "Mdp-p0$tRoot",
  port: 5432,
});

// Enregistrement du temps de départ ou d'arrivée
app.post("/api/temps-course", async (req, res) => {
  const { uid } = req.body;

  try {
    const result = await pool.query("SELECT * FROM dossards WHERE uid = $1", [uid]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "⚠️ Aucun dossard avec ce RFID" });
    }

    const dossard = result.rows[0];

    // Si pas encore de départ, on enregistre le départ
    if (!dossard.heure_depart) {
      await pool.query("UPDATE dossards SET heure_depart = CURRENT_TIMESTAMP WHERE iddossard = $1", [dossard.iddossard]);
      return res.status(200).json({
        message: "Départ enregistré",
        dossard: dossard.numero,
        uid: uid,
      });
    }

    // Si déjà un départ mais pas encore d’arrivée, on enregistre l’arrivée
    if (!dossard.heure_arrivee) {
      const arrivee = new Date();
      await pool.query("UPDATE dossards SET heure_arrivee = $1 WHERE iddossard = $2", [arrivee, dossard.iddossard]);

      const depart = new Date(dossard.heure_depart);
      const temps = ((arrivee - depart) / 1000).toFixed(2); // secondes

      return res.status(200).json({
        message: "Arrivée enregistrée",
        dossard: dossard.numero,
        temps: temps,
        heure_depart: depart,
        heure_arrivee: arrivee
      });
    }

    // Si tout est déjà enregistré
    return res.status(200).json({ message: "Temps déjà enregistré pour ce dossard." });

  } catch (error) {
    console.error("Erreur enregistrement du temps:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Serveur démarré sur le port ${port}`);
});
