document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search');
    const coureurTableBody = document.getElementById('coureurTableBody');

    // Fonction pour afficher les coureurs dans le tableau
    function afficherCoureurs(coureurs) {
        coureurTableBody.innerHTML = ''; // Effacer les lignes existantes

        coureurs.forEach(coureur => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${coureur.idcoureur}</td>
                <td>${coureur.nomcoureur}</td>
                <td>${coureur.prenomcoureur}</td>
                <td>${new Date(coureur.datenaissance).toLocaleDateString()}</td>
                <td>${coureur.sexe ? 'Homme' : 'Femme'}</td>
                <td>${coureur.email}</td>
                <td>${coureur.telephone}</td>
                <td>
                    <input type="checkbox" class="accord-photo-checkbox" data-id="${coureur.idcoureur}" 
                    ${coureur.accordphoto ? 'checked' : ''}>
                </td>
                <td>
                    <input type="checkbox" class="presence-checkbox" data-id="${coureur.idcoureur}" 
                    ${coureur.presencevalide ? 'checked' : ''}>
                </td>
                <td>${new Date(coureur.dateinscription).toLocaleDateString()}</td>
                <td><button class="btn">Détails</button></td>
            `;
            coureurTableBody.appendChild(row);
        });

        // Ajouter les écouteurs d'événements pour les checkboxes
        addCheckboxEventListeners();
    }

    // Fonction pour ajouter les écouteurs d'événements aux checkboxes
    function addCheckboxEventListeners() {
        // Écouteurs pour les checkboxes d'accord photo
        const accordPhotoCheckboxes = document.querySelectorAll('.accord-photo-checkbox');
        accordPhotoCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const idCoureur = this.getAttribute('data-id');
                const nouvelleValeur = this.checked;
                
                updateCoureurField(idCoureur, 'accordphoto', nouvelleValeur);
            });
        });
        
        // Écouteurs pour les checkboxes de présence
        const presenceCheckboxes = document.querySelectorAll('.presence-checkbox');
        presenceCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const idCoureur = this.getAttribute('data-id');
                const nouvelleValeur = this.checked;
                
                updateCoureurField(idCoureur, 'presencevalide', nouvelleValeur);
            });
        });
    }

    // Fonction pour mettre à jour un champ dans la base de données
    function updateCoureurField(idCoureur, fieldName, nouvelleValeur) {
        // Créer l'objet de données dynamiquement
        const data = {};
        data[fieldName] = nouvelleValeur;
        
        fetch(`/coureurs/${idCoureur}/${fieldName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur lors de la mise à jour du champ ${fieldName}.`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Mise à jour réussie de ${fieldName}:`, data);
        })
        .catch(error => {
            console.error(`Erreur lors de la mise à jour de ${fieldName}:`, error);
        });
    }

    // Fonction pour récupérer les coureurs depuis le serveur
    function rechercherCoureurs() {
        const nom = searchInput.value;

        fetch(`/coureurs?nom=${nom}`)
            .then(response => response.json())
            .then(coureurs => {
                afficherCoureurs(coureurs);
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des coureurs:', error);
            });
    }

    // Ajouter un écouteur d'événement pour la touche "Entrée"
    searchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') { 
            event.preventDefault();
            rechercherCoureurs();
        }
    });

    // Ajouter un écouteur d'événement pour les boutons "Détails"
    coureurTableBody.addEventListener('click', function(event) {
        if (event.target.classList.contains('btn')) {
            const row = event.target.closest('tr');
            const idCoureur = row.cells[0].textContent; // Récupère l'ID du coureur à partir de la première cellule

            // Rechercher les détails du coureur en utilisant son ID
            fetch(`/coureurs/${idCoureur}`)
                .then(response => response.json())
                .then(coureur => {
                    // Vérifie si une ligne de détails existe déjà et la supprime
                    const existingDetailsRow = row.nextElementSibling;
                    if (existingDetailsRow && existingDetailsRow.classList.contains('details-row')) {
                        existingDetailsRow.remove();
                    }

                    // Afficher les détails sous la ligne du coureur
                    const detailsRow = document.createElement('tr');
                    detailsRow.classList.add('details-row');
                    detailsRow.innerHTML = `
                        <td colspan="11">
                        <table class="detail-table">
                        <tr><td><strong>Nom:</strong> ${coureur.nomcoureur}</td></tr>
                        <tr><td><strong>Prénom:</strong> ${coureur.prenomcoureur}</td></tr>
                        <tr><td><strong>Âge:</strong> ${new Date().getFullYear() - new Date(coureur.datenaissance).getFullYear()}</td></tr>
                        <tr><td><strong>Sexe:</strong> ${coureur.sexe ? 'Homme' : 'Femme'}</td></tr>
                        <tr><td><strong>Email:</strong> ${coureur.email}</td></tr>
                        <tr><td><strong>Téléphone:</strong> ${coureur.telephone}</td></tr>
                        <tr>
                        <td><strong>Accord photo:</strong> 
                        <input type="checkbox" id="detail-accordphoto-${idCoureur}" ${coureur.accordphoto ? 'checked' : ''}>
                        </td>
                        </tr>
                        <tr>
                        <td><strong>Présence:</strong> 
                        <input type="checkbox" id="detail-presence-${idCoureur}" ${coureur.presencevalide ? 'checked' : ''}>
                        </td>
                        </tr>
                        <tr><td><strong>Date inscription:</strong> ${new Date(coureur.dateinscription).toLocaleDateString()}</td></tr>
                        </table>
                        </td>
                    `;
                    row.after(detailsRow); // Ajoute la ligne après la ligne du coureur

                    // Ajouter les écouteurs d'événements pour les checkboxes dans la vue détaillée
                    // Écouteur pour la checkbox d'accord photo
                    const accordPhotoCheckbox = document.getElementById(`detail-accordphoto-${idCoureur}`);
                    accordPhotoCheckbox.addEventListener('change', function() {
                        const nouvelleValeur = accordPhotoCheckbox.checked;

                        fetch(`/coureurs/${idCoureur}/accordphoto`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ accordphoto: nouvelleValeur })
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Erreur lors de la mise à jour de l\'accord photo.');
                            }
                            return response.json();
                        })
                        .then(data => {
                            console.log('Mise à jour réussie de l\'accord photo:', data);
                            // Mettre à jour l'affichage dans le tableau principal
                            const mainTableCheckbox = document.querySelector(`.accord-photo-checkbox[data-id="${idCoureur}"]`);
                            if (mainTableCheckbox) {
                                mainTableCheckbox.checked = nouvelleValeur;
                            }
                        })
                        .catch(error => {
                            console.error('Erreur lors de la mise à jour de l\'accord photo:', error);
                        });
                    });

                    // Écouteur pour la checkbox de présence
                    const presenceCheckbox = document.getElementById(`detail-presence-${idCoureur}`);
                    presenceCheckbox.addEventListener('change', function() {
                        const nouvelleValeur = presenceCheckbox.checked;

                        fetch(`/coureurs/${idCoureur}/presencevalide`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ presencevalide: nouvelleValeur })
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Erreur lors de la mise à jour de la présence.');
                            }
                            return response.json();
                        })
                        .then(data => {
                            console.log('Mise à jour réussie de la présence:', data);
                            // Mettre à jour l'affichage dans le tableau principal
                            const mainTableCheckbox = document.querySelector(`.presence-checkbox[data-id="${idCoureur}"]`);
                            if (mainTableCheckbox) {
                                mainTableCheckbox.checked = nouvelleValeur;
                            }
                        })
                        .catch(error => {
                            console.error('Erreur lors de la mise à jour de la présence:', error);
                        });
                    });
                })
                .catch(error => {
                    console.error('Erreur lors de la récupération des détails du coureur:', error);
                });
        }
    });
});