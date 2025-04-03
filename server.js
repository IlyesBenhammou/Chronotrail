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
    user: 'postgres', // Remplace par ton utilisateur PostgreSQL
    host: '172.30.232.10',
    database: 'trail', // Remplace par ton nom de base de données
    password: 'Mdp-p0$tRoot', // Remplace par ton mot de passe PostgreSQL
    port: 5432,
});

// Middleware pour analyser les données
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Servir les fichiers statiques depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Route pour afficher la page de connexion
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "test_interactionbdd.html"));
});

// Assurez-vous que cette route est bien définie dans votre fichier serveur
app.get('/coureurs', async (req, res) => {
    const { nom } = req.query;
    
    if (!nom) {
        return res.status(400).send('Nom de famille requis.');
    }
    
    try {
        const result = await pool.query(
            'SELECT * FROM preinscriptioncoureur WHERE nomcoureur ILIKE $1',
            [`%${nom}%`]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur de la base de données:', error);
        res.status(500).send('Erreur interne du serveur.');
    }
});

// Route for updating accordphoto field
app.put('/coureurs/:id/accordphoto', async (req, res) => {
    const id = req.params.id;
    const { accordphoto } = req.body;
    
    try {
        const result = await pool.query(
            'UPDATE preinscriptioncoureur SET accordphoto = $1 WHERE idcoureur = $2 RETURNING *',
            [accordphoto, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Coureur non trouvé' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'accord photo:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Route for updating presencevalide field
app.put('/coureurs/:id/presencevalide', async (req, res) => {
    const id = req.params.id;
    const { presencevalide } = req.body;
    
    try {
        const result = await pool.query(
            'UPDATE preinscriptioncoureur SET presencevalide = $1 WHERE idcoureur = $2 RETURNING *',
            [presencevalide, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Coureur non trouvé' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la présence:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Existing route for retrieving coureur details
app.get('/coureurs/:id', async (req, res) => {
    const id = req.params.id;
    
    try {
        const result = await pool.query(
            'SELECT * FROM preinscriptioncoureur WHERE idcoureur = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Coureur non trouvé' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération des détails du coureur:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

  

    




// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en ligne : http://localhost:${PORT}`);
});


