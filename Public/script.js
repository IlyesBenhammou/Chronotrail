document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registration-form');

    // Charger les courses
    fetch('/courses')
      .then(response => response.json())
      .then(courses => {
        const container = document.getElementById('checkbox-courses');
        courses.forEach(course => {
          const div = document.createElement('div');
          div.innerHTML = `
            <input type="checkbox" id="course-${course.id}" name="courses" value="${course.id}">
            <label for="course-${course.id}">${inscription.id} (</label>
          `;
          container.appendChild(div);
        });
      });

    // Gérer l'envoi du formulaire
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const courses = Array.from(document.querySelectorAll('input[name="courses"]:checked'))
        .map(checkbox => parseInt(checkbox.value));

      const formData = {
        nom: form.nom.value,
        prenom: form.prenom.value,
        dateNaissance: form.dateNaissance.value,
        email: form.email.value,
        telephone: form.telephone.value,
        accordPhoto: form.accordPhoto.checked,
        courses
      };

      try {
        const response = await fetch('/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const result = await response.json();
        if (response.ok) {
          alert(`Préinscription réussie !`);
          form.reset();
        } else {
          alert('Erreur: ' + (result.error || 'Erreur inconnue'));
        }
      } catch (err) {
        alert('Erreur de connexion au serveur');
        console.error(err);
      }
    });
});
