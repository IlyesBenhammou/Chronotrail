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
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route pour la page d'inscription
app.get("/inscription", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "inscription.html"));
});

// Ajout d'une route pour servir un favicon
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Cas 1 : admin
        if (username === "admin" && password === "admin") {
            return res.sendFile(path.join(__dirname, "public", "choixCourseAdmin.html"));
        }

        // Cas 2 : vérification dans la table preinscriptioncoureur ou coureurs
        // D'abord, vérifions dans preinscriptioncoureur
        let result = await pool.query(
            'SELECT * FROM preinscriptioncoureur WHERE prenomcoureur = $1 AND nomcoureur = $2',
            [username, password]
        );

        // Si non trouvé, vérifions dans la table coureurs
        if (result.rows.length === 0) {
            result = await pool.query(
                'SELECT * FROM coureurs WHERE prenomcoureur = $1 AND nomcoureur = $2',
                [username, password]
            );
        }

        if (result.rows.length > 0) {
            // Si le coureur est trouvé
            return res.sendFile(path.join(__dirname, "public", "gestion_journe_coureur.html"));
        } else {
            // Aucun utilisateur trouvé
            return res.send("<h1>Identifiant ou mot de passe incorrect</h1>");
        }

    } catch (err) {
        console.error('Erreur lors de la connexion à la base de données', err);
        res.status(500).send(`<h1>Erreur serveur: ${err.message}</h1>`);
    }
});

// Endpoint pour traiter les préinscriptions des coureurs
// Endpoint pour traiter les préinscriptions des coureurs
app.post('/api/preinscription', async (req, res) => {
    try {
        // Log pour débogage
        console.log('Données reçues:', req.body);
        
        // Récupérer les données du formulaire
        const {
            nomcoureur,
            prenomcoureur,
            email,
            telephone,
            datenaissance,
            accordphoto = false,
            courses = [] // Récupérer les courses sélectionnées
        } = req.body;
        
        // Vérifier si les données requises sont présentes
        if (!nomcoureur || !prenomcoureur || !email || !telephone || !datenaissance) {
            return res.status(400).json({
                error: "Tous les champs obligatoires doivent être remplis"
            });
        }
        
        // Vérifier si l'email existe déjà dans la table coureurs
        const checkEmail = await pool.query(
            'SELECT * FROM coureurs WHERE email = $1',
            [email]
        );
        
        if (checkEmail.rows.length > 0) {
            return res.status(400).json({
                error: "Un coureur avec cet email est déjà inscrit"
            });
        }
        
        // Début d'une transaction pour garantir l'intégrité des données
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Insérer le nouveau coureur dans la base de données
            const coureurQuery = `
                INSERT INTO coureurs 
                (nomcoureur, prenomcoureur, datenaissance, email, telephone, accordphoto, present)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            
            const coureurValues = [
                nomcoureur,
                prenomcoureur,
                datenaissance,
                email,
                telephone,
                accordphoto,
                false // present = false par défaut
            ];
            
            const coureurResult = await client.query(coureurQuery, coureurValues);
            const newCoureur = coureurResult.rows[0];
            
            // Si des courses sont sélectionnées, créer des inscriptions
            if (courses && courses.length > 0) {
                for (const courseId of courses) {
                    // Vérifier si la course existe
                    const courseCheck = await client.query(
                        'SELECT * FROM course WHERE idcourse = $1',
                        [courseId]
                    );
                    
                    if (courseCheck.rows.length === 0) {
                        throw new Error(`La course avec l'ID ${courseId} n'existe pas`);
                    }
                    
                    // Insérer l'inscription dans la table inscription
                    await client.query(
                        'INSERT INTO inscription (idcoureur, idcourse) VALUES ($1, $2)',
                        [newCoureur.idcoureur, courseId]
                    );
                }
            }
            
            // Valider la transaction
            await client.query('COMMIT');
            
            console.log("Préinscription enregistrée avec succès:", newCoureur);
            
            // Configuration du transporteur pour l'envoi d'emails
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'thomasbilhaut8@gmail.com',
                    pass: 'uive noxt vzov lgme' // Mot de passe d'application
                }
            });
            
            // Options de l'email
            const mailOptions = {
                from: 'thomasbilhaut8@gmail.com',
                to: email,
                subject: 'Confirmation de préinscription - ChronoTrail',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                        <h1 style="color: #4a90e2;">Confirmation de préinscription</h1>
                        <p>Bonjour <strong>${prenomcoureur} ${nomcoureur}</strong>,</p>
                        <p>Nous avons bien reçu votre préinscription aux courses ChronoTrail.</p>
                        <p>Voici un récapitulatif de vos informations :</p>
                        <ul>
                            <li><strong>Nom :</strong> ${nomcoureur}</li>
                            <li><strong>Prénom :</strong> ${prenomcoureur}</li>
                            <li><strong>Date de naissance :</strong> ${datenaissance}</li>
                            <li><strong>Email :</strong> ${email}</li>
                            <li><strong>Téléphone :</strong> ${telephone}</li>
                        </ul>
                        <p>Vous pouvez vous connecter à notre plateforme en utilisant votre <strong>prénom</strong> comme nom d'utilisateur et votre <strong>nom</strong> comme mot de passe.</p>
                        <p>Cordialement,<br>L'équipe ChronoTrail</p>
                    </div>
                `
            };
            
            // Envoyer l'email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Erreur lors de l\'envoi de l\'email:', error);
                    // On continue malgré l'erreur d'envoi d'email
                } else {
                    console.log('Email envoyé avec succès:', info.response);
                }
            });
            
            // Répondre au client avec un succès
            res.status(201).json({
                message: "Préinscription enregistrée avec succès",
                coureur: newCoureur
            });
            
        } catch (err) {
            // En cas d'erreur, annuler la transaction
            await client.query('ROLLBACK');
            throw err;
        } finally {
            // Toujours libérer le client à la fin
            client.release();
        }
        
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement de la préinscription:', err);
        res.status(500).json({
            error: "Erreur serveur lors de l'enregistrement",
            details: err.message
        });
    }
});


// Endpoint pour la création d'une course
app.post('/save-course', async (req, res) => {
    const {
        nomcourse,
        heurecourse,
        depart,
        arrive,
        coordonee,
        nb_maxparticipants = 50,
        tempsfinal = null
    } = req.body;
    
    try {
        // Calculer la distance approximative en km
        let distance = 0;
        if (coordonee && coordonee.length > 1) {
            for (let i = 1; i < coordonee.length; i++) {
                // Calcul approximatif de la distance entre deux points en km
                const lat1 = coordonee[i-1][0];
                const lon1 = coordonee[i-1][1];
                const lat2 = coordonee[i][0];
                const lon2 = coordonee[i][1];
                
                // Formule haversine pour calculer la distance
                const R = 6371; // Rayon de la Terre en km
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                          Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const d = R * c;
                
                distance += d;
            }
            // Arrondir à deux décimales
            distance = Math.round(distance * 100) / 100;
        }
        
        // Adaptation à la structure de la table course
        const query = `
            INSERT INTO course (nomcourse, datecourse, distance, heure_depart, heure_arrivee, nb_max_participants, coordonnees)
            VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
            RETURNING *
        `;
        
        // Convertir les coordonnées en format JSON pour PostgreSQL
        const jsonCoordinates = coordonee ? JSON.stringify(coordonee) : null;
        
        const values = [
            nomcourse,               // nomcourse 
            heurecourse,             // datecourse
            distance,                // distance calculée
            depart,                  // heure_depart
            arrive,                  // heure_arrivee
            nb_maxparticipants,      // nb_max_participants
            jsonCoordinates          // coordonnees
        ];
        
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

// Route pour récupérer une course spécifique
app.get("/course/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query(
            "SELECT * FROM course WHERE idcourse = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Course non trouvée" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Erreur base de données:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// Route pour récupérer toutes les courses
app.get('/courses', async (req, res) => {
    try {
        const query = `
            SELECT c.*, 
                   COUNT(i.idcourse) AS nb_inscrits,
                   (c.nb_max_participants - COUNT(i.idcourse)) AS places_restantes
            FROM course c
            LEFT JOIN inscription i ON c.idcourse = i.idcourse
            GROUP BY c.idcourse
            ORDER BY c.datecourse DESC
        `;
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


app.delete('/course/:id', async (req, res) => {
    const id = req.params.id;
    console.log(`Tentative de suppression de la course avec ID: ${id}`);
    
    try {
        // Vérifier si la course existe
        const checkResult = await pool.query("SELECT * FROM course WHERE idcourse = $1", [id]);
        console.log('Résultat de la vérification:', checkResult.rows);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: "Course non trouvée" });
        }

        // Supprimer la course
        const deleteResult = await pool.query("DELETE FROM course WHERE idcourse = $1 RETURNING idcourse", [id]);
        console.log('Résultat de la suppression:', deleteResult.rows);

        res.status(200).json({ message: "Course supprimée avec succès", deletedId: deleteResult.rows[0].idcourse });
    } catch (error) {
        console.error("Erreur lors de la suppression de la course:", error);
        res.status(500).json({ error: "Erreur serveur lors de la suppression", details: error.message });
    }
});


// Route pour récupérer la liste des coureurs préinscrits
app.get('/api/coureurs', async (req, res) => {
    try {
        const query = 'SELECT * FROM preinscriptioncoureur ORDER BY nomcoureur, prenomcoureur';
        const result = await pool.query(query);
        
        res.json(result.rows);
    } catch (err) {
        console.error("Erreur lors de la récupération des coureurs:", err);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des coureurs', 
            details: err.message 
        });
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en ligne : http://localhost:${PORT}`);
});