/**
 * Tests unitaires pour admin.html
 * @jest-environment jsdom
 * 
 */

const fs = require('fs');
const path = require('path');

describe('Admin Page Tests', () => {
  beforeEach(() => {
    // Chargement du fichier
    const html = fs.readFileSync(
      path.resolve(__dirname, '../../Frontend/src/admin.html'),
      'utf8'
    );
    document.documentElement.innerHTML = html;
  });

  afterEach(() => {
    // Nettoyage du DOM
    document.documentElement.innerHTML = '';
  });

  describe('Admin Structure', () => {
    // vérif container principal admin présent
    test('should have admin-container', () => {
      const container = document.querySelector('.admin-container');
      expect(container).toBeTruthy();
    });

    // check sidebar avec header JEMLO Admin
    test('should have sidebar with JEMLO Admin header', () => {
      const sidebar = document.querySelector('.sidebar');
      const header = document.querySelector('.sidebar-header h1');
      
      expect(sidebar).toBeTruthy();
      expect(header.textContent).toBe('JEMLO Admin');
    });

    // test zne de contenu principal existe
    test('should have main content area', () => {
      const mainContent = document.querySelector('.main-content');
      expect(mainContent).toBeTruthy();
    });
  });

  describe('Sidebar Navigation', () => {
    // vérifier les 6 items de menu dans la sidebar
    test('should have all 6 menu items', () => {
      const menuItems = document.querySelectorAll('.menu-item');
      expect(menuItems.length).toBe(6);
    });

    // check Ttes les sections avec data-section
    test('should have correct menu sections with data-section attributes', () => {
      const dashboard = document.querySelector('[data-section="dashboard"]');
      const fountains = document.querySelector('[data-section="fountains"]');
      const contacts = document.querySelector('[data-section="contacts"]');
      const content = document.querySelector('[data-section="content"]');
      const monitoring = document.querySelector('[data-section="monitoring"]');
      const settings = document.querySelector('[data-section="settings"]');
      
      expect(dashboard).toBeTruthy();
      expect(fountains).toBeTruthy();
      expect(contacts).toBeTruthy();
      expect(content).toBeTruthy();
      expect(monitoring).toBeTruthy();
      expect(settings).toBeTruthy();
    });

    // dashboard actif par défaut
    test('should have dashboard active by default', () => {
      const dashboard = document.querySelector('[data-section="dashboard"]');
      expect(dashboard.classList.contains('active')).toBe(true);
    });

    // btn de déconnexion présent
    test('should have logout button', () => {
      const logoutBtn = document.querySelector('.logout-btn');
      expect(logoutBtn).toBeTruthy();
      expect(logoutBtn.textContent).toBe('Déconnexion');
    });
  });

  describe('Admin Header', () => {
    // check Titre de page
    test('should display page title', () => {
      const pageTitle = document.getElementById('page-title');
      expect(pageTitle.textContent).toBe('Tableau de bord');
    });

    // test Section user-info avec avatar
    test('should have user info section with avatar', () => {
      const userInfo = document.querySelector('.user-info');
      const avatar = document.querySelector('.avatar');
      
      expect(userInfo).toBeTruthy();
      expect(avatar).toBeTruthy();
    });
  });

  describe('Dashboard Statistics', () => {
    // vérif de la grille de stats avec 4 cartes
    test('should have stats grid with 4 cards', () => {
      const statsGrid = document.querySelector('.stats-grid');
      const statCards = statsGrid.querySelectorAll('.stat-card');
      
      expect(statsGrid).toBeTruthy();
      expect(statCards.length).toBe(4);
    });

    // vérif les id des stats cards
    test('should have all stat card IDs', () => {
      expect(document.getElementById('stat-fountains')).toBeTruthy();
      expect(document.getElementById('stat-water')).toBeTruthy();
      expect(document.getElementById('stat-plastic')).toBeTruthy();
      expect(document.getElementById('stat-bottles')).toBeTruthy();
    });

    // test Icônes des stats correctes
    test('should have correct stat icons', () => {
      const icons = Array.from(document.querySelectorAll('.stat-icon'))
        .map(icon => icon.textContent);
      
      expect(icons).toContain('⚡');
      expect(icons).toContain('💧');
      expect(icons).toContain('🌱');
      expect(icons).toContain('♻️');
    });
  });

  describe('Dashboard Widgets', () => {
    // vérif Widget de graphique fontaine
    test('should have fountain consumption chart', () => {
      const canvas = document.getElementById('fountainChart');
      expect(canvas).toBeTruthy();
      expect(canvas.tagName).toBe('CANVAS');
    });

    // vérif Widget liste d'activités
    test('should have activity list widget', () => {
      const activityList = document.querySelector('.activity-list');
      const activityItems = activityList.querySelectorAll('.activity-item');
      
      expect(activityList).toBeTruthy();
      expect(activityItems.length).toBeGreaterThan(0);
    });

    // vérif Items d'activité avec time et text
    test('should have activity items with time and text', () => {
      const firstItem = document.querySelector('.activity-item');
      const time = firstItem.querySelector('.activity-time');
      const text = firstItem.querySelector('.activity-text');
      
      expect(time).toBeTruthy();
      expect(text).toBeTruthy();
    });
  });

  describe('Content Sections', () => {
    // vérif Ttes les section de contenu existe
    test('should have all content sections', () => {
      expect(document.getElementById('dashboard')).toBeTruthy();
      expect(document.getElementById('fountains')).toBeTruthy();
      expect(document.getElementById('contacts')).toBeTruthy();
      expect(document.getElementById('content')).toBeTruthy();
      expect(document.getElementById('monitoring')).toBeTruthy();
      expect(document.getElementById('settings')).toBeTruthy();
    });

    // check dashboard est le seul actif pa défaut
    test('should have only dashboard active by default', () => {
      const dashboard = document.getElementById('dashboard');
      expect(dashboard.classList.contains('active')).toBe(true);
    });
  });

  describe('Fountains Section', () => {
    // test btn "Ajouter une fontaine"
    test('should have add fountain button', () => {
      const addBtn = document.querySelector('#fountains .btn-primary');
      expect(addBtn).toBeTruthy();
      expect(addBtn.textContent).toBe('Ajouter une fontaine');
    });

    // vérif Grille fontaines présent
    test('should have fountains grid', () => {
      const fountainsGrid = document.querySelector('.fountains-grid');
      expect(fountainsGrid).toBeTruthy();
    });

    // check Card fontaine avec statut
    test('should have fountain card with status', () => {
      const fountainCard = document.querySelector('.fountain-card');
      const status = fountainCard.querySelector('.fountain-status');
      
      expect(fountainCard).toBeTruthy();
      expect(status).toBeTruthy();
      expect(status.textContent).toBe('En ligne');
    });
  });

  describe('Contacts Section', () => {
    // test Filtre avec 4 tab
    test('should have filter tabs', () => {
      const tabs = document.querySelectorAll('.filter-tabs .tab');
      expect(tabs.length).toBe(4);
    });

    // vérif Talbeau de contacts preset
    test('should have contacts table', () => {
      const table = document.querySelector('.contacts-table table');
      expect(table).toBeTruthy();
    });

    // check Header du tableau correct
    test('should have correct table headers', () => {
      const headers = Array.from(document.querySelectorAll('.contacts-table th'))
        .map(th => th.textContent);
      
      expect(headers).toContain('Date');
      expect(headers).toContain('Entreprise');
      expect(headers).toContain('Contact');
      expect(headers).toContain('Statut');
    });
  });

  describe('Content Management Section', () => {
    // test Secton gestion contenu exsite
    test('should have content management section', () => {
      const contentMgmt = document.querySelector('.content-management');
      expect(contentMgmt).toBeTruthy();
    });

    // vérif Carte de contnu présentes
    test('should have content cards', () => {
      const contentCards = document.querySelectorAll('.content-card');
      expect(contentCards.length).toBeGreaterThan(0);
    });

    // check Carte "Compte utilisateurs" avec btn
    test('should have user accounts card', () => {
      const cards = Array.from(document.querySelectorAll('.content-card'));
      const userCard = cards.find(card => 
        card.querySelector('h4').textContent === 'Comptes utilisateurs'
      );
      
      expect(userCard).toBeTruthy();
      expect(userCard.textContent).toContain('Ajouter un nouveau compte admin');
    });
  });

  describe('Create User Modal', () => {
    // test Modal création utilisateur
    test('should have create user modal', () => {
      const modal = document.getElementById('createUserModal');
      expect(modal).toBeTruthy();
      expect(modal.classList.contains('modal')).toBe(true);
    });

    // vérif Form avec champ requis
    test('should have create user form with required fields', () => {
      const form = document.getElementById('createUserForm');
      const emailInput = document.getElementById('userEmail');
      const passwordInput = document.getElementById('userPassword');
      
      expect(form).toBeTruthy();
      expect(emailInput.required).toBe(true);
      expect(passwordInput.required).toBe(true);
      expect(passwordInput.minLength).toBe(6);
    });

    // check Boutn fermeture modal
    test('should have close button', () => {
      const closeBtn = document.querySelector('.modal-content .close');
      expect(closeBtn).toBeTruthy();
      expect(closeBtn.textContent).toBe('×');
    });

    // test Div mesage pour feedback
    test('should have message div', () => {
      const messageDiv = document.getElementById('createUserMessage');
      expect(messageDiv).toBeTruthy();
      expect(messageDiv.classList.contains('message')).toBe(true);
    });
  });

  describe('Settings Section', () => {
    // vérif Formulare de paramètre
    test('should have settings form', () => {
      const settingsForm = document.querySelector('.settings-form');
      expect(settingsForm).toBeTruthy();
    });

    // check Input emai admin (readonly)
    test('should have admin email input (readonly)', () => {
      const adminEmail = document.getElementById('adminEmailInput');
      expect(adminEmail).toBeTruthy();
      expect(adminEmail.readOnly).toBe(true);
    });

    // test Chckbox notifications
    test('should have notification checkbox', () => {
      const notificationCheckbox = document.getElementById('notificationCheckbox');
      expect(notificationCheckbox).toBeTruthy();
      expect(notificationCheckbox.type).toBe('checkbox');
    });

    // vérif Swich slider pour checkbox
    test('should have switch slider', () => {
      const slider = document.querySelector('.slider');
      expect(slider).toBeTruthy();
    });
  });

  describe('Monitoring Section', () => {
    // check Grille de monitoring
    test('should have monitoring grid', () => {
      const monitoringGrid = document.querySelector('.monitoring-grid');
      expect(monitoringGrid).toBeTruthy();
    });

    // test Carte alerte système
    test('should have system alerts card', () => {
      const cards = Array.from(document.querySelectorAll('.monitor-card'));
      const alertCard = cards.find(card => 
        card.querySelector('h4').textContent === 'Alertes système'
      );
      
      expect(alertCard).toBeTruthy();
    });

    // vérif List d'alertes présent
    test('should have alert list', () => {
      const alertList = document.querySelector('.alert-list');
      expect(alertList).toBeTruthy();
    });
  });

  describe('Scripts', () => {
    // check Chart.js CDN chargé
    test('should have Chart.js CDN', () => {
      const chartScript = Array.from(document.querySelectorAll('script'))
        .find(s => s.src && s.src.includes('chart.js'));
      
      expect(chartScript).toBeTruthy();
    });

    // test Scrip admin.js présent
    test('should have admin.js script', () => {
      const adminScript = Array.from(document.querySelectorAll('script'))
        .find(s => s.getAttribute('src') === 'scripts/admin.js');
      
      expect(adminScript).toBeTruthy();
    });
  });

  describe('Demo Navigation', () => {
    // vérif Boutons navigaton demo
    test('should have demo navigation buttons', () => {
      const demoNav = document.querySelector('.demo-nav');
      expect(demoNav).toBeTruthy();
    });

    // check 4 bouton demo présent
    test('should have 4 demo buttons', () => {
      const buttons = document.querySelectorAll('.demo-nav button');
      expect(buttons.length).toBe(4);
    });
  });

  describe('Authentication Scripts', () => {
    // test Scrips d'authentification inline présents
    test('should have authentication scripts', () => {
      const scripts = Array.from(document.querySelectorAll('script'))
        .filter(s => !s.src);
      
      // vérif Au moin un script inline pour l'auth
      expect(scripts.length).toBeGreaterThan(0);
    });
  });
});
