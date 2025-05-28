const express = require("express");
const app = express();
const cors = require("cors");
const { Pool } = require("pg");

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // fichiers HTML

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "trail",
  password: "Mdp-p0$tRoot",
  port: 5432,
});

const PORT = 4000;

// ➤ Lancer une course (mettre heure_depart dans inscription)
app.post("/api/lancer-course", async (req, res) => {
  const { idcourse } = req.body;
  try {
    // On met heure_depart dans inscription pour toutes les inscriptions de la course
    await pool.query(`
      UPDATE inscription
      SET heure_depart = CURRENT_TIMESTAMP,
          heure_arrivee = NULL
      WHERE idcourse = $1
    `, [idcourse]);

    // On remet aussi heure_fin null dans course (course pas terminée)
    await pool.query(`
      UPDATE course
      SET heure_fin = NULL
      WHERE idcourse = $1
    `, [idcourse]);

    res.status(200).json({ message: "✅ Course lancée." });
  } catch (error) {
    console.error("Erreur lancement départ:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ➤ Terminer une course (mettre heure_fin dans course)
app.post("/api/terminer-course", async (req, res) => {
  const { idcourse } = req.body;
  try {
    await pool.query(`
      UPDATE course
      SET heure_fin = CURRENT_TIMESTAMP
      WHERE idcourse = $1
    `, [idcourse]);

    res.status(200).json({ message: "✅ Course terminée." });
  } catch (error) {
    console.error("Erreur terminaison course:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ➤ Enregistrement de l’arrivée via RFID
app.post("/api/temps-course", async (req, res) => {
  const { uid } = req.body;

  try {
    // Récupérer le dossard par UID
    const dossardRes = await pool.query("SELECT * FROM dossards WHERE uid = $1", [uid]);
    if (dossardRes.rows.length === 0) {
      return res.status(400).json({ error: "❌ UID inconnu." });
    }
    const dossard = dossardRes.rows[0];

    // Trouver une inscription active (heure_depart non null, heure_arrivee null)
    // ET course non terminée (heure_fin null)
    const inscriptionRes = await pool.query(`
      SELECT i.*, c.heure_fin 
      FROM inscription i
      JOIN course c ON i.idcourse = c.idcourse
      WHERE i.idcoureur = $1
        AND i.heure_depart IS NOT NULL
        AND i.heure_arrivee IS NULL
        AND c.heure_fin IS NULL
      ORDER BY i.heure_depart ASC
      LIMIT 1
    `, [dossard.idcoureur]);

    if (inscriptionRes.rows.length === 0) {
      return res.status(400).json({ error: "❌ Aucune inscription trouvée pour une course active." });
    }

    const inscription = inscriptionRes.rows[0];

    const arrivee = new Date();

    await pool.query(
      "UPDATE inscription SET heure_arrivee = $1 WHERE idinscription = $2",
      [arrivee, inscription.idinscription]
    );

    const depart = new Date(inscription.heure_depart);
    const temps = ((arrivee - depart) / 1000).toFixed(2);

    res.status(200).json({
      message: "✅ Arrivée enregistrée",
      dossard: dossard.numero,
      temps,
      heure_depart: depart,
      heure_arrivee: arrivee,
      idcourse: inscription.idcourse,
    });

  } catch (err) {
    console.error("Erreur enregistrement temps:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur backend RFID lancé sur http://localhost:${PORT}`);
});
