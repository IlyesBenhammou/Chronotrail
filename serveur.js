const express = require("express");
const app = express();
const port = 4000;
const { Pool } = require("pg");

app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "trail",
  password: "Mdp-p0$tRoot",
  port: 5432,
});

// Route pour l’enregistrement des temps de course
app.post("/api/temps-course", async (req, res) => {
  const { uid } = req.body;

  try {
    // Vérifie si le dossard existe avec ce RFID
    const result = await pool.query(
      "SELECT * FROM dossards WHERE uid = $1",
      [uid]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "⚠️ Aucun dossard avec ce RFID" });
    }

    const dossard = result.rows[0];

    // Vérifie si l'heure de départ est déjà enregistrée
    if (!dossard.heure_depart) {
      await pool.query(
        "UPDATE dossards SET heure_depart = CURRENT_TIMESTAMP WHERE uid = $1",
        [uid]
      );
      console.log(`🏁 Départ enregistré pour Dossard ${dossard.numero}`);
      return res.status(200).json({
        message: `Départ enregistré pour Dossard ${dossard.numero}`,
        dossard: dossard.numero,
      });
    } else {
      // Si le départ existe déjà, on calcule le temps final
      const resultArrivee = await pool.query(
        `UPDATE dossards SET heure_arrivee = CURRENT_TIMESTAMP 
         WHERE uid = $1 RETURNING heure_depart, heure_arrivee, numero`,
        [uid]
      );

      const { heure_depart, heure_arrivee, numero } = resultArrivee.rows[0];
      const temps = (new Date(heure_arrivee) - new Date(heure_depart)) / 1000;

      console.log(`⏱️ Temps final : ${temps} sec pour Dossard ${numero}`);
      return res.status(200).json({
        temps,
        dossard: numero,
      });
    }
  } catch (error) {
    console.error("Erreur enregistrement du temps:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Serveur démarré sur le port ${port}`);
});
