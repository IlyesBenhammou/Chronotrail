require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

// Configuration de la base de données
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'trail',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes API
app.get('/api/coureurs', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.idcoureur, p.nomcoureur AS nom, p.prenomcoureur AS prenom, 
        p.datenaissance, p.sexe, i.presencevalide AS presence, 
        i.iddossar AS dossard, c.id_course, c.nom AS circuit
      FROM preinscriptioncoureur p
      LEFT JOIN inscription i ON p.idcoureur = i.idcoureur
      LEFT JOIN courses c ON i.idcourse = c.id_course
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/coureurs/:id/presence', async (req, res) => {
  const { id } = req.params;
  const { presence } = req.body;

  try {
    // Vérifie si une inscription existe déjà
    const check = await pool.query('SELECT 1 FROM inscription WHERE idcoureur = $1', [id]);
    
    if (check.rows.length > 0) {
      await pool.query('UPDATE inscription SET presencevalide = $1 WHERE idcoureur = $2', [presence, id]);
    } else {
      await pool.query(`
        INSERT INTO inscription (idcoureur, idcourse, presencevalide) 
        VALUES ($1, 1, $2)`, [id, presence]); // 1 = id_course par défaut
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/coureurs/:id/dossard', async (req, res) => {
  const { id } = req.params;
  const { dossard } = req.body;

  try {
    const check = await pool.query('SELECT 1 FROM inscription WHERE idcoureur = $1', [id]);
    
    if (check.rows.length > 0) {
      await pool.query('UPDATE inscription SET iddossar = $1 WHERE idcoureur = $2', [dossard, id]);
    } else {
      await pool.query(`
        INSERT INTO inscription (idcoureur, idcourse, iddossar) 
        VALUES ($1, 1, $2)`, [id, dossard]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM courses');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Servir le fichier HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});