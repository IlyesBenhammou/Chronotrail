app.post("/register", async (req, res) => {
  const { nom, prenom, email, telephone, dateNaissance, accordPhoto, courses } = req.body;

  console.log("🔹 Données reçues :", req.body);

  if (!nom || !prenom || !email || !telephone || !dateNaissance || !courses || courses.length === 0) {
    console.log("❌ Données manquantes !");
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  try {
    // Vérifier si l'email existe déjà
    console.log(`🔎 Vérification de l'email : ${email}`);
    const checkUser = await pool.query("SELECT * FROM coureur WHERE email = $1", [email]);

    if (checkUser.rows.length > 0) {
      console.log("⚠ Cet email est déjà inscrit !");
      return res.status(400).json({ error: "Cet email est déjà inscrit !" });
    }

    console.log("✅ Email disponible, inscription en cours.");

    // Insérer le coureur avec la date de naissance et l'accord photo
    const newCoureur = await pool.query(
      "INSERT INTO coureur (nom, prenom, email, telephone, date_naissance, accord_photo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [nom, prenom, email, telephone, dateNaissance, accordPhoto]
    );

    const coureurId = newCoureur.rows[0].id;
    console.log(`✅ Coureur inséré avec l'ID : ${coureurId}`);

    // Inscrire aux courses
    for (let courseId of courses) {
      console.log(`📌 Inscription du coureur ${coureurId} à la course ${courseId}`);

      await pool.query(
        "INSERT INTO inscription (coureur_id, course_id) VALUES ($1, $2)",
        [coureurId, courseId]
      );

      // Mise à jour des places restantes
      const update = await pool.query(
        "UPDATE course SET places_restantes = places_restantes - 1 WHERE id = $1 RETURNING places_restantes",
        [courseId]
      );

      if (update.rowCount === 0) {
        console.log(`❌ Problème lors de la mise à jour des places pour la course ${courseId}`);
      } else {
        console.log(`✅ Places restantes pour la course ${courseId} : ${update.rows[0].places_restantes}`);
      }
    }

    res.json({ success: true, message: "Inscription réussie !" });
  } catch (err) {
    console.error("❌ Erreur lors de l'inscription :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
