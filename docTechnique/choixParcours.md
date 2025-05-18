# Explication du code JavaScript pour la gestion des parcours

Ce document explique ligne par ligne le code JavaScript qui gère l'affichage et la suppression des parcours de trail. Ce script fait partie d'une page web liée à l'application de gestion des courses de trail.

## Fonction de redirection vers les détails d'un parcours

```javascript
function redirectToTrail(id) {
    window.location.href = `detailTrail.html?id=${id}`;
}
```

- **function redirectToTrail(id) {...}** :
  - Fonction qui redirige l'utilisateur vers la page de détails d'un parcours spécifique.
  - Prend en paramètre l'ID du parcours à consulter.
  - `window.location.href = ...` : Modifie l'URL actuelle du navigateur.
  - `` `detailTrail.html?id=${id}` `` : Utilise les template strings (littéraux de gabarits) pour créer l'URL de destination avec l'ID du parcours en paramètre GET.

## Configuration des événements pour la boîte de dialogue de confirmation

```javascript
document.getElementById('cancel-delete').addEventListener('click', closeDialog);
document.getElementById('confirm-delete').addEventListener('click', () => {
    if (courseToDeleteId) {
        deleteCourse(courseToDeleteId);
        closeDialog();
    }
});
```

- **document.getElementById('cancel-delete').addEventListener('click', closeDialog)** :
  - Ajoute un écouteur d'événement sur le bouton "Annuler" de la boîte de dialogue.
  - Quand l'utilisateur clique sur ce bouton, la fonction `closeDialog` est appelée (cette fonction n'est pas définie dans l'extrait mais ferme probablement la boîte de dialogue).

- **document.getElementById('confirm-delete').addEventListener('click', () => {...})** :
  - Ajoute un écouteur d'événement sur le bouton "Confirmer" de la boîte de dialogue.
  - Utilise une fonction fléchée comme gestionnaire d'événement.
  - Vérifie si `courseToDeleteId` est défini (cette variable contient l'ID du parcours à supprimer).
  - Si l'ID est présent :
    1. Appelle la fonction `deleteCourse` avec l'ID du parcours.
    2. Ferme la boîte de dialogue en appelant `closeDialog`.

## Chargement des parcours depuis le serveur

```javascript
// Charger les parcours
fetch('/courses')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(courses => {
        document.getElementById('loading-message').style.display = 'none';
        const container = document.getElementById('parcours-container');
        
        if (!courses || courses.length === 0) {
            document.getElementById('error-message').innerText = "Aucun parcours disponible.";
            document.getElementById('error-message').style.display = 'block';
            return;
        }
        
        courses.forEach(course => {
            const card = document.createElement('div');
            card.className = 'parcours-card';
            card.setAttribute('data-course-id', course.idcourse);
            card.onclick = () => redirectToTrail(course.idcourse);
            
            const dateStr = course.datecourse ? new Date(course.datecourse).toLocaleString('fr-FR') : 'Date non spécifiée';
            
            card.innerHTML = `
                <div class="parcours-content">
                    <h3>${course.nomcourse || `Parcours #${course.idcourse}`}</h3>
                    <p class="location">Départ: ${course.heure_depart || 'Non spécifié'} → Arrivée: ${course.heure_arrivee || 'Non spécifié'}</p>
                    <p class="date">${dateStr}</p>
                    <p class="distance">${course.distance ? `Distance: ${course.distance} km` : ''}</p>
                    <p class="participants">Max participants: ${course.nb_max_participants || 'Non spécifié'}</p>
                    <button class="delete-btn" onclick="showDeleteConfirmation(${course.idcourse}, event)">Supprimer</button>
                </div>
            `;
            
            container.appendChild(card);
        });
    })
    .catch(error => {
        console.error("Erreur lors du chargement des parcours:", error);
        document.getElementById('loading-message').style.display = 'none';
        const err = document.getElementById('error-message');
        err.innerText = `Erreur: ${error.message}`;
        err.style.display = 'block';
    });
```

### Analyse détaillée du chargement des parcours

- **fetch('/courses')** :
  - Effectue une requête HTTP GET vers l'endpoint '/courses' du serveur.
  - Cet endpoint correspond à la route définie dans server.js qui renvoie la liste de toutes les courses.
  - L'API Fetch retourne une Promise qui se résout avec l'objet Response.

- **Premier .then(response => {...})** :
  - Traite la réponse initiale de la requête.
  - Vérifie si la réponse est valide (`response.ok`).
  - Si la réponse n'est pas OK (code HTTP différent de 200-299), lance une erreur avec le statut HTTP.
  - Sinon, analyse le corps de la réponse comme du JSON avec `response.json()`.

- **Second .then(courses => {...})** :
  - Traite les données JSON reçues (tableau de courses/parcours).
  - `document.getElementById('loading-message').style.display = 'none'` : Masque le message de chargement.
  - Récupère le conteneur où les cartes de parcours seront affichées.

- **Gestion du cas où aucun parcours n'est disponible** :
  - Vérifie si `courses` est null/undefined ou si le tableau est vide.
  - Si c'est le cas, affiche un message d'erreur et termine la fonction.

- **Boucle forEach pour créer les cartes de parcours** :
  - Parcourt chaque objet `course` dans le tableau.
  - Pour chaque parcours :
    1. Crée un élément `div` qui servira de carte.
    2. Définit la classe CSS et l'attribut data-* pour stocker l'ID du parcours.
    3. Ajoute un gestionnaire d'événement onclick qui redirige vers la page détaillée du parcours.
    4. Formate la date avec `toLocaleString('fr-FR')` pour l'afficher au format français.
    5. Utilise des opérateurs de nullish coalescing (`||`) pour gérer les cas où certaines propriétés sont undefined.
    6. Génère le HTML de la carte avec un template string incluant toutes les informations du parcours.
    7. Ajoute un bouton "Supprimer" avec un gestionnaire d'événement `showDeleteConfirmation`.
    8. Ajoute la carte créée au conteneur principal.

- **Gestion des erreurs avec .catch(error => {...})** :
  - Capture toute erreur survenue lors de la requête ou du traitement des données.
  - Affiche l'erreur dans la console pour le débogage.
  - Masque le message de chargement.
  - Affiche un message d'erreur à l'utilisateur avec les détails de l'erreur.

## Points techniques importants

1. **Programmation asynchrone** :
   - Utilisation de l'API Fetch qui est basée sur les Promises pour les requêtes HTTP.
   - Chaînage de méthodes `.then()` pour traiter les données de manière asynchrone.
   - Gestion des erreurs avec `.catch()`.

2. **Manipulation du DOM** :
   - Création dynamique d'éléments HTML avec `document.createElement()`.
   - Modification des propriétés d'affichage avec `.style.display`.
   - Injection de contenu HTML avec `.innerHTML`.
   - Ajout d'éléments au DOM avec `.appendChild()`.

3. **Gestion des événements** :
   - Utilisation de `.addEventListener()` pour les boutons de la boîte de dialogue.
   - Attribution directe de gestionnaires d'événements avec `.onclick`.
   - Utilisation d'événements inline avec le bouton Supprimer (`onclick="..."`).

4. **Formatage et affichage des données** :
   - Gestion des valeurs nulles ou non définies avec l'opérateur `||`.
   - Utilisation de l'API `Date` pour formater les dates.
   - Utilisation des template strings pour une génération HTML plus lisible.

5. **Gestion de la propagation d'événements** :
   - La fonction `showDeleteConfirmation` est probablement appelée avec le paramètre `event` pour arrêter la propagation de l'événement et éviter que le clic sur le bouton "Supprimer" ne déclenche également la redirection vers la page de détails.

## Fonctions externes référencées mais non définies dans cet extrait

1. **closeDialog()** - Ferme probablement la boîte de dialogue de confirmation.
2. **deleteCourse(id)** - Envoie probablement une requête DELETE au serveur pour supprimer un parcours.
3. **showDeleteConfirmation(id, event)** - Affiche probablement la boîte de dialogue de confirmation et définit `courseToDeleteId`.

## Recommandations d'amélioration

Pour améliorer ce code, on pourrait :
- Utiliser `async/await` pour une meilleure lisibilité du code asynchrone
- Séparer la logique de création des cartes dans une fonction dédiée
- Utiliser des méthodes plus sécurisées que `.innerHTML` pour injecter du contenu dynamique
- Implémenter une gestion d'erreurs plus détaillée
- Ajouter une confirmation visuelle après la suppression d'un parcours
- Implémenter une pagination si le nombre de parcours devient important