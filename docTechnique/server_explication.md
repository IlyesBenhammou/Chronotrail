# Explication du code "server.js"

Ce document explique ligne par ligne le code Node.js qui implémente un serveur web pour une application de gestion de courses de trail, permettant la gestion des coureurs, des inscriptions et des parcours.

## Importations et Configuration Initiale

```javascript
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
```

- **express** : Framework web pour Node.js qui simplifie la création d'API et d'applications web.
- **nodemailer** : Module permettant d'envoyer des emails depuis Node.js (utilisé pour les confirmations d'inscription).
- **crypto** : Module natif Node.js pour les fonctionnalités cryptographiques (importé mais non utilisé dans le code).
- **bodyParser** : Middleware pour analyser les corps des requêtes HTTP entrantes.
- **{ Pool }** : Destructuration pour importer uniquement la classe Pool du module pg (PostgreSQL).
- **path** : Module natif Node.js pour manipuler les chemins de fichiers.
- **require('dotenv').config()** : Charge les variables d'environnement depuis un fichier `.env` (bonnes pratiques pour gérer les configurations).
- **const app = express()** : Initialise une application Express.
- **const PORT = 3000** : Définit le port d'écoute du serveur.
- **let hDebut = null** : Déclare une variable pour stocker l'heure de début (non utilisée dans le code fourni).

## Configuration de la Base de Données PostgreSQL

```javascript
// Configuration PostgreSQL
const pool = new Pool({
    user: 'postgres', // Remplace par ton utilisateur PostgreSQL
    host: 'l72.30.232.10',
    database: 'trail', // Remplace par ton nom de base de données
    password: 'Mdp-p0$tRoot', // Remplace par ton mot de passe PostgreSQL
    port: 5432,
});
```

- **const pool = new Pool({...})** : Crée un pool de connexions à la base de données PostgreSQL.
- Cette configuration contient :
  - **user** : Nom d'utilisateur pour l'authentification PostgreSQL (ici 'postgres').
  - **host** : Adresse IP ou nom d'hôte du serveur PostgreSQL.
  - **database** : Nom de la base de données à utiliser (ici 'trail').
  - **password** : Mot de passe pour l'authentification (⚠️ Attention : inclure un mot de passe en dur dans le code est une mauvaise pratique de sécurité, il serait préférable d'utiliser des variables d'environnement).
  - **port** : Port de connexion PostgreSQL (standard : 5432).
- Un pool de connexions permet de réutiliser des connexions existantes plutôt que d'en créer de nouvelles à chaque requête, ce qui améliore les performances.

## Configuration des Middlewares

```javascript
// Middleware pour analyser les données
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Servir les fichiers statiques depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));
```

- **app.use(bodyParser.urlencoded({ extended: true }))** :
  - Middleware qui analyse les corps de requête au format `application/x-www-form-urlencoded` (généralement envoyés par les formulaires HTML).
  - `extended: true` permet d'analyser des données complexes (objets imbriqués, tableaux).

- **app.use(bodyParser.json())** :
  - Middleware qui analyse les corps de requête au format JSON.
  - Permet d'accéder facilement aux données envoyées au format JSON via `req.body`.

- **app.use(express.static(path.join(__dirname, 'public')))** :
  - Middleware qui sert les fichiers statiques (HTML, CSS, JavaScript, images...) depuis le dossier 'public'.
  - `__dirname` est une variable globale Node.js qui contient le chemin du répertoire actuel.
  - `path.join()` assure la compatibilité des chemins entre différents systèmes d'exploitation.

## Routes pour les Pages Statiques

```javascript
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
```

- **app.get("/", (req, res) => {...})** :
  - Définit une route GET pour l'URL racine ("/").
  - Lorsque cette route est visitée, le serveur envoie le fichier "index.html" situé dans le dossier "public".

- **app.get("/inscription", (req, res) => {...})** :
  - Définit une route GET pour l'URL "/inscription".
  - Envoie la page "inscription.html" lorsque cette route est visitée.

- **app.get('/favicon.ico', (req, res) => {...})** :
  - Route spécifique pour servir l'icône de favoris (l'icône qui apparaît dans l'onglet du navigateur).
  - Les navigateurs demandent automatiquement ce fichier, donc avoir une route dédiée évite des erreurs 404.

## Route de Connexion (Login)

```javascript
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
```

- **app.post("/login", async (req, res) => {...})** :
  - Définit une route POST pour "/login" (formulaire de connexion).
  - Utilise `async` pour permettre l'utilisation d'opérations asynchrones avec `await`.

- **const { username, password } = req.body** :
  - Destructure l'objet `req.body` pour extraire les champs username et password.
  - Ces valeurs viennent du formulaire de connexion envoyé par le client.

- **if (username === "admin" && password === "admin") {...}** :
  - Vérifie si l'utilisateur est l'administrateur (⚠️ Remarque: utiliser un identifiant et mot de passe admin/admin codés en dur est une mauvaise pratique de sécurité).
  - Si c'est le cas, redirige vers la page d'administration des courses.

- **let result = await pool.query(...)**
  - Exécute une requête SQL de manière asynchrone (en attendant sa complétion avec `await`).
  - Recherche d'abord dans la table `preinscriptioncoureur`.
  - Les paramètres `$1` et `$2` sont remplacés par les valeurs dans le tableau `[username, password]`.
  - Cette méthode protège contre les injections SQL.

- **if (result.rows.length === 0) {...}** :
  - Si aucun coureur n'est trouvé dans la première table, recherche dans la table `coureurs`.

- **if (result.rows.length > 0) {...}** :
  - Si un coureur est trouvé dans l'une des tables, redirige vers la page de gestion du coureur.
  - Sinon, affiche un message d'erreur.

- **try/catch** :
  - Gère les erreurs potentielles lors de l'exécution des requêtes SQL.
  - En cas d'erreur, enregistre les détails dans la console et envoie un message d'erreur HTTP 500.

## Route de Préinscription des Coureurs

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
```

### Analyse détaillée de la route de préinscription

- **app.post('/api/preinscription', async (req, res) => {...})** :
  - Crée un endpoint API POST pour gérer les préinscriptions des coureurs.

- **console.log('Données reçues:', req.body)** :
  - Enregistre les données reçues dans la console pour le débogage.

- **const { nomcoureur, prenomcoureur, ... } = req.body** :
  - Extrait les champs du corps de la requête avec destructuration.
  - `accordphoto = false` et `courses = []` définissent des valeurs par défaut si ces champs sont absents.

- **Validation des données** :
  - Vérifie que tous les champs obligatoires sont présents.
  - Retourne une erreur 400 (Bad Request) si ce n'est pas le cas.

- **Vérification des doublons** :
  - Vérifie si un coureur avec le même email existe déjà.
  - Retourne une erreur 400 si c'est le cas.

- **Transaction SQL** :
  - `const client = await pool.connect()` : Obtient une connexion depuis le pool.
  - `await client.query('BEGIN')` : Démarre une transaction SQL.
  - Les transactions garantissent que soit toutes les opérations sont effectuées, soit aucune (en cas d'erreur).

- **Insertion du coureur** :
  - Ajoute le nouveau coureur dans la table `coureurs`.
  - `RETURNING *` demande à PostgreSQL de retourner l'enregistrement complet créé.

- **Inscription aux courses** :
  - Pour chaque course sélectionnée par le coureur :
    1. Vérifie si la course existe
    2. Crée une entrée dans la table `inscription` reliant le coureur et la course

- **Validation de la transaction** :
  - `await client.query('COMMIT')` : Confirme toutes les opérations SQL si tout s'est bien passé.

- **Configuration de Nodemailer** :
  - Crée un transporteur pour l'envoi d'emails via Gmail.
  - ⚠️ Remarque : Les identifiants sont codés en dur, il serait préférable d'utiliser des variables d'environnement.

- **Envoi d'un email de confirmation** :
  - Prépare un email HTML avec les informations du coureur.
  - L'email explique également comment se connecter (prénom comme nom d'utilisateur, nom comme mot de passe).
  - L'envoi d'email est asynchrone mais ne bloque pas la réponse au client.

- **Gestion des erreurs** :
  - Si une erreur se produit pendant la transaction : `ROLLBACK` annule toutes les opérations.
  - `finally { client.release() }` garantit que la connexion est toujours libérée.
  - Une réponse d'erreur 500 est envoyée en cas de problème serveur.

## Route pour la Création d'une Course

```javascript
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
```

### Analyse détaillée de la route de création de course

- **app.post('/save-course', async (req, res) => {...})** :
  - Définit une route POST pour enregistrer une nouvelle course.

- **const { nomcourse, heurecourse, ... } = req.body** :
  - Extrait les informations de la course du corps de la requête.
  - Valeurs par défaut : `nb_maxparticipants = 50` et `tempsfinal = null`.

- **Calcul de distance** :
  - Si des coordonnées sont fournies, calcule la distance totale du parcours.
  - Utilise la formule de Haversine pour calculer la distance entre deux points géographiques :
    1. R = 6371 km (rayon de la Terre)
    2. Convertit les différences de latitude et longitude en radians
    3. Utilise la formule trigonométrique pour calculer la distance sur une sphère
    4. Additionne les distances pour obtenir la distance totale du parcours

- **Préparation de la requête SQL** :
  - Crée une requête paramétrée pour insérer la nouvelle course.
  - `$7::jsonb` indique que le septième paramètre doit être converti en type JSONB (format JSON binaire de PostgreSQL).
  - `RETURNING *` demande à PostgreSQL de retourner l'enregistrement complet après insertion.

- **Gestion du format des coordonnées** :
  - `JSON.stringify(coordonee)` convertit le tableau JavaScript des coordonnées en chaîne JSON.
  - Cette chaîne sera automatiquement convertie en JSONB par PostgreSQL grâce au typage explicite.

- **Exécution de la requête** :
  - `await pool.query(query, values)` exécute la requête SQL avec les valeurs fournies.

- **Réponse au client** :
  - Log de confirmation en console.
  - Réponse HTTP 201 (Created) avec les détails de la course créée.

- **Gestion des erreurs** :
  - En cas d'erreur, log détaillé et réponse HTTP 500 avec message explicatif.

## Routes pour la Gestion des Courses

```javascript
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
```

### Analyse des routes de gestion des courses

- **Route GET "/course/:id"** :
  - Récupère les détails d'une course spécifique par son ID.
  - `:id` est un paramètre de route, accessible via `req.params.id`.
  - Retourne une erreur 404 si la course n'existe pas.
  - Retourne les détails de la course en format JSON si trouvée.

- **Route GET "/courses"** :
  - Récupère toutes les courses disponibles.
  - Tri des résultats par date (plus récent d'abord) avec `ORDER BY datecourse DESC`.
  - Retourne un tableau JSON de toutes les courses.

- **Route DELETE "/course/:id"** :
  - Permet de supprimer une course par son ID.
  - Processus en deux étapes :
    1. Vérifie si la course existe avant de tenter de la supprimer
    2. Effectue la suppression si la course existe
  - `RETURNING idcourse` permet de confirmer l'ID de la course supprimée.
  - Logs détaillés pour faciliter le débogage.
  - Retourne une confirmation avec l'ID supprimé en cas de succès.

## Routes pour la Gestion des Coureurs

```javascript
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
```

- **Route GET "/api/coureurs"** :
  - Récupère la liste de tous les coureurs préinscrits.
  - Tri alphabétique par nom puis prénom.
  - Retourne un tableau JSON de tous les coureurs.
  - Remarque : Cette route récupère les données de la table `preinscriptioncoureur` et non de la table `coureurs`, bien que le reste du code semble utiliser principalement la table `coureurs`.

## Démarrage du Serveur

```javascript
// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en ligne : http://localhost:${PORT}`);
});
```

- **app.listen(PORT, callback)** :
  - Démarre le serveur Express sur le port spécifié (3000).
  - La fonction callback s'exécute une fois le serveur démarré.
  - Affiche un message dans la console avec l'URL du serveur local.

## Problèmes de Sécurité Identifiés

Le code contient plusieurs problèmes de sécurité qui devraient être corrigés :

1. **Identifiants codés en dur** :
   - Les identifiants de la base de données et de Gmail sont directement dans le code.
   - Meilleure pratique : Utiliser des variables d'environnement (`.env`).

2. **Authentification faible** :
   - Identifiants admin/admin en clair dans le code.
   - Les coureurs s'authentifient avec prénom/nom (sans cryptage).
   - Meilleure pratique : Utiliser un système d'authentification sécurisé avec hachage de mot de passe.

3. **Absence de validation approfondie des entrées** :
   - La validation se limite à vérifier si les champs sont remplis.
   - Meilleure pratique : Valider le format et la taille des données côté serveur