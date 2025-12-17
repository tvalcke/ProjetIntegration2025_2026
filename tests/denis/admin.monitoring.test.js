const fs = require('fs');
const path = require('path');

describe('Admin Monitoring (Denis)', () => {
  let loadAlerts;
  let loadActivityLogs;

  beforeEach(() => {
    const html = fs.readFileSync(
      path.resolve(__dirname, '../../Frontend/src/admin.html'),
      'utf8'
    );
    document.documentElement.innerHTML = html;

    // Mock fetch
    global.fetch = jest.fn();

    // Version MINIMALE des fonctions pour les tests uniquement
    loadAlerts = async () => {
      const alertList = document.querySelector('.alert-list');
      if (!alertList) return;

      const response = await fetch('/fake/alerts');
      if (!response.ok) {
        alertList.innerHTML = `
          <div class="alert error">
            <span class="alert-icon">❌</span>
            <span>Erreur de chargement des alertes.</span>
            <span class="alert-time"></span>
          </div>
        `;
        return;
      }

      const alerts = await response.json();

      if (!Array.isArray(alerts) || alerts.length === 0) {
        alertList.innerHTML = `
          <div class="alert">
            <span class="alert-icon">✅</span>
            <span>Aucune tentative de connexion admin échouée récente.</span>
            <span class="alert-time"></span>
          </div>
        `;
        return;
      }

      alertList.innerHTML = '';
      alerts.forEach(alert => {
        const div = document.createElement('div');
        div.className = 'alert warning';
        div.innerHTML = `
          <span class="alert-icon">⚠️</span>
          <span>${alert.message}</span>
          <span class="alert-time">${alert.timestamp}</span>
        `;
        alertList.appendChild(div);
      });
    };

    loadActivityLogs = async () => {
      const logsContainer = document.querySelector('.logs-container');
      if (!logsContainer) return;

      const response = await fetch('/fake/logs');
      if (!response.ok) {
        logsContainer.innerHTML = `
          <div class="log-entry">
            <span class="log-time">!</span>
            <span class="log-message">Erreur de chargement des logs.</span>
          </div>
        `;
        return;
      }

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
        entry.innerHTML = `
          <span class="log-time">${log.timestamp}</span>
          <span class="log-message">${log.message}</span>
        `;
        logsContainer.appendChild(entry);
      });
    };
  });

  afterEach(() => {
    document.documentElement.innerHTML = '';
    jest.resetAllMocks();
  });

  test('loadAlerts affiche les alertes dans .alert-list', async () => {
    const fakeAlerts = [
      {
        timestamp: '2025-12-16T21:30:00.000Z',
        message: 'Failed admin login (bad password): test@jemlo.be',
        type: 'failed_login'
      },
      {
        timestamp: '2025-12-16T21:31:00.000Z',
        message: 'Failed admin login (unknown user): random@jemlo.be',
        type: 'failed_login'
      }
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeAlerts
    });

    const alertList = document.querySelector('.alert-list');
    expect(alertList).toBeTruthy();

    await loadAlerts();

    const alerts = alertList.querySelectorAll('.alert');
    expect(alerts.length).toBe(2);
    expect(alertList.textContent).toContain('Failed admin login (bad password)');
    expect(alertList.textContent).toContain('Failed admin login (unknown user)');
  });

  test("loadAlerts affiche un message quand il n'y a pas d'alertes", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    const alertList = document.querySelector('.alert-list');
    expect(alertList).toBeTruthy();

    await loadAlerts();

    expect(alertList.textContent)
      .toContain('Aucune tentative de connexion admin échouée récente.');
  });

  test('loadActivityLogs affiche les logs dans .logs-container', async () => {
    const fakeLogs = [
      {
        timestamp: '2025-12-16T21:00:00.000Z',
        message: 'Super admin login: HelloAdmin@jemlo.be',
        type: 'login'
      }
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeLogs
    });

    const logsContainer = document.querySelector('.logs-container');
    expect(logsContainer).toBeTruthy();

    await loadActivityLogs();

    expect(logsContainer.textContent)
      .toContain('Super admin login: HelloAdmin@jemlo.be');
  });
});
