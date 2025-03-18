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
    res.sendFile(path.join(__dirname, "public", "connexion.html"));
});

// Route pour gérer la connexion
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Requête pour vérifier si l'utilisateur existe dans la base de données
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length > 0) {
            // L'utilisateur existe, vérifier le mot de passe
            const user = result.rows[0];

            if (user.password === password) {
                // Si le mot de passe est correct, rediriger vers la page appropriée
                if (user.role === "admin") {
                    res.sendFile(path.join(__dirname, "public", "choixCourseAdmin.html"));
                } else if (user.role === "coureur") {
                    res.sendFile(path.join(__dirname, "public", "gestion_journe_coureur.html"));
                } else {
                    res.send("<h1>Rôle non reconnu</h1>");
                }
            } else {
                // Mot de passe incorrect
                res.send("<h1>Mot de passe incorrect</h1>");
            }
        } else {
            // Utilisateur non trouvé
            res.send("<h1>Identifiant incorrect</h1>");
        }
    } catch (err) {
        console.error('Erreur lors de la connexion à la base de données', err);
        res.status(500).send("<h1>Erreur serveur: ${err.message} </h1>");
    }
}); // <---- Fermeture de la fonction post /login

// Route pour démarrer le chronomètre
app.get('/demarrer-chrono', (req, res) => {
    hDebut = new Date();
    res.json({ hDebut: hDebut.getTime() });
});




// Route unifiée pour sauvegarder une course complète avec toutes les informations
app.post('/save-course', async (req, res) => {
    // Récupération de toutes les données possibles
    const { 
        nom,           // Nom de la course
        date,          // Date de la course
        depart,        // Point de départ
        arrive,        // Point d'arrivée
        coordinates    // Coordonnées du parcours
    } = req.body;
    
    try {
        // Validation des données essentielles
        if (!nom) {
            return res.status(400).json({ error: 'Le nom de la course est obligatoire' });
        }
        
        // Validation des coordonnées si elles sont fournies
        let jsonCoordinates = null;
        if (coordinates) {
            if (!Array.isArray(coordinates)) {
                return res.status(400).json({ 
                    error: 'Les coordonnées doivent être un tableau de points' 
                });
            }
            
            // Vérifier que chaque élément est une paire [longitude, latitude]
            const validCoordinates = coordinates.every(coord => 
                Array.isArray(coord) && coord.length === 2 &&
                typeof coord[1] === 'number' && typeof coord[0] === 'number'
            );
            
            if (!validCoordinates) {
                return res.status(400).json({ 
                    error: 'Chaque coordonnée doit être une paire [longitude, latitude] valide.' 
                });
            }
            
            // Convertir les coordonnées en format JSONB
            jsonCoordinates = JSON.stringify(coordinates);
        }
        
        // Requête SQL pour insérer toutes les données
        const query = `
            INSERT INTO courses (nom, date, depart, arrive, coordinates) 
            VALUES ($1, $2, $3, $4, $5::jsonb) 
            RETURNING *
        `;
        
        const values = [nom, date, depart, arrive, jsonCoordinates];
        const result = await pool.query(query, values);
        
        console.log("Course sauvegardée avec succès:", result.rows[0]);
        res.status(201).json({ 
            message: "Course sauvegardée avec succès", 
            course: result.rows[0] 
        });
    } catch (err) {
        console.error('Erreur lors de la sauvegarde de la course:', err);
        res.status(500).json({ 
            error: "Erreur serveur lors de la sauvegarde", 
            details: err.message 
        });
    }
});

// Route pour récupérer une course par son ID
app.get('/course/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const query = 'SELECT * FROM courses WHERE id = $1';
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Course non trouvée' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Erreur lors de la récupération de la course:", err);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération de la course', 
            details: err.message 
        });
    }
});

// Route pour récupérer toutes les courses
app.get('/courses', async (req, res) => {
    try {
        const query = 'SELECT * FROM courses ORDER BY date DESC';
        const result = await pool.query(query);
        
        res.json(result.rows);
    } catch (err) {
        console.error("Erreur lors de la récupération des courses:", err);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des courses', 
            details: err.message 
        });
    }
});



app.post("/envoyer-email", async (req, res) => {
    const { email } = req.body; // Récupérer l'email du formulaire

    // Créer un transporteur avec les paramètres de Gmail
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'thomasbilhaut8@gmail.com', // Remplace par ton adresse Gmail
            pass: 'uive noxt vzov lgme', // Remplace par ton mot de passe d'application
        },
    });

    // Générer un resetToken unique avec crypto
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Définir les options de l'email
    const mailOptions = {
        from: 'thomasbilhaut8@gmail.com', // Ton adresse Gmail
        to: email, // L'email récupéré depuis le formulaire
        subject: 'Réinitialisation de votre mot de passe',
        text: 'Voici le lien pour réinitialiser votre mot de passe : [lien]',
        html: '<p>Cliquez sur ce lien pour réinitialiser votre mot de passe : <a href=`http://localhost:3000/reset-password?email=${email}&token=${resetToken}`>Cliquez ici pour réinitialiser votre mot de passe</a></p>',
    };

    // Envoyer l'email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Erreur lors de l\'envoi de l\'email:', error);
            res.status(500).send('Erreur lors de l\'envoi de l\'email.');
        } else {
            console.log('Email envoyé avec succès:', info.response);
            res.sendFile(path.join(__dirname, "public", "connexion.html"));
            res.send('Un email de réinitialisation a été envoyé à ' + email);

        }
    });
});

// Route pour afficher la page de réinitialisation avec l'email et le token dans l'URL
app.get('/reset-password', (req, res) => {
    const { token, email } = req.query;  // Récupère le token et l'email de l'URL
    
    if (token && email) {
        // Rediriger vers la page HTML avec les paramètres dans l'URL
        res.redirect(`/reinitialisation.html?token=${token}&email=${email}`);
    } else {
        res.send('Lien invalide ou expiré.');
    }
});

app.post('/reset-password-submit', async (req, res) => {
    const { username, newPassword} = req.body;

    try {
        const result = await pool.query('UPDATE users SET password = $1 WHERE username = $2',[newPassword, username]);

        console.log("mise a jour réussie :", result.rows[0]);
        res.status(201).json({ message: "mise a jour ajoutée avec succès", course: result.rows[0] });
    } catch (err) {
        console.error('Erreur lors de l\'de la mise a jour des données', err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});




// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en ligne : http://localhost:${PORT}`);
});


