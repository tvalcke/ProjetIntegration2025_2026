document.addEventListener('DOMContentLoaded', function() {
    // Nav entre les sect°
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            
            menuItems.forEach(mi => mi.classList.remove('active'));
            this.classList.add('active');
            
            contentSections.forEach(cs => cs.classList.remove('active'));
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
            pageTitle.textContent = titles[section];
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
    
    // Incruster les graphiques icvi 
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
