require('dotenv').config(); // Charge les variables d'environnement au début

const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');
const session = require('express-session');
const cors = require('cors'); // Charger cors

const app = express(); // ← Créer app AVANT de l'utiliser

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.use(cors({
    origin: ['http://localhost:3000', 'http://172.30.232.10:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

const PORT = 3000;


// Configuration PostgreSQL
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT),

});
// Configuration des sessions

app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
    }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('/home/projet-chrono/capture_photo/public'));

// Middleware d’authentification simple
function requireAdminAuth(req, res, next) {
    if (req.session && req.session.authenticated && req.session.userType === 'admin') {
        next();
    } else {
        res.redirect('/connexion.html');
    }
}

// Routes publiques
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/connexion.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'connexion.html'));
});

app.get('/inscription', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'inscription.html'));
});

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

app.get("/gestion_journee.html", (req, res) => {
    if (req.session.authenticated && req.session.userType === 'admin') {
        res.sendFile(path.join(__dirname, "protection", "gestion_journee.html"));
    } else {
        res.redirect('/connexion.html');
    }
});
// Route protégée
app.get("/choixParcours.html", (req, res) => {
    if (req.session.authenticated && req.session.userType === 'admin') {
        res.sendFile(path.join(__dirname, "protection", "choixParcours.html"));
    } else {
        res.redirect('/connexion.html');
    }
});

app.get("/Gestion_des_coureurs.html", (req, res) => {
    if (req.session.authenticated && req.session.userType === 'admin') {
        res.sendFile(path.join(__dirname, "protection", "Gestion_des_coureurs.html"));
    } else {
        res.redirect('/connexion.html');
    }
});



app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Cas admin
        if (username === ADMIN_USERNAME  && password === ADMIN_PASSWORD ) {
            req.session.authenticated = true;
            req.session.userType = ADMIN_USERNAME;
            req.session.username = username;

            // Redirige vers la page admin
            return res.redirect('/choixCourseAdmin.html');
        }

        // Sinon, mauvais identifiants
        res.status(401).send('Identifiants invalides');
    } catch (err) {
        console.error('Erreur lors de la connexion à la base de données', err);
        res.status(500).send(`<h1>Erreur serveur: ${err.message}</h1>`);
    }
});

// Route logout (optionnel)
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Erreur lors de la déconnexion:', err);
            return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
        }
        res.redirect('/connexion.html');
    });
});



// --- COUREURS ---
app.get('/api/coureurs', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *, 
                   (SELECT iddossard FROM dossards WHERE dossards.idcoureur = coureurs.idcoureur) AS iddossard 
            FROM coureurs
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.put('/api/coureurs/:id', async (req, res) => {
    const { id } = req.params;
    const { nomcoureur, prenomcoureur, datenaissance, email, telephone, accordphoto, present } = req.body;
    try {
        await pool.query(`
            UPDATE coureurs SET
                nomcoureur = $1,
                prenomcoureur = $2,
                datenaissance = $3,
                email = $4,
                telephone = $5,
                accordphoto = $6,
                present = $7
            WHERE idcoureur = $8
        `, [nomcoureur, prenomcoureur, datenaissance, email, telephone, accordphoto, present, id]);
        res.json({ message: 'Mise à jour réussie' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// --- COURSES ---
app.get('/api/coureurs/:id/courses', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                c.nomcourse,
                c.datecourse,
                c.distance,
                c.heure_depart,
                d.numero AS numerodossard
            FROM inscription i
            JOIN course c ON c.idcourse = i.idcourse
            LEFT JOIN dossards d ON d.idcoureur = i.idcoureur
            WHERE i.idcoureur = $1
            ORDER BY c.datecourse DESC
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur récupération courses :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/api/courses', async (req, res) => {
    try {
        const result = await pool.query('SELECT idcourse, nomcourse FROM course ORDER BY nomcourse');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur récupération des courses' });
    }
});

app.get('/api/coureurs-by-course/:idcourse', async (req, res) => {
    const { idcourse } = req.params;
    try {
        const result = await pool.query(`
            SELECT c.*, d.iddossard
            FROM coureurs c
            JOIN inscription i ON i.idcoureur = c.idcoureur
            LEFT JOIN dossards d ON d.idcoureur = c.idcoureur
            WHERE i.idcourse = $1
        `, [idcourse]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur récupération coureurs par course' });
    }
});

// --- DOSSARDS ---
app.get('/api/dossards', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM dossards ORDER BY numero');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/api/dossards/:iddossard', async (req, res) => {
    const { iddossard } = req.params;
    try {
        const result = await pool.query('SELECT numero FROM dossards WHERE iddossard = $1', [iddossard]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Dossard non trouvé' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/assign-dossard', async (req, res) => {
    const { dossardId, coureurId } = req.body;
    try {
        // Libérer l'ancien dossard (le cas échéant)
        await pool.query(
          'UPDATE dossards SET idcoureur = NULL, disponible = true WHERE idcoureur = $1',
          [coureurId]
        );
        // Assigner le nouveau
        await pool.query(
          'UPDATE dossards SET idcoureur = $1, disponible = false WHERE iddossard = $2',
          [coureurId, dossardId]
        );
        res.json({ message: 'Dossard attribué avec succès.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// --- INSCRIPTIONS ---
app.post('/api/inscriptions', async (req, res) => {
    const { idcoureur, idcourse } = req.body;
    try {
        const exist = await pool.query(
          'SELECT * FROM inscription WHERE idcoureur = $1 AND idcourse = $2',
          [idcoureur, idcourse]
        );
        if (exist.rows.length > 0) {
            return res.status(400).json({ message: 'Déjà inscrit.' });
        }
        await pool.query(
          'INSERT INTO inscription (idcoureur, idcourse, heure_depart) VALUES ($1, $2, NOW())',
          [idcoureur, idcourse]
        );
        res.json({ message: 'Inscription réussie' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.put('/api/dossards/:iddossard', async (req, res) => {
    const { iddossard } = req.params;
    const { disponible } = req.body;
    try {
        await pool.query(
          'UPDATE dossards SET disponible = $1 WHERE iddossard = $2',
          [disponible, iddossard]
        );
        res.json({ message: 'Mise à jour réussie' });
    } catch (err) {
        console.error('Erreur mise à jour dossard :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});



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
            
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS // Mot de passe d'application
                }
            });
            
            
            // Options de l'email
            const mailOptions = {
                from: process.env.EMAIL_USER,
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
    const {nomcourse,heurecourse,depart,arrive,coordonee,nb_maxparticipants = 50,tempsfinal = null} = req.body;
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

// Fonction pour générer le nom de photo automatiquement
function generatePhotoName(courseId, heureArrivee) {
    if (!heureArrivee) return null;
    
    const date = new Date(heureArrivee);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `photo_${courseId}_${year}${month}${day}_${hours}${minutes}${seconds}.jpg`;
}

// Fonction pour vérifier si un fichier photo existe
function checkPhotoExists(photoName) {
    if (!photoName) return false;
    const photoPath = path.join(__dirname, 'photo_capture', photoName);
    return fs.existsSync(photoPath);
}

// Fonction pour trouver une photo correspondante dans le dossier
function findMatchingPhoto(courseId, heureArrivee) {
    if (!heureArrivee) return null;
    
    const photoCaptureDir = path.join(__dirname, 'photo_capture');
    
    try {
        // Lister tous les fichiers du dossier photo_capture
        const files = fs.readdirSync(photoCaptureDir);
        
        // Pattern pour les photos de cette course
        const coursePattern = new RegExp(`photo_${courseId}_\\d{8}_\\d{6}\\.jpg`);
        
        // Trouver les photos qui correspondent à cette course
        const coursePhotos = files.filter(file => coursePattern.test(file));
        
        if (coursePhotos.length === 0) return null;
        
        // Générer le nom attendu basé sur l'heure d'arrivée
        const expectedPhotoName = generatePhotoName(courseId, heureArrivee);
        
        // Vérifier si la photo exacte existe
        if (coursePhotos.includes(expectedPhotoName)) {
            return expectedPhotoName;
        }
        
        // Si pas de correspondance exacte, prendre la première photo disponible pour cette course
        // (vous pouvez ajuster cette logique selon vos besoins)
        return coursePhotos[0];
        
    } catch (error) {
        console.error('❌ Erreur lors de la recherche de photo:', error);
        return null;
    }
}

// Fonction pour mettre à jour automatiquement les photos
async function updatePhotosAutomatically(courseId) {
    try {
        // Récupérer toutes les inscriptions avec heure d'arrivée mais sans photo
        // MODIFICATION: Ajouter la jointure avec la table coureurs pour vérifier accordphoto
        const inscriptionsRes = await pool.query(`
            SELECT i.idinscription, i.idcourse, i.idcoureur, i.heure_arrivee, i.photo, c.accordphoto
            FROM inscription i
            JOIN coureurs c ON i.idcoureur = c.idcoureur
            WHERE i.idcourse = $1 AND i.heure_arrivee IS NOT NULL
        `, [courseId]);
        
        for (const inscription of inscriptionsRes.rows) {
            let photoToAssign = null;
            
            // MODIFICATION: Vérifier accordphoto avant d'assigner une photo
            if (inscription.accordphoto === true) {
                // Si pas de photo assignée, essayer de trouver une photo
                if (!inscription.photo) {
                    photoToAssign = findMatchingPhoto(courseId, inscription.heure_arrivee);
                } else {
                    // Vérifier si la photo assignée existe encore
                    if (!checkPhotoExists(inscription.photo)) {
                        photoToAssign = findMatchingPhoto(courseId, inscription.heure_arrivee);
                    }
                }
            } else {
                // Si accordphoto est false, supprimer la photo existante
                if (inscription.photo) {
                    photoToAssign = null; // Explicitly set to null to remove photo
                    console.log(`🚫 Photo supprimée pour inscription ${inscription.idinscription} - accord photo retiré`);
                }
            }
            
            // Mettre à jour si une photo a été trouvée ou si on doit supprimer une photo
            if (photoToAssign !== undefined && photoToAssign !== inscription.photo) {
                await pool.query(`
                    UPDATE inscription 
                    SET photo = $1 
                    WHERE idinscription = $2
                `, [photoToAssign, inscription.idinscription]);
                
                if (photoToAssign) {
                    console.log(`📸 Photo assignée: ${photoToAssign} pour inscription ${inscription.idinscription}`);
                } else {
                    console.log(`🗑️ Photo supprimée pour inscription ${inscription.idinscription}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour automatique des photos:', error);
    }
}

app.get('/course/:id', async (req, res) => {
    const courseId = req.params.id;
    
    try {
        // Mettre à jour automatiquement les photos avant de récupérer les données
        await updatePhotosAutomatically(courseId);
        
        const courseRes = await pool.query('SELECT * FROM course WHERE idcourse = $1', [courseId]);
        if (courseRes.rows.length === 0) {
            return res.status(404).json({ error: 'Course non trouvée' });
        }
        
        // 🔍 Debug - Voir toutes les inscriptions avec accordphoto
        const debugAllInscriptions = await pool.query(`
            SELECT 
                i.idcourse,
                c.idcoureur,
                c.nomcoureur,
                c.prenomcoureur,
                c.accordphoto,
                i.heure_depart,
                i.heure_arrivee,
                i.photo,
                CASE 
                    WHEN i.heure_depart IS NULL THEN 'DEPART_NULL'
                    WHEN i.heure_arrivee IS NULL THEN 'ARRIVEE_NULL'
                    ELSE 'COMPLETE'
                END as statut
            FROM inscription i
            JOIN coureurs c ON i.idcoureur = c.idcoureur
            WHERE i.idcourse = $1
            ORDER BY c.nomcoureur
        `, [courseId]);
        
        console.log('🔍 DEBUG - Toutes les inscriptions avec accordphoto:', debugAllInscriptions.rows);
        
        // MODIFICATION: Classement avec LEFT JOIN incluant accordphoto
        const classementQuery = `
            SELECT 
                i.idcourse,
                i.idcoureur,
                c.nomcoureur,
                c.prenomcoureur,
                c.accordphoto,
                i.heure_depart,
                i.heure_arrivee,
                i.heure_arrivee - i.heure_depart AS temps_total,
                EXTRACT(EPOCH FROM i.heure_arrivee - i.heure_depart) AS temps_total_secondes,
                CASE 
                    WHEN c.accordphoto = true THEN i.photo
                    ELSE NULL
                END AS photo,
                RANK() OVER (
                    ORDER BY EXTRACT(EPOCH FROM i.heure_arrivee - i.heure_depart)
                ) AS classement
            FROM inscription i
            LEFT JOIN coureurs c ON i.idcoureur = c.idcoureur
            WHERE i.idcourse = $1
                AND i.heure_depart IS NOT NULL
                AND i.heure_arrivee IS NOT NULL
            ORDER BY classement;
        `;
        
        const classementResult = await pool.query(classementQuery, [courseId]);
        const classement = classementResult.rows;
        
        // MODIFICATION: Coureurs sans temps complets avec accordphoto
        const inscritsSansTempsRes = await pool.query(`
            SELECT c.nomcoureur, c.prenomcoureur, c.idcoureur, c.accordphoto,
                   i.heure_depart, i.heure_arrivee
            FROM inscription i
            JOIN coureurs c ON i.idcoureur = c.idcoureur
            WHERE i.idcourse = $1
            AND (i.heure_depart IS NULL OR i.heure_arrivee IS NULL)
            ORDER BY c.nomcoureur, c.prenomcoureur
        `, [courseId]);
        
        console.log('📋 COUREURS EN ATTENTE avec accordphoto:', inscritsSansTempsRes.rows);
        
        // Formatage des timestamps pour le front-end
        classement.forEach(row => {
            if (row.heure_depart) row.heure_depart = new Date(row.heure_depart).toISOString();
            if (row.heure_arrivee) row.heure_arrivee = new Date(row.heure_arrivee).toISOString();
        });
        
        const course = {
            ...courseRes.rows[0],
            classement: classement,
            inscritsSansTemps: inscritsSansTempsRes.rows
        };
        
        res.json(course);
        
    } catch (err) {
        console.error('❌ Erreur serveur:', err);
        res.status(500).json({ error: 'Erreur serveur' });
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