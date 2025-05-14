# Explication du code serveur Express pour l'application ChronoTrail

Ce document explique ligne par ligne le code serveur Node.js/Express qui gère le backend de l'application ChronoTrail, permettant la gestion des courses, l'inscription des coureurs et l'authentification.

## Importation des modules

```javascript
const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();
```

- `express` : Framework web pour Node.js qui simplifie le développement d'applications web.
- `nodemailer` : Module permettant d'envoyer des emails depuis une application Node.js.
- `crypto` : Module natif de Node.js pour la cryptographie, utilisé ici pour générer des tokens aléatoires.
- `bodyParser` : Middleware qui analyse les corps des requêtes HTTP entrantes.
- `{ Pool }` : Client PostgreSQL pour gérer la connexion à la base de données.
- `path` : Module natif de Node.js pour manipuler les chemins de fichiers.
- `dotenv` : Module pour charger les variables d'environnement depuis un fichier `.env`.

## Configuration de l'application et de la base de données

```javascript
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
```

- `app = express()` : Crée une instance d'application Express.
- `PORT = 3000` : Définit le port sur lequel le serveur écoutera.
- `hDebut = null` : Variable globale (probablement utilisée pour suivre l'heure de début d'une course).
- `pool = new Pool({...})` : Configuration de la connexion à la base de données PostgreSQL :
  - Spécifie l'utilisateur, l'hôte, le nom de la base de données, le mot de passe et le port.
  - Note: En production, ces informations sensibles devraient être stockées dans des variables d'environnement plutôt que dans le code source.

## Middleware et configuration des routes statiques

```javascript
// Middleware pour analyser les données
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Servir les fichiers statiques depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));
```

- `app.use(bodyParser.urlencoded({ extended: true }))` : Configure l'analyse des corps de requête au format URL-encoded.
- `app.use(bodyParser.json())` : Configure l'analyse des corps de requête au format JSON.
- `app.use(express.static(...))` : Configure Express pour servir les fichiers statiques (HTML, CSS, JavaScript, images) depuis le dossier 'public'.

## Routes de base pour les pages principales

```javascript
// Route pour afficher la page de connexion
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route pour la page d'inscription
app.get("/inscription", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "inscription.html"));
});
```

- Ces routes définissent comment le serveur répond aux requêtes GET pour les URLs principales :
  - `/` : Renvoie la page d'accueil (index.html) qui sert de page de connexion.
  - `/inscription` : Renvoie la page d'inscription (inscription.html).

## Route d'authentification

```javascript
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Cas 1 : admin
        if (username === "admin" && password === "admin") {
            return res.sendFile(path.join(__dirname, "public", "choixCourseAdmin.html"));
        }

        // Cas 2 : vérification dans la table preinscriptioncoureur
        const result = await pool.query(
            'SELECT * FROM preinscriptioncoureur WHERE prenomcoureur = $1 AND nomcoureur = $2',
            [username, password]
        );

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
```

- Cette route gère les tentatives de connexion (requêtes POST à `/login`) :
  - Extrait le nom d'utilisateur et le mot de passe de la requête.
  - Cas 1 : Si les identifiants correspondent à l'administrateur, redirige vers la page d'administration.
  - Cas 2 : Sinon, vérifie dans la base de données si un coureur correspond (où `prenomcoureur` = username et `nomcoureur` = password).
  - Si un coureur est trouvé, redirige vers la page de gestion coureur.
  - Sinon, affiche un message d'erreur.
  - Gère les erreurs de base de données.
- Note de sécurité : Cette implémentation présente plusieurs problèmes de sécurité :
  - Les identifiants admin sont codés en dur et très faibles.
  - Les mots de passe ne sont pas hashés.
  - Pour les coureurs, le prénom et le nom sont utilisés comme identifiants, ce qui n'est pas sécurisé.

## Route pour la préinscription des coureurs

```javascript
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
            accordphoto = false
        } = req.body;
        
        // Vérifier si les données requises sont présentes
        if (!nomcoureur || !prenomcoureur || !email || !telephone || !datenaissance) {
            return res.status(400).json({
                error: "Tous les champs obligatoires doivent être remplis"
            });
        }
        
        // Vérifier si l'email existe déjà
        const checkEmail = await pool.query(
            'SELECT * FROM preinscriptioncoureur WHERE email = $1',
            [email]
        );
        
        if (checkEmail.rows.length > 0) {
            return res.status(400).json({
                error: "Un coureur avec cet email est déjà inscrit"
            });
        }
```

- Cette route gère la préinscription des coureurs (requêtes POST à `/api/preinscription`) :
  - Affiche les données reçues dans la console pour le débogage.
  - Extrait les informations du coureur de la requête.
  - Vérifie que tous les champs obligatoires sont présents.
  - Vérifie si l'email existe déjà dans la base de données pour éviter les doublons.

## Insertion des données de préinscription et envoi d'email

```javascript
        // Insérer le nouveau coureur dans la base de données
        const query = `
            INSERT INTO preinscriptioncoureur 
            (nomcoureur, prenomcoureur, datenaissance, email, telephone, accordphoto, present)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        
        const values = [
            nomcoureur,
            prenomcoureur,
            datenaissance,
            email,
            telephone,
            accordphoto,
            false // present = false par défaut
        ];
        
        const result = await pool.query(query, values);
        console.log("Préinscription enregistrée avec succès:", result.rows[0]);
        
        // Configuration du transporteur pour l'envoi d'emails
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'thomasbilhaut8@gmail.com',
                pass: 'uive noxt vzov lgme' // Mot de passe d'application
            }
        });
        
        // Créer un jeton unique pour confirmation (optionnel)
        const confirmToken = crypto.randomBytes(20).toString('hex');
```

- Si les vérifications précédentes sont validées, insère le nouveau coureur dans la base de données :
  - Prépare la requête SQL et les valeurs.
  - Exécute la requête et récupère les données insérées.
  - Configure un transporteur Nodemailer pour envoyer des emails via Gmail.
  - Génère un jeton de confirmation unique (non utilisé dans le code actuel).
- Note de sécurité : Les identifiants email et le mot de passe de l'application sont codés en dur, ce qui n'est pas recommandé. Il faudrait utiliser des variables d'environnement.

## Préparation et envoi de l'email de confirmation

```javascript
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
            coureur: result.rows[0]
        });
```

- Configure les options de l'email :
  - Expéditeur, destinataire, sujet.
  - Contenu HTML formaté avec les informations du coureur.
  - Note: L'email contient des informations sur la méthode de connexion (utiliser prénom et nom comme identifiants).
- Envoie l'email via le transporteur Nodemailer.
- Gère les erreurs d'envoi d'email (mais continue l'exécution même en cas d'erreur).
- Renvoie une réponse de succès au client avec un code HTTP 201 (Created) et les données du coureur inséré.

## Gestion des erreurs de préinscription

```javascript
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement de la préinscription:', err);
        res.status(500).json({
            error: "Erreur serveur lors de l'enregistrement",
            details: err.message
        });
    }
});
```

- Capture les erreurs qui pourraient survenir lors du processus de préinscription.
- Affiche l'erreur dans la console pour le débogage.
- Renvoie une réponse d'erreur au client avec un code HTTP 500 (Internal Server Error) et des détails sur l'erreur.

## Route pour sauvegarder une nouvelle course

```javascript
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
```

- Cette route gère l'enregistrement d'une nouvelle course (requêtes POST à `/save-course`) :
  - Extrait les informations de la course de la requête.
  - Calcule la distance totale du parcours à partir des coordonnées GPS :
    - Utilise la formule de Haversine pour calculer la distance entre deux points géographiques.
    - Cette formule prend en compte la courbure de la Terre (rayon = 6371 km).
    - Additionne les distances entre chaque point consécutif du parcours.
    - Arrondit le résultat à deux décimales.

## Insertion des données de la course dans la base de données

```javascript
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
```

- Prépare la requête SQL pour insérer les données dans la table "course".
- Convertit les coordonnées en format JSON pour pouvoir les stocker dans PostgreSQL (type JSONB).
- Prépare les valeurs à insérer :
  - Nom, date, distance (calculée), heures, nombre max de participants, coordonnées.
- Exécute la requête et récupère les données insérées.
- En cas de succès :
  - Affiche un message de confirmation dans la console.
  - Renvoie une réponse de succès au client avec les données de la course insérée.
- En cas d'erreur :
  - Capture et affiche l'erreur dans la console.
  - Renvoie une réponse d'erreur au client.

## Route pour récupérer une course spécifique

```javascript
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
```

- Cette route permet de récupérer les détails d'une course spécifique (requêtes GET à `/course/:id`) :
  - Extrait l'ID de la course des paramètres de la requête.
  - Interroge la base de données pour récupérer la course correspondante.
  - Si aucune course n'est trouvée, renvoie une réponse 404 (Not Found).
  - Sinon, renvoie les données de la course au format JSON.
  - Gère les erreurs de base de données.

## Route pour récupérer toutes les courses

```javascript
app.get('/courses', async (req, res) => {
    try {
        const query = 'SELECT * FROM course ORDER BY datecourse DESC';
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
```

- Cette route permet de récupérer la liste de toutes les courses (requêtes GET à `/courses`) :
  - Exécute une requête SQL pour récupérer toutes les courses, triées par date (les plus récentes en premier).
  - Renvoie les résultats au format JSON.
  - Gère les erreurs de base de données.

## Route pour récupérer tous les coureurs préinscrits

```javascript
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
```

- Cette route permet de récupérer la liste de tous les coureurs préinscrits (requêtes GET à `/api/coureurs`) :
  - Exécute une requête SQL pour récupérer tous les coureurs, triés par nom puis prénom.
  - Renvoie les résultats au format JSON.
  - Gère les erreurs de base de données.

## Démarrage du serveur

```javascript
app.listen(PORT, () => {
    console.log(`Serveur en ligne : http://localhost:${PORT}`);
});
```

- Démarre le serveur Express sur le port spécifié (3000).
- Affiche un message dans la console une fois le serveur démarré, indiquant l'URL d'accès.

## Conclusion

Ce serveur Node.js/Express gère une application de gestion de courses de trail avec les fonctionnalités suivantes :
- Authentification des utilisateurs (administrateurs et coureurs).
- Préinscription des coureurs avec envoi d'email de confirmation.
- Création et gestion de courses avec calcul automatique des distances.
- Récupération des informations sur les courses et les coureurs.

La structure de la base de données PostgreSQL comprend au moins deux tables principales :
- `course` : stocke les informations sur les courses (nom, date, parcours, etc.).
- `preinscriptioncoureur` : stocke les informations sur les coureurs préinscrits.

Le code présente quelques points d'amélioration potentiels, notamment en termes de sécurité (stockage des identifiants, gestion des mots de passe, etc.).
