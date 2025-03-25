const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();


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
    res.sendFile(path.join(__dirname, "public", "gestionJournee.html"));
});



// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en ligne : http://localhost:${PORT}`);
});


