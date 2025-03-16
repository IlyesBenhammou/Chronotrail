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


// Route POST pour sauvegarder un parcours
app.post('/save-trail', async (req, res) => {
    const { name, coordinates } = req.body;

    try {
        // Vérification des données reçues
        if (!name || !Array.isArray(coordinates)) {
            return res.status(400).json({ error: 'Nom et coordonnées sont requis' });
        }

        // Vérifier que chaque élément est une paire [longitude, latitude]
        const validCoordinates = coordinates.every(coord => 
            Array.isArray(coord) && coord.length === 2 && 
            typeof coord[0] === 'number' && typeof coord[1] === 'number'
        );

        if (!validCoordinates) {
            return res.status(400).json({ error: 'Chaque coordonnée doit être une paire [longitude, latitude] valide.' });
        }

        // Convertir les coordonnées en format JSONB
        const jsonCoordinates = JSON.stringify(coordinates);

        // Requête pour insérer les données dans la table
        const query = 'INSERT INTO parcours (name, coordinates) VALUES ($1, $2::jsonb) RETURNING *';
        const values = [name, jsonCoordinates];

        const { rows } = await pool.query(query, values);

        // Réponse de succès
        res.json({ message: 'Parcours enregistré avec succès', trail: rows[0] });
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement du parcours :', err);
        res.status(500).json({ error: 'Erreur lors de l\'enregistrement du parcours' });
    }
});



// Route pour récupérer les parcours depuis la base de données
app.get('/get-trail/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Utilisation de l'id dynamique pour la requête
        const query = 'SELECT * FROM parcours WHERE id = $1';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Parcours non trouvé' });
        }

        const trail = result.rows[0];
        res.json(trail);  // Renvoie directement l'objet JavaScript
    } catch (err) {
        console.error("Erreur lors de la récupération du parcours:", err);  // Afficher l'erreur plus précisément
        res.status(500).json({ error: 'Erreur lors de la récupération du parcours', details: err.message });
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


