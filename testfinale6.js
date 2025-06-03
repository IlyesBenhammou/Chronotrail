// === server.js (corrigé) ===
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = 8080;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'trail',
    password: 'Mdp-p0$tRoot',
    port: 5432,
});

// ─── 1) Body parser ─────────────────────────────────────────────────────────────
app.use(bodyParser.json()); // une seule fois suffit

// ─── 2) Protection de /help.html ────────────────────────────────────────────────
//    On intercepte toute requête GET vers /help.html avant de servir le fichier statique.
app.get('/help.html', (req, res, next) => {
    const referer = req.get('Referer') || '';
    const urlLogin = 'http://172.30.232.10:8080/login.html';

    if (referer.startsWith(urlLogin)) {
        // L'utilisateur vient bien de login.html (redirection JS) → on laisse passer
        return next();
    } else {
        // Accès direct ou Referer incorrect → on renvoie sur la page de login
        return res.redirect('/login.html');
    }
});

// ─── 3) Servir les fichiers statiques (login.html, help.html, JS, CSS, etc.) ────
app.use(express.static('/home/projet-chrono/'));

// ─── 4) Vos routes API existantes ───────────────────────────────────────────────

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

// ─── 5) Démarrage du serveur ─────────────────────────────────────────────────────
app.listen(port, () => {
    console.log(`Serveur en écoute sur http://172.30.232.10:${port}`);
});
