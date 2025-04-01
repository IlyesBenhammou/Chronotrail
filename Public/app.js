document.addEventListener('DOMContentLoaded', async () => {
    let coureursData = [];
    let coursesData = [];
    let nextDossardNumber = 100;
  
    // Charger les données initiales
    async function loadData() {
      try {
        const [coursesRes, coureursRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/coureurs')
        ]);
        
        coursesData = await coursesRes.json();
        coureursData = (await coureursRes.json()).map(c => ({
          ...c,
          age: c.datenaissance ? calculateAge(c.datenaissance) : null,
          presence: c.presence ? 'present' : 'absent'
        }));
        
        nextDossardNumber = Math.max(...coureursData.map(c => c.dossard || 0), 100) + 1;
        initFilters();
        renderTable();
      } catch (err) {
        console.error('Erreur:', err);
        alert('Erreur de chargement des données');
      }
    }
  
    function calculateAge(birthDate) {
      const diff = Date.now() - new Date(birthDate).getTime();
      return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    }
  
    function initFilters() {
      const circuitFilter = document.getElementById('circuit-filter');
      circuitFilter.innerHTML = `
        <option value="all">Tous les circuits</option>
        ${coursesData.map(c => `<option value="${c.id_course}">${c.nom}</option>`).join('')}
      `;
    }
  
    function renderTable(filteredData = coureursData) {
      const tbody = document.getElementById('coureurs-body');
      tbody.innerHTML = filteredData.map(coureur => `
        <tr data-id="${coureur.idcoureur}" onclick="showDetails(${coureur.idcoureur})">
          <td>${coureur.dossard || '-'}</td>
          <td>${coureur.nom}</td>
          <td>${coureur.prenom}</td>
          <td>${coureur.age || '-'}</td>
          <td>${coureur.sexe === 'M' ? 'Homme' : 'Femme'}</td>
          <td>${coureur.circuit || '-'}</td>
          <td><span class="presence-${coureur.presence}">${getPresenceText(coureur.presence)}</span></td>
          <td>
            <button onclick="updatePresence(${coureur.idcoureur}, 'present', event)">Présent</button>
            <button onclick="updatePresence(${coureur.idcoureur}, 'absent', event)">Absent</button>
          </td>
        </tr>
      `).join('');
    }
  
    function getPresenceText(status) {
      return {
        present: 'Présent',
        absent: 'Absent'
      }[status] || 'Non vérifié';
    }
  
    // Fonctions globales pour le HTML
    window.showDetails = (id) => {
      const coureur = coureursData.find(c => c.idcoureur === id);
      if (coureur) {
        document.getElementById('detail-nom').textContent = coureur.nom;
        document.getElementById('detail-prenom').textContent = coureur.prenom;
        document.getElementById('detail-age').textContent = coureur.age || '-';
        document.getElementById('detail-sexe').textContent = coureur.sexe === 'M' ? 'Homme' : 'Femme';
        document.getElementById('detail-circuit').textContent = coureur.circuit || '-';
        document.getElementById('detail-dossard').textContent = coureur.dossard || '-';
        document.getElementById('detail-presence').textContent = getPresenceText(coureur.presence);
        
        document.querySelector('.coureurs-list').style.display = 'none';
        document.getElementById('details-section').style.display = 'block';
        window.currentCoureurId = id;
      }
    };
  
    window.updatePresence = async (id, presence, event) => {
      event.stopPropagation();
      try {
        await fetch(`/api/coureurs/${id}/presence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ presence: presence === 'present' })
        });
        
        coureursData = coureursData.map(c => 
          c.idcoureur === id ? { ...c, presence } : c
        );
        renderTable();
      } catch (err) {
        console.error('Erreur:', err);
      }
    };
  
    window.assignDossard = async () => {
      if (!window.currentCoureurId) return;
      
      try {
        await fetch(`/api/coureurs/${window.currentCoureurId}/dossard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dossard: nextDossardNumber })
        });
        
        coureursData = coureursData.map(c => 
          c.idcoureur === window.currentCoureurId 
            ? { ...c, dossard: nextDossardNumber } 
            : c
        );
        nextDossardNumber++;
        renderTable();
        document.getElementById('detail-dossard').textContent = nextDossardNumber - 1;
      } catch (err) {
        console.error('Erreur:', err);
      }
    };
  
    window.backToList = () => {
      document.querySelector('.coureurs-list').style.display = 'block';
      document.getElementById('details-section').style.display = 'none';
    };
  
    // Filtrage
    document.getElementById('search').addEventListener('input', filterTable);
    document.getElementById('circuit-filter').addEventListener('change', filterTable);
    document.getElementById('presence-filter').addEventListener('change', filterTable);
  
    function filterTable() {
      const search = document.getElementById('search').value.toLowerCase();
      const circuit = document.getElementById('circuit-filter').value;
      const presence = document.getElementById('presence-filter').value;
      
      const filtered = coureursData.filter(c => {
        const matchesSearch = c.nom.toLowerCase().includes(search) || 
                            c.prenom.toLowerCase().includes(search) ||
                            (c.dossard && c.dossard.toString().includes(search));
        const matchesCircuit = circuit === 'all' || c.id_course == circuit;
        const matchesPresence = presence === 'all' || c.presence === presence;
        
        return matchesSearch && matchesCircuit && matchesPresence;
      });
      
      renderTable(filtered);
    }
  
    // Initialisation
    loadData();
  });