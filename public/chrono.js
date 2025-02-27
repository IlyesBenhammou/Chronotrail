let heureDeDebut;
let intervalleChrono;

function demarrerChrono() {
    console.log('Démarrage du chronomètre...');
    fetch('/demarrer-chrono')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur de réseau');
            }
            return response.json();
        })
        .then(data => {
            heureDeDebut = new Date(data.hDebut);
            console.log('Heure de début:', heureDeDebut);
            clearInterval(intervalleChrono);
            intervalleChrono = setInterval(mettreAJourChrono, 1000);
        })
        .catch(error => {
            console.error('Erreur:', error);
        });
}

function mettreAJourChrono() {
    const heureActuelle = new Date();
    const tempsEcoule = heureActuelle - heureDeDebut;

    const heures = Math.floor(tempsEcoule / (1000 * 60 * 60));
    const minutes = Math.floor((tempsEcoule % (1000 * 60 * 60)) / (1000 * 60));
    const secondes = Math.floor((tempsEcoule % (1000 * 60)) / 1000);

    document.getElementById('chronometre').textContent =
        heures + ':' + (minutes < 10 ? '0' : '') + minutes + ':' + (secondes < 10 ? '0' : '') + secondes;
}
