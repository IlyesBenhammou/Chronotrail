const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = 3000;

let hDebut = null;

// Configuration PostgreSQL
const pool = new Pool({
    user: 'admin', // Remplace par ton utilisateur PostgreSQL
    host: 'localhost',
    database: 'trail', // Remplace par ton nom de base de données
    password: 'admin', // Remplace par ton mot de passe PostgreSQL
    port: 5432,
});

// Middleware pour analyser les données
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Servir les fichiers statiques depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Route pour afficher la page de connexion
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "connexion.html"));
});

// Route pour gérer la connexion
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "admin") {
        res.sendFile(path.join(__dirname, "public", "choixCourseAdmin.html"));
    } else if (username === "coureur" && password === "coureur") {
        res.sendFile(path.join(__dirname, "public", "gestion_journe_coureur.html"));
    } else {
        res.send("<h1>Identifiant ou mot de passe incorrect</h1>");
    }
});

// Route pour démarrer le chronomètre
app.get('/demarrer-chrono', (req, res) => {
    hDebut = new Date();
    res.json({ hDebut: hDebut.getTime() });
});

// API pour ajouter une course dans la base de données
app.post('/ajoutCourse', async (req, res) => {
    const { nomCourse, dateCourse, departCourse, arriveCourse } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO infojourne (nom, date, depart, arrive) VALUES ($1, $2, $3, $4) RETURNING *',
            [nomCourse, dateCourse, departCourse, arriveCourse]
        );
        console.log("Insertion réussie :", result.rows[0]);
        res.status(201).json({ message: "Course ajoutée avec succès", course: result.rows[0] });
    } catch (err) {
        console.error('Erreur lors de l\'insertion des données', err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en ligne : http://localhost:${PORT}`);
});

