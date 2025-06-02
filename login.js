// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// __dirname vaut "/home/projet-chrono" si ce fichier est placé là
const STATIC_DIR = __dirname;

// Sert tous les fichiers statiques présents dans /home/projet-chrono
app.use(express.static(STATIC_DIR));

// Si on accède à "/" directement, on renvoie login.html par défaut
app.get('/', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'login.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
