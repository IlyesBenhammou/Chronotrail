# Explication du code de "Gestion journée"

Ce document explique ligne par ligne le code HTML/CSS/JavaScript qui permet de créer une interface de gestion de courses (probablement des courses de trail ou similaires) avec une carte interactive.

## Importation des ressources externes

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css" />
<link rel="stylesheet" type="text/css" href="styleGestionJourne.css">
```

- Les quatre premières lignes importent la bibliothèque Leaflet et son extension Leaflet Draw :
  - Leaflet est une bibliothèque JavaScript open-source pour créer des cartes interactives.
  - Leaflet Draw est une extension qui permet de dessiner et d'éditer des formes sur la carte.
- La dernière ligne importe une feuille de style CSS personnalisée (`styleGestionJourne.css`) pour le design de la page.

## Corps de la page

```html
<body>
    <div class="admin-container">
        <h1>Ajouter une course</h1>
        <form id="ajout-course-form"> 
            <label for="nom_course">Nom de la course:</label>
            <input type="text" id="nom_course" name="nomCourse" required>

            <label for="date_course">Date de la course:</label>
            <input type="datetime-local" id="heure_course" name="dateCourse" required>

            <label for="depart_course">Heure de départ:</label>
            <input type="time" id="depart_course" name="departCourse" required>
            
            <label for="arrive_course">Heure d'arrivée estimée:</label>
            <input type="time" id="arrive_course" name="arriveCourse" required>
            
            <label for="nb_max_participants">Nombre maximum de participants:</label>
            <input type="number" id="nb_max_participants" name="nbMaxParticipants" value="50" min="1" required>
        </form>
    </div>
```

- `<div class="admin-container">` : Conteneur principal pour la partie formulaire.
- `<h1>Ajouter une course</h1>` : Titre principal de la page.
- `<form id="ajout-course-form">` : Formulaire pour saisir les informations de la course.
- Le formulaire contient 5 champs :
  - Nom de la course (texte)
  - Date de la course (date et heure)
  - Heure de départ (heure)
  - Heure d'arrivée estimée (heure)
  - Nombre maximum de participants (nombre, valeur par défaut: 50)
- Tous les champs sont marqués comme `required`, ce qui signifie qu'ils doivent être remplis avant soumission.

## Carte interactive

```html
<div id="map"></div>
```

- Un simple conteneur `<div>` avec l'ID "map" qui sera utilisé par Leaflet pour afficher la carte interactive.

## Boutons d'action

```html
<div class="action-buttons">
    <button id="saveButton">Sauvegarder la course</button>
    <button onclick="window.location.href='index.html'">Accéder à tous les parcours</button>
</div>
```

- `<div class="action-buttons">` : Conteneur pour les boutons d'action.
- Deux boutons :
  - Un bouton "Sauvegarder la course" avec l'ID "saveButton" qui déclenchera la sauvegarde des données.
  - Un bouton "Accéder à tous les parcours" qui redirige directement vers "index.html" via un attribut `onclick`.

## Script JavaScript - Initialisation de la carte

```javascript
var map = L.map('map').setView([48.4049, 2.7016], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
```

- **L.map('map')**
  - Origine : bibliothèque Leaflet
  - Crée une nouvelle carte Leaflet dans l'élément HTML ayant l'id="map"
  - L est l'objet global de Leaflet (toutes les classes et fonctions de Leaflet sont accessibles via L)

- **🌍 .setView([lat, lon], zoom)**
  - Centre la carte sur les coordonnées [latitude, longitude] → ici [48.4049, 2.7016] (par exemple dans le sud de Paris, près de Milly-la-Forêt)
  - 13 est le niveau de zoom :
    - 0 = vue monde
    - 18+ = zoom très proche (rue, bâtiment)
    - 13 = vue ville idéale pour un plan de parcours

- **L.tileLayer(...)**
  - Permet de définir l'image de fond de la carte (appelée "tuile" ou "tile")
  - Ici on utilise les tuiles d'OpenStreetMap, service de cartographie libre et gratuit
  - {s} : sous-domaine (a, b, ou c pour équilibrer le trafic)
  - {z} : niveau de zoom
  - {x} et {y} : coordonnées de la tuile

- **attribution**
  - Ce texte est affiché en bas à droite de la carte
  - Obligatoire pour respecter les conditions d'utilisation d'OpenStreetMap (mentionner les contributeurs)
  - Ajoute cette couche de tuiles à la carte map créée plus tôt
  - Sans cette ligne, la carte s'afficherait mais resterait grise / vide (pas de fond)

## Configuration des outils de dessin

```javascript
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
    edit: { featureGroup: drawnItems },
    draw: {
        marker: true,  // Permet d'ajouter des points
        polyline: true,  // Permet de relier les points
        polygon: false,  // Désactive l'ajout de polygones
        rectangle: false,
        circle: false
    }
});
map.addControl(drawControl);
```

- **var drawnItems = new L.FeatureGroup();**
  - Origine : bibliothèque Leaflet, plugin Leaflet Draw
  - L.FeatureGroup() : Classe de Leaflet qui représente un groupe de calques (layers), permettant de regrouper plusieurs objets géographiques pour les manipuler ensemble

- **map.addLayer(drawnItems);**
  - Origine : bibliothèque Leaflet
  - Ajoute le "layer" drawnItems à la carte, permettant d'afficher et gérer les objets dessinés

- **var drawControl = new L.Control.Draw({...})**
  - Origine : plugin Leaflet.draw
  - Crée une barre d'outils de dessin pour permettre à l'utilisateur de dessiner sur la carte
  - L'objet de configuration active/désactive certains outils

- **edit: { featureGroup: drawnItems }**
  - Configure la fonctionnalité d'édition des objets dessinés
  - Spécifie que le groupe drawnItems contient les objets que l'utilisateur pourra éditer

- **draw: { marker, polyline, polygon, rectangle, circle }**
  - Configure les outils de dessin visibles sur la carte
  - marker: true → autorise l'ajout de points (marqueurs)
  - polyline: true → autorise l'ajout de lignes (segments connectés)
  - polygon, rectangle, circle: false → désactive ces outils de dessin

## Gestion des événements de dessin

```javascript
map.on('draw:created', function (e) {
    var layer = e.layer;
    drawnItems.addLayer(layer);

    if (layer instanceof L.Marker) {
        console.log('Point ajouté à la carte !');
    }

    if (layer instanceof L.Polyline) {
        console.log('Ligne ajoutée, les points sont reliés !');
    }
});
```

- **map.on('draw:created', function (e) {...})**
  - Origine : bibliothèque Leaflet
  - Attache un écouteur d'événement à la carte
  - L'événement 'draw:created' est émis par Leaflet.draw quand un utilisateur termine de dessiner un objet

- **var layer = e.layer;**
  - e est l'objet d'événement retourné par Leaflet Draw
  - e.layer contient l'objet Leaflet (ex: L.Marker, L.Polyline) que l'utilisateur vient de dessiner

- **drawnItems.addLayer(layer);**
  - Origine : Leaflet
  - Ajoute la forme ou le point dessiné au groupe drawnItems
  - Permet à l'élément d'être visible sur la carte et éditable

- **if (layer instanceof L.Marker) {...}**
  - Vérifie si l'objet dessiné est un marqueur (point)
  - Si c'est le cas, affiche un message dans la console du navigateur

- **if (layer instanceof L.Polyline) {...}**
  - Vérifie si l'objet est une ligne (suite de points reliés)
  - ⚠️ L.Polyline est aussi la classe mère de L.Polygon, mais comme polygon: false, ce cas ne se produira pas ici

## Fonction d'extraction des coordonnées

```javascript
function extractCoordinates(geoJson) {
    let allCoordinates = [];
    geoJson.features.forEach(feature => {
        if (feature.geometry) {
            if (feature.geometry.type === 'Point') {
                // Pour un point, on inverse les coordonnées (latitude, longitude)
                allCoordinates.push([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
            } 
            else if (feature.geometry.type === 'LineString') {
                // Pour une ligne, on inverse chaque coordonnée (latitude, longitude)
                feature.geometry.coordinates.forEach(coord => {
                    allCoordinates.push([coord[1], coord[0]]);
                });
            }
        }
    });
    
    return allCoordinates;
}
```

- **function extractCoordinates(geoJson)**
  - Définit une fonction JavaScript qui prend en paramètre un objet geoJson
  - Ce format GeoJSON est un standard utilisé pour représenter des données géographiques

- **let allCoordinates = [];**
  - Déclare un tableau vide qui stockera toutes les coordonnées extraites sous forme [latitude, longitude]
  - ⚠️ GeoJSON stocke les coordonnées en [longitude, latitude], donc on les inverse pour les rendre compatibles avec Leaflet

- **geoJson.features.forEach(feature => {...})**
  - GeoJSON contient une clé features, tableau de tous les objets géographiques
  - Parcourt chaque feature (objet géographique) avec forEach

- **if (feature.geometry) {...}**
  - Vérifie que l'objet possède bien une géométrie

- **if (feature.geometry.type === 'Point') {...}**
  - Si l'objet est un point unique, traite ses coordonnées
  - Inverse [longitude, latitude] → [latitude, longitude] avant de les ajouter au tableau

- **else if (feature.geometry.type === 'LineString') {...}**
  - Si c'est une ligne (suite de points reliés)
  - Parcourt chaque point de la ligne et inverse aussi leurs coordonnées

- **return allCoordinates;**
  - Retourne le tableau contenant tous les points extraits, convertis au bon format pour Leaflet

## Gestion de la sauvegarde des données

```javascript
document.getElementById('saveButton').addEventListener('click', function() {
    // Récupération des données du formulaire
    var nom = document.getElementById('nom_course').value;
    var date = document.getElementById('heure_course').value;
    var depart = document.getElementById('depart_course').value;
    var arrive = document.getElementById('arrive_course').value;
    var nbMaxParticipants = document.getElementById('nb_max_participants').value || 50;
    
    // Validation des champs requis
    if (!nom || !date || !depart || !arrive) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
```

- **document.getElementById('saveButton').addEventListener('click', function() {...})**
  - Ajoute un écouteur d'événement au clic sur le bouton "Sauvegarder la course"

- **var nom = document.getElementById('nom_course').value; etc.**
  - Récupère les valeurs des champs du formulaire

- **var nbMaxParticipants = document.getElementById('nb_max_participants').value || 50;**
  - Si aucune valeur n'est fournie pour le nombre max de participants, utilise 50 par défaut

- **if (!nom || !date || !depart || !arrive) {...}**
  - Validation simple vérifiant que les champs obligatoires ne sont pas vides

## Validation et préparation des données du parcours

```javascript
    // Récupération des coordonnées tracées sur la carte
    var geoJson = drawnItems.toGeoJSON();
    var coordinates = extractCoordinates(geoJson);
    
    // Vérification des coordonnées
    if (coordinates.length === 0) {
        alert('Veuillez tracer un parcours sur la carte');
        return;
    }
    
    console.log("Données à envoyer:", {
        nomcourse: nom,
        heurecourse: date,
        depart: depart,
        arrive: arrive,
        coordonee: coordinates,
        nb_maxparticipants: parseInt(nbMaxParticipants)
    });
```

- **var geoJson = drawnItems.toGeoJSON();**
  - Convertit tous les éléments dessinés en format GeoJSON

- **var coordinates = extractCoordinates(geoJson);**
  - Utilise la fonction définie précédemment pour extraire les coordonnées

- **if (coordinates.length === 0) {...}**
  - Vérifie si des coordonnées ont été tracées sur la carte

- **console.log("Données à envoyer:", {...})**
  - Affiche dans la console un aperçu des données qui seront envoyées au serveur

## Envoi des données au serveur

```javascript
    fetch('/save-course', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nomcourse: nom,
            heurecourse: date,
            depart: depart,
            arrive: arrive,
            coordonee: coordinates,
            nb_maxparticipants: parseInt(nbMaxParticipants)
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur serveur: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        alert('Course sauvegardée avec succès!');
        console.log('Réponse du serveur:', data);
        // Optionnel: redirection vers la page des parcours
        window.location.href = 'index.html';
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'enregistrement de la course: ' + error.message);
    });
});
```

- **fetch('/save-course', {...})**
  - Fonction JavaScript moderne pour faire des appels HTTP (remplace XMLHttpRequest)
  - '/save-course' est l'URL vers laquelle la requête est envoyée
  - Suppose qu'un serveur écoute à cette route côté back-end

- **method: 'POST'**
  - Utilise la méthode HTTP POST pour envoyer des données (par opposition à GET qui sert à récupérer)

- **headers: { 'Content-Type': 'application/json' }**
  - Les en-têtes HTTP
  - Content-Type: application/json signifie qu'on envoie des données en JSON

- **body: JSON.stringify({...})**
  - Le contenu de la requête (le message envoyé au serveur)
  - JSON.stringify transforme un objet JavaScript en chaîne JSON
  - Exemple de ce que le serveur recevra:
    ```json
    {
      "nomcourse": "Ma course",
      "heurecourse": "2025-05-17T12:00:00",
      "depart": "Rouen",
      "arrive": "Dieppe",
      "coordonee": [[49.443, 1.099], [49.55, 0.1]],
      "nb_maxparticipants": 10
    }
    ```

- **parseInt(nbMaxParticipants)**
  - Convertit la valeur en nombre entier pour éviter d'envoyer une chaîne

- **.then(response => {...})**
  - Callback appelé à la réception de la réponse
  - response.ok : booléen qui vaut true si le code HTTP est 2xx
  - response.json() : transforme la réponse JSON du serveur en objet JavaScript

- **.then(data => {...})**
  - Si tout va bien :
    - Une alerte s'affiche
    - La réponse du serveur est loggée dans la console
    - Redirection vers index.html (probablement la page des courses existantes)

- **.catch(error => {...})**
  - Si une erreur se produit à n'importe quel moment (réseau, serveur, JS...)
  - Elle est affichée dans la console et notifiée à l'utilisateur via une alerte

## Conclusion

Ce code crée une interface web permettant à un administrateur de créer une nouvelle course avec :
- Un formulaire pour saisir les informations de base (nom, date, heures, nombre de participants)
- Une carte interactive pour tracer le parcours de la course
- Un système pour sauvegarder ces informations sur un serveur

La page utilise la bibliothèque Leaflet pour l'affichage et l'interaction avec la carte, et Leaflet Draw pour permettre le dessin du parcours. Le code JavaScript gère la récupération des données, leur validation et leur envoi au serveur via une requête AJAX.

Cette interface fait probablement partie d'un système plus large de gestion d'événements sportifs, avec d'autres pages comme "index.html" qui pourrait afficher la liste de toutes les courses.