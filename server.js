require("dotenv").config();
const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const cors = require("cors"); // Ajout de CORS

const app = express();
const port = 9000;

// Connexion à PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'trail',
  password: process.env.DB_PASSWORD || 'Mdp-p0$tRoot', // Utilisez votre mot de passe
  port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(cors()); // Activer CORS
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Page d'accueil
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "IHM d'accueil .html"));
});

// Route API pour une course
app.get("/api/course/:id", async (req, res) => {
  const courseId = parseInt(req.params.id);

  try {
    const result = await pool.query(
      "SELECT * FROM course WHERE idcourse = $1",
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Course introuvable" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erreur lors de la récupération de la course :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Lancer le serveur
const serverAddress = '172.30.232.10'; // Utiliser votre IP Raspberry Pi
app.listen(port, () => {
  console.log(`Serveur en ligne : http://${serverAddress}:${port}`);
});