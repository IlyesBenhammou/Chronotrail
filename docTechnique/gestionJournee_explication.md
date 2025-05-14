# Explication du code de "Gestion journée"

Ce document explique ligne par ligne le code HTML/CSS/JavaScript qui permet de créer une interface de gestion de courses (probablement des courses de trail ou similaires) avec une carte interactive.

## Importation des ressources externes

```html
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css" />
    <link rel="stylesheet" type="text/css" href="styleGestionJourne.css">
</head>
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

```html
<script>
    var map = L.map('map').setView([48.4049, 2.7016], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
```

- `var map = L.map('map').setView([48.4049, 2.7016], 13);` : Initialise la carte Leaflet dans l'élément avec l'ID "map".
  - Les coordonnées `[48.4049, 2.7016]` correspondent à la Forêt de Fontainebleau (comme indiqué en commentaire).
  - `13` est le niveau de zoom initial.
- `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {...})` : Ajoute une couche de tuiles OpenStreetMap à la carte.
  - L'attribut `attribution` ajoute les crédits requis pour l'utilisation des données OpenStreetMap.

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

- `var drawnItems = new L.FeatureGroup();` : Crée un groupe qui contiendra tous les éléments dessinés sur la carte.
- `map.addLayer(drawnItems);` : Ajoute ce groupe à la carte.
- `var drawControl = new L.Control.Draw({...});` : Configure les contrôles de dessin :
  - `edit: { featureGroup: drawnItems }` : Permet l'édition des éléments du groupe `drawnItems`.
  - `draw: {...}` : Configure quels outils de dessin sont activés :
    - `marker: true` : Active l'ajout de marqueurs (points).
    - `polyline: true` : Active le dessin de lignes.
    - `polygon: false, rectangle: false, circle: false` : Désactive les autres formes.
- `map.addControl(drawControl);` : Ajoute les contrôles de dessin à la carte.

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

- `map.on('draw:created', function (e) {...});` : Écoute l'événement `draw:created` qui se déclenche lorsqu'un élément est dessiné sur la carte.
- `var layer = e.layer;` : Récupère la couche (l'élément) qui vient d'être dessinée.
- `drawnItems.addLayer(layer);` : Ajoute cette couche au groupe `drawnItems`.
- Les conditions suivantes affichent des messages dans la console selon le type d'élément dessiné :
  - `if (layer instanceof L.Marker)` : Si c'est un marqueur (point).
  - `if (layer instanceof L.Polyline)` : Si c'est une polyligne (ligne).

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

- `function extractCoordinates(geoJson) {...}` : Fonction qui extrait les coordonnées d'un objet GeoJSON.
- GeoJSON est un format standard pour représenter des données géographiques.
- Cette fonction parcourt les entités (features) de l'objet GeoJSON et extrait les coordonnées en fonction du type :
  - Pour les points (`'Point'`), elle inverse les coordonnées car GeoJSON stocke les coordonnées dans l'ordre longitude/latitude, mais Leaflet les utilise dans l'ordre latitude/longitude.
  - Pour les lignes (`'LineString'`), elle fait de même pour chaque point de la ligne.
- La fonction retourne un tableau de toutes les coordonnées extraites.

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

- `document.getElementById('saveButton').addEventListener('click', function() {...});` : Ajoute un écouteur d'événement au clic sur le bouton "Sauvegarder la course".
- La fonction commence par récupérer les valeurs des champs du formulaire.
- `var nbMaxParticipants = document.getElementById('nb_max_participants').value || 50;` : Si aucune valeur n'est fournie pour le nombre max de participants, utilise 50 par défaut.
- Une validation simple vérifie que les champs obligatoires ne sont pas vides.

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

- `var geoJson = drawnItems.toGeoJSON();` : Convertit tous les éléments dessinés en format GeoJSON.
- `var coordinates = extractCoordinates(geoJson);` : Utilise la fonction définie précédemment pour extraire les coordonnées.
- Vérifie si des coordonnées ont été tracées sur la carte.
- Affiche dans la console un aperçu des données qui seront envoyées au serveur.

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
</script>
```

- `fetch('/save-course', {...})` : Utilise l'API Fetch pour envoyer les données au serveur via une requête HTTP POST.
  - L'endpoint `/save-course` doit exister sur le serveur backend pour traiter cette requête.
  - Les données sont envoyées au format JSON.
- La chaîne de promesses `.then().then().catch()` gère la réponse du serveur :
  - Le premier `.then()` vérifie si la réponse est OK et la convertit en JSON.
  - Le deuxième `.then()` traite la réponse en cas de succès :
    - Affiche une alerte de succès.
    - Redirige vers la page des parcours (`index.html`).
  - `.catch()` gère les erreurs et affiche un message approprié.

## Conclusion

Ce code crée une interface web permettant à un administrateur de créer une nouvelle course avec :
- Un formulaire pour saisir les informations de base (nom, date, heures, nombre de participants).
- Une carte interactive pour tracer le parcours de la course.
- Un système pour sauvegarder ces informations sur un serveur.

La page utilise la bibliothèque Leaflet pour l'affichage et l'interaction avec la carte, et Leaflet Draw pour permettre le dessin du parcours. Le code JavaScript gère la récupération des données, leur validation et leur envoi au serveur via une requête AJAX.

Cette interface fait probablement partie d'un système plus large de gestion d'événements sportifs, avec d'autres pages comme "index.html" qui pourrait afficher la liste de toutes les courses.
