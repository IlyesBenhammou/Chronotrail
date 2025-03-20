const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json());

// Route pour recevoir les ID RFID
app.post('/rfid', (req, res) => {
    const { rfid } = req.body;
    console.log(`✅ ID RFID reçu : ${rfid}`);
    res.json({ message: "Données reçues avec succès !", rfid });
});

// Démarrer le serveur
app.listen(port, () => console.log(`🚀 Serveur Express.js en écoute sur http://localhost:${port}`));
