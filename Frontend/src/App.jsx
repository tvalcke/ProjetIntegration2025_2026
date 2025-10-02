import { useState } from 'react'
import './styles/App.css'

function App() {
  return (
    <>
      {/* Header/Bannière */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-placeholder">
              J
            </div>
            <h1 className="company-name">Jemlo</h1>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="main-content">
        <section className="welcome-section">
          <h2 className="welcome-title">Bienvenue chez Jemlo</h2>
          <p className="welcome-subtitle">
            Votre solution intelligente de fontaine à eau connectée
          </p>
        </section>

        <div className="status-card">
          <h3 className="status-title">État de la fontaine</h3>
          <div className="status-info">
            <p>Connexion en cours...</p>
            <p><small>Les données de la fontaine s'afficheront ici une fois connectée</small></p>
          </div>
        </div>
      </main>
    </>
  )
}

export default App
