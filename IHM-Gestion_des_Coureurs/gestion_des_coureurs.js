// Liste de coureurs statiques (les informations des coureurs) factice 
const coureurs = [
    { id: 1, nom: 'Jean', prenom: 'Dupont', email: 'jean@example.com', dossard: '', presence: null }, // null = non défini
    { id: 2, nom: 'Marie', prenom: 'Curie', email: 'marie@example.com', dossard: '', presence: null },
    { id: 3, nom: 'Pierre', prenom: 'Durand', email: 'pierre@example.com', dossard: '', presence: null },
    { id: 4, nom: 'Martin', prenom: 'Sophie', email: 'sophie.martin@test.com', dossard: '', presence: null },
    { id: 5, nom: 'Bernard', prenom: 'Nicolas', email: 'nicolas.bernard@demo.com', dossard: '', presence: null },
    { id: 6, nom: 'Thomas', prenom: 'Anne', email: 'anne.thomas@sample.com', dossard: '', presence: null },
    { id: 7, nom: 'Petit', prenom: 'François', email: 'françois.petit@example.com', dossard: '', presence: null },



];
  
  // Fonction pour afficher les coureurs
  function displayPlayers() {
    const playerListElement = document.getElementById('playerList');
    playerListElement.innerHTML = ''; // Effacer la liste actuelle
  
    coureurs.forEach((player, index) => {
      const playerElement = document.createElement('div');
      playerElement.classList.add('player');
  
      // Ajouter une classe CSS en fonction de la présence
      if (player.presence === true) {
        playerElement.classList.add('presence-validated'); // Vert pour présence validée
      } else if (player.presence === false) {
        playerElement.classList.add('non-presence-validated'); // Rouge pour non-présence validée
      }
  
      playerElement.innerHTML = `
        <span>${player.nom} ${player.prenom}</span>
        <div>
          <button class="button" onclick="validatePresence(${index})">
            ${player.presence === true ? 'Présence validée' : 'Valider présence'}
          </button>
          <button class="button" onclick="validateNonPresence(${index})">
            ${player.presence === false ? 'Non-présence validée' : 'Valider non-présence'}
          </button>
          <button class="button" onclick="assignDossard(${index})">
            ${player.dossard ? `Dossard ${player.dossard}` : 'Affecter un dossard'}
          </button>
          <button class="button view-details" onclick="viewDetails(${player.id})">
            Visualiser la fiche détaillée
          </button>
        </div>
      `;
  
      playerListElement.appendChild(playerElement);
    });
  }
  
  // Fonction pour valider la présence d'un coureur
  function validatePresence(index) {
    coureurs[index].presence = true; // Présence validée
    displayPlayers(); // Réafficher la liste
  }
  
  // Fonction pour valider la non-présence d'un coureur
  function validateNonPresence(index) {
    coureurs[index].presence = false; // Non-présence validée
    displayPlayers(); // Réafficher la liste
  }
  
  // Fonction pour affecter un dossard à un coureur
  function assignDossard(index) {
    const dossardNumber = prompt('Entrez le numéro de dossard:');
    if (dossardNumber) {
      coureurs[index].dossard = dossardNumber;
      displayPlayers(); // Réafficher la liste
    }
  }
  
  // Fonction pour visualiser la fiche détaillée d'un coureur
  function viewDetails(coureurId) {
    window.location.href = `fiche_coureur.html?id=${coureurId}`;
  }
  
  
  // Affichage initial des coureurs
  displayPlayers();