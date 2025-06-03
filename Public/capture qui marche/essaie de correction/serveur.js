const express = require("express");
const app = express();
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");

app.use(cors());
app.use(express.json());

// Servir les fichiers statiques dans ./public
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "trail",
  password: "Mdp-p0$tRoot",
  port: 5432,
});

const PORT = 4000;

// Lancer une course
app.post("/api/lancer-course", async (req, res) => {
  const { idcourse } = req.body;
  if (!idcourse) {
    return res.status(400).json({ error: "ID course manquant" });
  }
  try {
    await pool.query(`
      UPDATE inscription
      SET heure_depart = CURRENT_TIMESTAMP,
          heure_arrivee = NULL
      WHERE idcourse = $1
    `, [idcourse]);
    await pool.query(`
      UPDATE course
      SET heure_fin = NULL
      WHERE idcourse = $1
    `, [idcourse]);
    res.status(200).json({ message: "✅ Course lancée." });
  } catch (error) {
    console.error("[Lancer course] Erreur :", error);
    res.status(500).json({ error: "Erreur serveur lors du lancement de la course" });
  }
});

// Terminer une course
app.post("/api/terminer-course", async (req, res) => {
  const { idcourse } = req.body;
  if (!idcourse) {
    return res.status(400).json({ error: "ID course manquant" });
  }
  try {
    await pool.query(`
      UPDATE course
      SET heure_fin = CURRENT_TIMESTAMP
      WHERE idcourse = $1
    `, [idcourse]);
    res.status(200).json({ message: "✅ Course terminée." });
  } catch (error) {
    console.error("[Terminer course] Erreur :", error);
    res.status(500).json({ error: "Erreur serveur lors de la terminaison de la course" });
  }
});

// Enregistrer temps arrivée via RFID
app.post("/api/temps-course", async (req, res) => {
  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ error: "UID manquant dans la requête" });
  }
  try {
    // Recherche dossard avec uid
    const dossardRes = await pool.query("SELECT * FROM dossards WHERE uid = $1", [uid]);
    if (dossardRes.rows.length === 0) {
      return res.status(400).json({ error: "❌ UID inconnu." });
    }
    const dossard = dossardRes.rows[0];

    // Recherche inscription active
    const inscriptionRes = await pool.query(`
      SELECT i.*, c.heure_fin
      FROM inscription i
      JOIN course c ON i.idcourse = c.idcourse
      WHERE i.idcoureur = $1
        AND i.heure_depart IS NOT NULL
        AND i.heure_arrivee IS NULL
        AND c.heure_fin IS NULL
      ORDER BY c.datecourse DESC, i.heure_depart DESC
LIMIT 1

    `, [dossard.idcoureur]);

    if (inscriptionRes.rows.length === 0) {
      return res.status(400).json({ error: "❌ Aucune inscription active trouvée pour ce coureur." });
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
      idinscription: inscription.idinscription
    });
  } catch (err) {
    console.error("[Temps-course] Erreur :", err);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement du temps" });
  }
});

// Mettre à jour la photo finish dans inscription
app.post("/api/temps-course/ajout-photo", async (req, res) => {
  const { idinscription, photo } = req.body;

  // Validation des paramètres obligatoires
  if (!idinscription || !photo) {
    return res.status(400).json({ error: "idinscription et photo sont requis" });
  }
  console.log("[Ajout photo] Reçu :", req.body);

  try {
    // Mise à jour dans la base de données
    const result = await pool.query(
      "UPDATE inscription SET photo = $1 WHERE idinscription = $2",
      [photo, idinscription]
    );

    if (result.rowCount === 0) {
      // Aucun enregistrement mis à jour => idinscription invalide
      return res.status(404).json({ error: "Inscription non trouvée" });
    }

    // Succès
    res.status(200).json({ message: "✅ Photo enregistrée dans la base" });
  } catch (err) {
    // Gestion des erreurs serveur
    console.error("[Ajout photo] Erreur :", err);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout de la photo" });
  }
});


// Récupérer inscription par id
app.get("/api/inscription/:idinscription", async (req, res) => {
  const { idinscription } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM inscription WHERE idinscription = $1",
      [idinscription]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Inscription non trouvée" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("[GET inscription] Erreur :", err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur backend RFID lancé sur http://localhost:${PORT}`);
});
