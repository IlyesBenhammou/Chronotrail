// Liste de coureurs statiques
const coureurs = [
  { id: 1, nom: 'Jean', prenom: 'Dupont', email: 'jean@example.com', dossard: '', presence: null },
  { id: 2, nom: 'Marie', prenom: 'Curie', email: 'marie@example.com', dossard: '', presence: null },
  { id: 3, nom: 'Pierre', prenom: 'Durand', email: 'pierre@example.com', dossard: '', presence: null },
  { id: 4, nom: 'Martin', prenom: 'Sophie', email: 'sophie.martin@test.com', dossard: '', presence: null },
  { id: 5, nom: 'Bernard', prenom: 'Nicolas', email: 'nicolas.bernard@demo.com', dossard: '', presence: null },
  { id: 6, nom: 'Thomas', prenom: 'Anne', email: 'anne.thomas@sample.com', dossard: '', presence: null },
  { id: 7, nom: 'Petit', prenom: 'François', email: 'françois.petit@example.com', dossard: '', presence: null }
];

// Fonction pour afficher les coureurs
function displayPlayers() {
  console.log("Affichage des joueurs...");
  const playerListElement = document.getElementById('playerList');
  if (!playerListElement) {
    console.error("Erreur : élément #playerList introuvable !");
    return;
  }
  
  playerListElement.innerHTML = ''; // Effacer la liste actuelle

  coureurs.forEach((player, index) => {
    const playerElement = document.createElement('div');
    playerElement.classList.add('player');

    // Ajouter des classes CSS en fonction de l'état
    if (player.presence === true) {
      playerElement.classList.add('presence-validated');
    } else if (player.presence === false) {
      playerElement.classList.add('non-presence-validated');
    }
    if (player.dossard) {
      playerElement.classList.add('dossard-assigned');
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
        <button class="button" onclick="assignDossardPrompt(${index})">
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

// Fonctions de gestion de présence
function validatePresence(index) {
  console.log(`Présence validée pour : ${coureurs[index].nom}`);
  coureurs[index].presence = true;
  displayPlayers();
}

function validateNonPresence(index) {
  console.log(`Non-présence validée pour : ${coureurs[index].nom}`);
  coureurs[index].presence = false;
  displayPlayers();
}

// Fonction pour visualiser la fiche détaillée
function viewDetails(coureurId) {
  console.log(`Visualisation des détails pour le coureur ${coureurId}`);
  window.location.href = `fiche_coureur.html?id=${coureurId}`;
}

// Nouvelle version simplifiée de la gestion des dossards
function assignDossardPrompt(index) {
  const currentDossard = coureurs[index].dossard;
  const newDossard = prompt(
    currentDossard 
      ? `Dossard actuel: ${currentDossard}. Entrez le nouveau numéro :` 
      : `Entrez le numéro de dossard pour ${coureurs[index].nom} ${coureurs[index].prenom}:`,
    currentDossard || ''
  );

  if (newDossard !== null) { // Annule si l'utilisateur clique sur Annuler
    if (newDossard === '') {
      // Si champ vide, supprimer le dossard
      coureurs[index].dossard = '';
      console.log(`Dossard supprimé pour ${coureurs[index].nom}`);
    } else if (/^\d+$/.test(newDossard)) {
      // Vérifier que c'est un nombre valide
      coureurs[index].dossard = newDossard;
      console.log(`Dossard ${newDossard} attribué à ${coureurs[index].nom}`);
    } else {
      alert("Veuillez entrer un numéro valide");
      return;
    }
    displayPlayers();
  }
}

// Initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM chargé - initialisation de l'application");
  displayPlayers();
});




























// Initialisation des numéros de dossard disponibles
const maxDossardNumber = 500;
let assignedNumbers = new Set(); // Ensemble pour stocker les numéros de dossards déjà attribués

// Fonction pour générer un numéro de dossard
function assignDossard(playerId) {
  for (let i = 1; i <= maxDossardNumber; i++) {
    if (!assignedNumbers.has(i)) {
      assignedNumbers.add(i);
      document.getElementById(`dossard-${playerId}`).innerText = `Dossard: ${i}`;
      alert(`Dossard n°${i} attribué !`);
      return i;
    }
  }
  alert("Tous les numéros de dossards jusqu'à 500 ont été attribués.");
  return null;
}

// Exemple de gestion des joueurs
const playerList = [
  { id: 1, name: "Coureur 1" },
  { id: 2, name: "Coureur 2" },
  { id: 3, name: "Coureur 3" }
];

// Fonction pour afficher les joueurs
function displayPlayers() {
  const playerListContainer = document.getElementById("playerList");
  playerListContainer.innerHTML = ""; // Réinitialise la liste avant de la remplir

  playerList.forEach(player => {
    const playerDiv = document.createElement("div");
    playerDiv.className = "player";

    // Informations sur le coureur
    playerDiv.innerHTML = `
      <span>${player.name}</span>
      <span id="dossard-${player.id}">Dossard: Non attribué</span>
      <button class="button view-details" onclick="assignDossard(${player.id})">Attribuer un dossard</button>
    `;

    playerListContainer.appendChild(playerDiv);
  });
}

// Afficher la liste des coureurs au chargement
document.addEventListener("DOMContentLoaded", () => {
  displayPlayers();
});



