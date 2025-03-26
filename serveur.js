const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = 4000;

// 🔧 Connexion PostgreSQL
const pool = new Pool({
    user: "admin",
    host: "localhost",
    database: "trail",
    password: "admin",
    port: 5432
});

app.use(cors());
app.use(express.json());

// 📡 API pour enregistrer les temps de course (départ/arrivée)
app.post("/api/temps-course", async (req, res) => {
    const { uid } = req.body;

    if (!uid) {
        return res.status(400).json({ error: "UID requis" });
    }

    try {
        // Vérifier si l'UID est inscrit dans une course
        let result = await pool.query(
            "SELECT id_course, dossard, nom_coureur, date_depart, temps FROM participants WHERE uid = $1",
            [uid]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "UID non trouvé dans une course." });
        }

        let { id_course, dossard, nom_coureur, date_depart, temps } = result.rows[0];

        if (date_depart === null) {
            // 🔄 Premier passage → Départ
            await pool.query("UPDATE participants SET date_depart = NOW() WHERE uid = $1", [uid]);
            console.log(`✅ Départ enregistré pour ${nom_coureur} (Dossard ${dossard}, Course ${id_course})`);
            return res.json({ message: "Départ enregistré", dossard, id_course, nom_coureur });
        } else if (temps === null) {
            // 🏁 Deuxième passage → Arrivée
            let resultTime = await pool.query(
                "SELECT EXTRACT(EPOCH FROM (NOW() - date_depart)) AS elapsed_time FROM participants WHERE uid = $1",
                [uid]
            );
            let elapsedTime = parseFloat(resultTime.rows[0].elapsed_time).toFixed(2);

            // Mettre à jour le temps final
            await pool.query("UPDATE participants SET temps = $1 WHERE uid = $2", [elapsedTime, uid]);
            console.log(`🏁 Temps final : ${elapsedTime} sec - ${nom_coureur} (Dossard ${dossard}, Course ${id_course})`);
            return res.json({ message: "Temps de course enregistré", dossard, id_course, nom_coureur, temps: elapsedTime });
        }

    } catch (err) {
        console.error("❌ Erreur PostgreSQL :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// 🚀 Lancer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur en écoute sur http://0.0.0.0:${PORT}`);
});
