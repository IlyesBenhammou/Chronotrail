// Données factices pour les coureurs
const coureursData = [
    { id: 1, nom: "Dupont", prenom: "Jean", age: 32, sexe: "M", circuit: "10km", presence: "non-verifie", dossard: null },
    { id: 2, nom: "Martin", prenom: "Sophie", age: 28, sexe: "F", circuit: "21km", presence: "non-verifie", dossard: null },
    { id: 3, nom: "Bernard", prenom: "Pierre", age: 45, sexe: "M", circuit: "42km", presence: "non-verifie", dossard: null },
    { id: 4, nom: "Petit", prenom: "Marie", age: 35, sexe: "F", circuit: "10km", presence: "non-verifie", dossard: null },
    { id: 5, nom: "Leroy", prenom: "Thomas", age: 29, sexe: "M", circuit: "21km", presence: "non-verifie", dossard: null },
    { id: 6, nom: "Moreau", prenom: "Julie", age: 41, sexe: "F", circuit: "42km", presence: "non-verifie", dossard: null },
    { id: 7, nom: "Simon", prenom: "Luc", age: 36, sexe: "M", circuit: "10km", presence: "non-verifie", dossard: null },
    { id: 8, nom: "Laurent", prenom: "Céline", age: 31, sexe: "F", circuit: "21km", presence: "non-verifie", dossard: null }
];

// Variables globales
let currentCoureurId = null;
let nextDossardNumber = 100; // Numéro de départ pour les dossards

// DOM Elements
const coureursBody = document.getElementById('coureurs-body');
const detailsSection = document.getElementById('details-section');
const coureursListSection = document.querySelector('.coureurs-list');
const searchInput = document.getElementById('search');
const circuitFilter = document.getElementById('circuit-filter');
const presenceFilter = document.getElementById('presence-filter');

// Détail elements
const detailDossard = document.getElementById('detail-dossard');
const detailNom = document.getElementById('detail-nom');
const detailPrenom = document.getElementById('detail-prenom');
const detailAge = document.getElementById('detail-age');
const detailSexe = document.getElementById('detail-sexe');
const detailCircuit = document.getElementById('detail-circuit');
const detailPresence = document.getElementById('detail-presence');

// Buttons
const btnAffecterDossard = document.getElementById('btn-affecter-dossard');
const btnPresent = document.getElementById('btn-present');
const btnAbsent = document.getElementById('btn-absent');
const btnRetour = document.getElementById('btn-retour');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    renderCoureursTable(coureursData);
    setupEventListeners();
});

function setupEventListeners() {
    // Recherche
    searchInput.addEventListener('input', filterCoureurs);
    
    // Filtres
    circuitFilter.addEventListener('change', filterCoureurs);
    presenceFilter.addEventListener('change', filterCoureurs);
    
    // Boutons
    btnAffecterDossard.addEventListener('click', affecterDossard);
    btnPresent.addEventListener('click', () => updatePresence('present'));
    btnAbsent.addEventListener('click', () => updatePresence('absent'));
    btnRetour.addEventListener('click', showCoureursList);
}

function renderCoureursTable(coureurs) {
    coureursBody.innerHTML = '';
    
    coureurs.forEach(coureur => {
        const row = document.createElement('tr');
        row.dataset.id = coureur.id;
        
        // Ajout d'un gestionnaire de clic pour afficher les détails
        row.addEventListener('click', () => showCoureurDetails(coureur.id));
        
        // Dossard
        const dossardCell = document.createElement('td');
        dossardCell.textContent = coureur.dossard || '-';
        
        // Nom
        const nomCell = document.createElement('td');
        nomCell.textContent = coureur.nom;
        
        // Prénom
        const prenomCell = document.createElement('td');
        prenomCell.textContent = coureur.prenom;
        
        // Âge
        const ageCell = document.createElement('td');
        ageCell.textContent = coureur.age;
        
        // Sexe
        const sexeCell = document.createElement('td');
        sexeCell.textContent = coureur.sexe === 'M' ? 'Homme' : 'Femme';
        
        // Circuit
        const circuitCell = document.createElement('td');
        circuitCell.textContent = coureur.circuit;
        
        // Présence
        const presenceCell = document.createElement('td');
        const presenceSpan = document.createElement('span');
        presenceSpan.textContent = getPresenceText(coureur.presence);
        presenceSpan.className = `presence-status presence-${coureur.presence === 'present' ? 'present' : coureur.presence === 'absent' ? 'absent' : 'unknown'}`;
        presenceCell.appendChild(presenceSpan);
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = `
            <button class="btn btn-small btn-present" data-id="${coureur.id}">Présent</button>
            <button class="btn btn-small btn-absent" data-id="${coureur.id}">Absent</button>
        `;
        
        // Ajout des cellules à la ligne
        row.append(dossardCell, nomCell, prenomCell, ageCell, sexeCell, circuitCell, presenceCell, actionsCell);
        
        // Ajout de la ligne au tableau
        coureursBody.appendChild(row);
    });
    
    // Ajout des écouteurs d'événements pour les boutons dans le tableau
    document.querySelectorAll('.btn-present').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            updatePresence('present', parseInt(btn.dataset.id));
        });
    });
    
    document.querySelectorAll('.btn-absent').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            updatePresence('absent', parseInt(btn.dataset.id));
        });
    });
}

function filterCoureurs() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCircuit = circuitFilter.value;
    const selectedPresence = presenceFilter.value;
    
    const filtered = coureursData.filter(coureur => {
        // Filtre de recherche
        const matchesSearch = coureur.nom.toLowerCase().includes(searchTerm) || 
                             coureur.prenom.toLowerCase().includes(searchTerm) ||
                             (coureur.dossard && coureur.dossard.toString().includes(searchTerm));
        
        // Filtre par circuit
        const matchesCircuit = selectedCircuit === 'all' || coureur.circuit === selectedCircuit;
        
        // Filtre par présence
        let matchesPresence = true;
        if (selectedPresence !== 'all') {
            matchesPresence = coureur.presence === selectedPresence;
        }
        
        return matchesSearch && matchesCircuit && matchesPresence;
    });
    
    renderCoureursTable(filtered);
}

function showCoureurDetails(coureurId) {
    currentCoureurId = coureurId;
    const coureur = coureursData.find(c => c.id === coureurId);
    
    if (coureur) {
        // Mise à jour des détails
        detailDossard.textContent = coureur.dossard || '-';
        detailNom.textContent = coureur.nom;
        detailPrenom.textContent = coureur.prenom;
        detailAge.textContent = coureur.age;
        detailSexe.textContent = coureur.sexe === 'M' ? 'Homme' : 'Femme';
        detailCircuit.textContent = coureur.circuit;
        detailPresence.textContent = getPresenceText(coureur.presence);
        detailPresence.className = `detail-value presence-${coureur.presence === 'present' ? 'present' : coureur.presence === 'absent' ? 'absent' : 'unknown'}`;
        
        // Afficher la section des détails et masquer la liste
        coureursListSection.style.display = 'none';
        detailsSection.style.display = 'block';
    }
}

function showCoureursList() {
    currentCoureurId = null;
    detailsSection.style.display = 'none';
    coureursListSection.style.display = 'block';
    filterCoureurs(); // Rafraîchir la liste
}

function affecterDossard() {
    if (currentCoureurId) {
        const coureur = coureursData.find(c => c.id === currentCoureurId);
        if (coureur && !coureur.dossard) {
            coureur.dossard = nextDossardNumber++;
            detailDossard.textContent = coureur.dossard;
            
            // Dans une application réelle, ici on enverrait la mise à jour à la base de données
            console.log(`Dossard ${coureur.dossard} affecté au coureur ${coureur.nom} ${coureur.prenom}`);
        }
    }
}

function updatePresence(status, coureurId = null) {
    const idToUpdate = coureurId || currentCoureurId;
    if (idToUpdate) {
        const coureur = coureursData.find(c => c.id === idToUpdate);
        if (coureur) {
            coureur.presence = status;
            
            // Mise à jour de l'affichage
            if (idToUpdate === currentCoureurId) {
                detailPresence.textContent = getPresenceText(status);
                detailPresence.className = `detail-value presence-${status === 'present' ? 'present' : 'absent'}`;
            }
            
            // Dans une application réelle, ici on enverrait la mise à jour à la base de données
            console.log(`Présence mise à jour pour ${coureur.nom} ${coureur.prenom}: ${status}`);
            
            // Rafraîchir la liste si on a modifié depuis les boutons dans le tableau
            if (coureurId) {
                filterCoureurs();
            }
        }
    }
}

function getPresenceText(status) {
    switch(status) {
        case 'present': return 'Présent';
        case 'absent': return 'Absent';
        default: return 'Non vérifié';
    }
}