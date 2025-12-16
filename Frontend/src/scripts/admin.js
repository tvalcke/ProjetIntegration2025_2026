document.addEventListener('DOMContentLoaded', function() {
    // Nav entre les sect°
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');

    // Menu navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            (async function() {
                try {
                    if (section === 'contacts' || section === 'content') {
                        const response = await fetch(`${API_URL}/api/admin/verify`, {
                            credentials: 'include'
                        });

                        if (!response.ok) {
                            throw new Error('Not authenticated');
                        }

                        const data = await response.json();
                        const userRole = data.role;

                        if (userRole !== 'super_admin') {
                            alert('⚠️ Accès refusé : Cette section est réservée aux administrateurs @jemlo.be');
                            return; // Bloque l'accès
                        }

                    }
                } catch (error) {
                    console.error('Authentication failed:', error);
                    window.location.href = 'login.html';
                }
            })();
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(section).classList.add('active');

            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(section).classList.add('active');
            
            // Update titre page
            const titles = {
                dashboard: 'Tableau de bord',
                fountains: 'Gestion des fontaines',
                contacts: 'Demandes de contact',
                content: 'Gestion du contenu',
                monitoring: 'Monitoring technique',
                settings: 'Paramètres'
            };
            
            document.getElementById('page-title').textContent = titles[section] || 'Administration';

            // Charger les logs quand on ouvre Monitoring
            if (section === 'monitoring') {
                loadActivityLogs();
            }
        });
    });
    
    // Filter tabs dans le dashboard
    const filterTabs = document.querySelectorAll('.tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // logique de filtrage
            console.log('Filter by:', this.dataset.filter);
        });
    });
    
    // simuler les data en tps réel
    function updateStats() {
        const waterConsumed = document.querySelector('.stat-content h3');
        if (waterConsumed && waterConsumed.textContent.includes('L')) {
            const currentValue = parseInt(waterConsumed.textContent);
            const newValue = currentValue + Math.floor(Math.random() * 5);
            waterConsumed.textContent = newValue + 'L';
        }
    }
    
    // update chaque 30 sec
    setInterval(updateStats, 30000);
    
    // Logout
    const logoutBtn = document.querySelector('.logout-btn');
    logoutBtn.addEventListener('click', function() {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            // Redirect to login page or main site
            window.location.href = 'public.html';
        }
    });
    
    document.addEventListener('click', function(e) {
        if (e.target.textContent === 'Voir') {
            alert('Ouverture du détail de la demande...');
        }
        
        if (e.target.textContent === 'Répondre') {
            alert('Ouverture de l\'interface de réponse...');
        }
        
        if (e.target.textContent === 'Configurer') {
            alert('Ouverture de la configuration de la fontaine...');
        }
        
        if (e.target.textContent === 'Maintenance') {
            alert('Planification de la maintenance...');
        }
    });
    
    // Incruster les graphiques ici 
    const chartCanvas = document.getElementById('fountainChart');
    if (chartCanvas) {
        const ctx = chartCanvas.getContext('2d');
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 0, chartCanvas.width, chartCanvas.height);
        ctx.fillStyle = '#64748b';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Graphique des consommations', chartCanvas.width/2, chartCanvas.height/2);
    }
});



async function loadActivityLogs() {
  const logsContainer = document.querySelector('.logs-container');
  if (!logsContainer) return;

  logsContainer.innerHTML = `
    <div class="log-entry">
      <span class="log-time">...</span>
      <span class="log-message">Chargement des logs...</span>
    </div>
  `;

  try {
    const response = await fetch(`${API_URL}/api/admin/logs?limit=50`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'  // send access_token cookie
    });

    if (!response.ok) throw new Error('Erreur chargement logs');

    const logs = await response.json();

    if (!Array.isArray(logs) || logs.length === 0) {
      logsContainer.innerHTML = `
        <div class="log-entry">
          <span class="log-time">-</span>
          <span class="log-message">Aucun log disponible pour le moment.</span>
        </div>
      `;
      return;
    }

    logsContainer.innerHTML = '';

    logs.forEach(log => {
      const entry = document.createElement('div');
      entry.className = 'log-entry';

      const date = new Date(log.timestamp);
      const timeStr = isNaN(date.getTime())
        ? ''
        : date.toLocaleTimeString('fr-FR', { hour12: false });

      entry.innerHTML = `
        <span class="log-time">${timeStr}</span>
        <span class="log-message">${log.message}</span>
      `;

      logsContainer.appendChild(entry);
    });
  } catch (err) {
    console.error('Erreur chargement logs:', err);
    logsContainer.innerHTML = `
      <div class="log-entry">
        <span class="log-time">!</span>
        <span class="log-message">Erreur de chargement des logs.</span>
      </div>
    `;
  }
}
