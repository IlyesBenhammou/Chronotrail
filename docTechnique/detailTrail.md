# Explication du code "detailTrail.html"

Ce document explique ligne par ligne le code HTML/CSS/JavaScript qui permet d'afficher une page de détail d'un parcours de trail avec une carte interactive montrant l'itinéraire.

## Structure HTML de base et importation des ressources externes

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Carte du Trail</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css" />
    <link rel="stylesheet" type="text/css" href="styleCourse.css">
</head>
```

- `<!DOCTYPE html>` : Déclaration du type de document (HTML5).
- `<html lang="fr">` : Balise racine du document HTML avec la langue définie sur français.
- `<head>` : Section contenant les métadonnées et les ressources externes.
- `<meta charset="UTF-8">` : Définit l'encodage des caractères en UTF-8.
- `<meta name="viewport"...>` : Paramètre d'affichage pour les appareils mobiles (responsive design).
- `<title>Carte du Trail</title>` : Titre de la page qui apparaît dans l'onglet du navigateur.
- Les quatre lignes suivantes importent la bibliothèque Leaflet et son extension Leaflet Draw :
  - Leaflet est une bibliothèque JavaScript open-source pour créer des cartes interactives.
  - Leaflet Draw est une extension qui permet de dessiner et d'éditer des formes sur la carte.
- La dernière ligne importe une feuille de style CSS personnalisée pour le design de la page.

## Corps de la page - Messages d'état et conteneur d'informations

```html
<body>
    <div id="loading-message" class="loading">Chargement du parcours...</div>
    <div id="error-message" class="error" style="display: none;"></div>
    
    <div id="course-info" class="course-info" style="display: none;">
        <h1 id="trail-title">Carte du Trail</h1>
        <div id="course-details" class="info-grid">
            <!-- Les détails du parcours seront injectés ici -->
        </div>
    </div>
```

- `<body>` : Contenu principal de la page.
- `<div id="loading-message" class="loading">` : Message affiché pendant le chargement des données.
- `<div id="error-message" class="error" style="display: none;">` : Conteneur pour afficher d'éventuelles erreurs (initialement caché).
- `<div id="course-info" class="course-info" style="display: none;">` : Conteneur pour les informations du parcours (initialement caché).
- `<h1 id="trail-title">Carte du Trail</h1>` : Titre principal qui sera remplacé par le nom de la course.
- `<div id="course-details" class="info-grid">` : Grille qui contiendra les détails du parcours.
- Commentaire HTML indiquant que le contenu sera injecté dynamiquement par JavaScript.

## Conteneur de carte

```html
    <div id="map"></div>
```

- Un simple conteneur `<div>` avec l'ID "map" qui sera utilisé par Leaflet pour afficher la carte interactive.

## Script JavaScript - Initialisation et récupération des données

```javascript
    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('id') || 1;

        const map = L.map('map').setView([46.603354, 1.888334], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
```

- `<script>` : Début du bloc de code JavaScript.
- **const urlParams = new URLSearchParams(window.location.search);**
  - Crée un objet pour analyser les paramètres de l'URL.
  - `window.location.search` contient la partie query string de l'URL (tout ce qui suit le "?").

- **const courseId = urlParams.get('id') || 1;**
  - Récupère la valeur du paramètre 'id' dans l'URL.
  - Si aucun id n'est spécifié, utilise 1 comme valeur par défaut.
  - Exemple: si l'URL est "detailTrail.html?id=42", courseId vaudra 42.

- **const map = L.map('map').setView([46.603354, 1.888334], 6);**
  - Crée une nouvelle carte Leaflet dans l'élément HTML ayant l'ID "map".
  - Centre la carte sur les coordonnées [46.603354, 1.888334] (centre approximatif de la France).
  - Le niveau de zoom est fixé à 6 (niveau régional/national).

- **L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {...}).addTo(map);**
  - Ajoute une couche de tuiles OpenStreetMap à la carte.
  - Les tuiles sont les images qui composent le fond de la carte.
  - `{s}`, `{z}`, `{x}` et `{y}` sont des variables qui seront remplacées par Leaflet.
  - L'attribution crédite OpenStreetMap comme source des données cartographiques.

## Fonctions utilitaires pour le formatage et le traitement des données

```javascript
        function formatDate(dateString) {
            if (!dateString) return 'Non spécifiée';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                return dateString;
            }
        }

        function processCoordinates(data) {
            try {
                const coords = typeof data === 'string' ? JSON.parse(data) : data;
                if (!Array.isArray(coords)) return [];
                return coords
                    .filter(c => Array.isArray(c) && c.length === 2)
                    .map(c => [c[0], c[1]]);
            } catch (e) {
                console.error("Erreur parsing coordonnées:", e);
                return [];
            }
        }
```

- **function formatDate(dateString) {...}**
  - Fonction qui transforme une chaîne de date en format lisible français.
  - Si `dateString` est vide ou null, retourne "Non spécifiée".
  - Utilise l'API JavaScript `Date` pour formater la date selon les conventions françaises.
  - Gère les erreurs potentielles en retournant la chaîne originale en cas d'échec.

- **function processCoordinates(data) {...}**
  - Fonction qui traite et valide les coordonnées géographiques.
  - Si `data` est une chaîne JSON, la convertit en objet JavaScript.
  - Vérifie que le résultat est bien un tableau.
  - Filtre pour ne garder que les éléments qui sont des tableaux de 2 valeurs [latitude, longitude].
  - En cas d'erreur, affiche un message dans la console et retourne un tableau vide.

## Récupération et affichage des données du parcours

```javascript
        fetch(`/course/${courseId}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(course => {
                document.getElementById('loading-message').style.display = 'none';
                document.getElementById('course-info').style.display = 'block';

                document.getElementById('trail-title').innerText = course.nomcourse || `Course #${course.idcourse}`;

                const details = [
                    { label: 'Date', value: formatDate(course.datecourse) },
                    { label: 'Heure de départ', value: course.heure_depart || 'Non spécifié' },
                    { label: 'Heure d\'arrivée', value: course.heure_arrivee || 'Non spécifié' },
                    { label: 'Distance', value: course.distance ? `${course.distance} km` : 'Non spécifiée' },
                    { label: 'Participants Max', value: course.nb_max_participants || 50 }
                ];

                const container = document.getElementById('course-details');
                details.forEach(d => {
                    const div = document.createElement('div');
                    div.className = 'info-item';
                    div.innerHTML = `<span class="info-label">${d.label}</span><span class="info-value">${d.value}</span>`;
                    container.appendChild(div);
                });
```

- **fetch(`/course/${courseId}`)**
  - Effectue une requête HTTP GET vers l'URL `/course/{id}` où `{id}` est remplacé par la valeur de `courseId`.
  - Cette URL est un point d'accès (endpoint) du serveur qui renvoie les données du parcours spécifié.

- **.then(res => {...})**
  - Premier gestionnaire de réponse qui vérifie si la requête a réussi.
  - Si la réponse n'est pas "ok" (status code autre que 2xx), lance une erreur.
  - Sinon, convertit la réponse en JSON.

- **.then(course => {...})**
  - Second gestionnaire qui traite les données de la course après conversion en JSON.
  - Cache le message de chargement et affiche le conteneur d'informations.
  - Définit le titre de la page avec le nom de la course ou "Course #{id}" par défaut.

- **const details = [...]**
  - Crée un tableau d'objets contenant les paires label/valeur pour chaque détail du parcours.
  - Utilise la fonction `formatDate` pour présenter la date dans un format lisible.
  - Fournit des valeurs par défaut pour les champs qui pourraient être vides.

- **details.forEach(d => {...})**
  - Parcourt chaque détail et crée un élément HTML pour l'afficher.
  - Ajoute une classe CSS "info-item" pour le style.
  - Crée deux spans pour le label et la valeur avec des classes distinctes.
  - Ajoute l'élément créé au conteneur parent.

## Affichage du parcours sur la carte

```javascript
                // Utiliser coordonnees au lieu de coordonee
                const coordinates = processCoordinates(course.coordonnees);

                if (coordinates.length > 0) {
                    const polyline = L.polyline(coordinates, {
                        color: 'blue',
                        weight: 5,
                        opacity: 0.7
                    }).addTo(map);

                    // Ajouter des marqueurs pour le départ et l'arrivée
                    L.marker(coordinates[0], {
                        icon: L.divIcon({
                            className: 'marker-start',
                            html: '<div class="marker-icon start-icon">D</div>',
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                        })
                    }).addTo(map).bindPopup('Départ');
                    
                    L.marker(coordinates[coordinates.length - 1], {
                        icon: L.divIcon({
                            className: 'marker-end',
                            html: '<div class="marker-icon end-icon">A</div>',
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                        })
                    }).addTo(map).bindPopup('Arrivée');

                    map.fitBounds(polyline.getBounds());
                } else {
                    const msg = document.createElement('div');
                    msg.className = 'error';
                    msg.innerText = "Pas de coordonnées disponibles pour ce parcours.";
                    container.appendChild(msg);
                    
                    // Centre la carte sur la France si pas de coordonnées
                    map.setView([46.603354, 1.888334], 6);
                }
```

- **const coordinates = processCoordinates(course.coordonnees);**
  - Traite les coordonnées du parcours avec la fonction définie précédemment.
  - Note: le commentaire suggère une incohérence possible dans le nom du champ (coordonnees vs coordonee).

- **if (coordinates.length > 0) {...}**
  - Vérifie s'il y a des coordonnées à afficher.

- **const polyline = L.polyline(coordinates, {...}).addTo(map);**
  - Crée une polyligne (ligne brisée) reliant tous les points du parcours.
  - Définit le style de la ligne : couleur bleue, épaisseur de 5 pixels, opacité de 0.7.
  - Ajoute cette ligne à la carte.

- **L.marker(coordinates[0], {...}).addTo(map).bindPopup('Départ');**
  - Crée un marqueur à la première coordonnée du parcours (point de départ).
  - Utilise une icône personnalisée créée avec L.divIcon.
  - L'icône contient un "D" pour "Départ" dans un cercle vert.
  - Ajoute un popup qui s'affiche au clic sur le marqueur.

- **L.marker(coordinates[coordinates.length - 1], {...}).addTo(map).bindPopup('Arrivée');**
  - Similaire au précédent, mais pour le point d'arrivée (dernière coordonnée).
  - Utilise un "A" pour "Arrivée" dans un cercle rouge.

- **map.fitBounds(polyline.getBounds());**
  - Ajuste automatiquement le zoom et le centre de la carte pour afficher l'intégralité du parcours.

- **else {...}**
  - Si aucune coordonnée n'est disponible :
    - Crée un message d'erreur et l'ajoute à la page.
    - Centre la carte sur la France avec un zoom adapté.

## Gestion des erreurs

```javascript
            })
            .catch(err => {
                document.getElementById('loading-message').style.display = 'none';
                document.getElementById('error-message').innerText = `Erreur: ${err.message}`;
                document.getElementById('error-message').style.display = 'block';
            });
    </script>
```

- **.catch(err => {...})**
  - Gestionnaire d'erreurs qui s'active si un problème survient pendant la récupération ou le traitement des données.
  - Cache le message de chargement.
  - Affiche un message d'erreur avec les détails du problème.
  - Rend visible le conteneur de message d'erreur.

## Style CSS pour les marqueurs de départ et d'arrivée

```css
    <style>
        .marker-icon {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        
        .start-icon {
            background-color: green;
        }
        
        .end-icon {
            background-color: red;
        }
    </style>
</body>
</html>
```

- **<style>...</style>**
  - Balises définissant du CSS en ligne (intégré directement dans la page).

- **.marker-icon {...}**
  - Style commun pour les icônes de marqueur :
    - Dimensions de 30x30 pixels.
    - Forme circulaire (border-radius: 50%).
    - Utilisation de flexbox pour centrer le contenu.
    - Texte en blanc et gras.

- **.start-icon {...}**
  - Style spécifique pour l'icône de départ (fond vert).

- **.end-icon {...}**
  - Style spécifique pour l'icône d'arrivée (fond rouge).

- **</body></html>**
  - Fermeture des balises body et html.

## Conclusion

Ce code crée une page web qui affiche les détails d'un parcours de trail spécifique, récupéré depuis un serveur. Les fonctionnalités principales sont :

1. Récupération de l'ID du parcours depuis l'URL.
2. Chargement des données du parcours depuis le serveur.
3. Affichage des informations détaillées (nom, date, heures, distance, etc.).
4. Visualisation du tracé sur une carte interactive.
5. Marquage des points de départ et d'arrivée avec des icônes distinctives.
6. Gestion des erreurs et des cas où aucune coordonnée n'est disponible.

La page utilise principalement la bibliothèque Leaflet pour la cartographie et des requêtes AJAX (via l'API Fetch) pour la communication avec le serveur.

Contrairement à la page de gestion des journées, cette page est uniquement dédiée à l'affichage des informations d'un parcours existant et ne permet pas de modification ou d'ajout de nouveaux parcours.