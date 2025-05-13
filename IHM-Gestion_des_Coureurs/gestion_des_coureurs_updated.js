const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = 8080; // Port utilisé par l'API

// Configuration de la base de données PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'trail',
    password: 'Mdp-p0$tRoot',
    port: 5432,
});

// Middleware
app.use(bodyParser.json());
app.use(express.static('/home/projet-chrono'));

// Route pour récupérer tous les coureurs
app.get('/api/coureurs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM preinscriptioncoureur');
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur récupération :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour mettre à jour un coureur
app.put('/api/coureurs/:id', async (req, res) => {
    const { id } = req.params;
    const { nomcoureur, prenomcoureur, datenaissance, email, telephone, accordphoto, present } = req.body;

    try {
        await pool.query(
            'UPDATE preinscriptioncoureur SET nomcoureur = $1, prenomcoureur = $2, datenaissance = $3, email = $4, telephone = $5, accordphoto = $6, present = $7 WHERE idcoureur = $8',
            [nomcoureur, prenomcoureur, datenaissance, email, telephone, accordphoto, present, id]
        );
        res.json({ message: 'Mise à jour réussie' });
    } catch (err) {
        console.error('Erreur mise à jour :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour servir la page HTML
app.get('/', (req, res) => {
    res.sendFile(path.join('/home/projet-chrono', 'test.html'));
});

// Route pour vérifier la disponibilité d'un dossard
app.get('/dossards/:numero', async (req, res) => {
    const numero = req.params.numero;
    try {
        const result = await pool.query('SELECT * FROM dossards WHERE numero = $1', [numero]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Dossard non trouvé.' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Erreur lors de la vérification du dossard:', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

// Route pour attribuer un dossard à un coureur
app.post('/dossards/attribuer', async (req, res) => {
    const { numero, uid } = req.body;
    try {
        // Vérifie si le dossard est disponible
        const checkQuery = 'SELECT disponible FROM dossards WHERE numero = $1';
        const checkResult = await pool.query(checkQuery, [numero]);
        if (checkResult.rows.length === 0 || !checkResult.rows[0].disponible) {
            return res.status(400).json({ message: 'Dossard non disponible ou inexistant.' });
        }

        // Attribue le dossard
        const updateQuery = 'UPDATE dossards SET disponible = false, uid = $1, heure_depart = CURRENT_TIMESTAMP WHERE numero = $2';
        await pool.query(updateQuery, [uid, numero]);
        res.json({ message: 'Dossard attribué avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'attribution du dossard:', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

// Nouvelle route pour obtenir tous les dossards
app.get('/api/dossards', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM dossards ORDER BY numero');
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur récupération des dossards:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Nouvelle route pour obtenir uniquement les dossards disponibles
app.get('/api/dossards/disponibles', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM dossards WHERE disponible = true ORDER BY numero');
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur récupération des dossards disponibles:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Nouvelle route pour obtenir le premier dossard disponible
app.get('/api/dossards/premier-disponible', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM dossards WHERE disponible = true ORDER BY numero LIMIT 1');
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Aucun dossard disponible.' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (err) {
        console.error('Erreur récupération du premier dossard disponible:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Nouvelle route pour libérer un dossard
app.post('/api/dossards/liberer/:numero', async (req, res) => {
    const { numero } = req.params;
    try {
        // Vérifie si le dossard existe
        const checkQuery = 'SELECT * FROM dossards WHERE numero = $1';
        const checkResult = await pool.query(checkQuery, [numero]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Dossard non trouvé.' });
        }

        // Libère le dossard
        const updateQuery = 'UPDATE dossards SET disponible = true, uid = NULL, heure_arrivee = CURRENT_TIMESTAMP WHERE numero = $1';
        await pool.query(updateQuery, [numero]);
        res.json({ message: 'Dossard libéré avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la libération du dossard:', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

// Nouvelle route pour attribuer automatiquement le premier dossard disponible à un coureur
app.post('/api/dossards/attribuer-auto', async (req, res) => {
    const { uid } = req.body;
    
    // Vérifier si l'utilisateur a déjà un dossard
    try {
        const existingBib = await pool.query('SELECT * FROM dossards WHERE uid = $1', [uid]);
        if (existingBib.rows.length > 0) {
            return res.status(400).json({ 
                message: `L'utilisateur possède déjà le dossard numéro ${existingBib.rows[0].numero}` 
            });
        }
        
        // Trouver le premier dossard disponible
        const availableBib = await pool.query(
            'SELECT * FROM dossards WHERE disponible = true ORDER BY numero LIMIT 1'
        );
        
        if (availableBib.rows.length === 0) {
            return res.status(404).json({ message: 'Aucun dossard disponible.' });
        }
        
        // Attribuer le dossard
        const dossard = availableBib.rows[0];
        await pool.query(
            'UPDATE dossards SET disponible = false, uid = $1, heure_depart = CURRENT_TIMESTAMP WHERE iddossard = $2',
            [uid, dossard.iddossard]
        );
        
        res.json({ 
            message: `Dossard numéro ${dossard.numero} attribué avec succès à l'utilisateur ${uid}`,
            dossard: dossard
        });
    } catch (error) {
        console.error('Erreur lors de l\'attribution automatique du dossard:', error);
        res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

// Lancement du serveur
app.listen(port, () => {
    console.log(`Serveur en écoute sur http://172.30.232.10:${port}`);
});