// Initialiser la carte
    var map = L.map('map').setView([48.4049, 2.7016], 13); // Coordonnées de départ (Forêt de Fontainebleau)

    // Ajouter un fond de carte
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Fonction pour nettoyer et inverser les coordonnées si nécessaire
    const processCoordinates = (coordinates) => {
        console.log("Avant traitement :", coordinates);

        // Filtrer les coordonnées valides et inverser si nécessaire
        const processed = coordinates
            .filter(coord => Array.isArray(coord) && coord.length === 2 && !isNaN(coord[0]) && !isNaN(coord[1]))  // Vérifier que ce sont bien des coordonnées valides
            .map(coord => [coord[0], coord[1]]);  // Inverser les coordonnées si nécessaire pour Leaflet

        console.log("Après traitement :", processed);
        return processed;
    };

    // Récupérer les données du serveur pour l'ID 1
    fetch('http://localhost:3000/get-trail/15')
        .then(response => response.json())
        .then(data => {
            console.log("Données reçues :", data);

            if (!data || !Array.isArray(data.coordinates)) {
                throw new Error("Les données reçues ne contiennent pas de coordonnées !");
            }

            const coordinates = data.coordinates;
            console.log("Coordonnées brutes :", coordinates);

            // Traitement des coordonnées
            const finalCoordinates = processCoordinates(coordinates);

            if (finalCoordinates.length > 0) {
                // Ajouter la polyline sur la carte
                L.polyline(finalCoordinates, { color: 'blue' }).addTo(map);

                // Ajuster la vue de la carte pour inclure la polyline
                map.fitBounds(L.polyline(finalCoordinates).getBounds());
            } else {
                console.error("Aucune coordonnée valide trouvée !");
            }
        })
        .catch(error => {
            console.error("Erreur lors du chargement des données :", error);
        });

