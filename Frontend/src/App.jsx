import { useState, useRef, useEffect } from 'react'
import './styles/App.css'

function App() {
  const [isFilling, setIsFilling] = useState(false)
  const [waterLiters, setWaterLiters] = useState(0)
  const [plasticRecycled, setPlasticRecycled] = useState(0)
  const [bottleLevel, setBottleLevel] = useState(0) // Niveau visuel de la bouteille (0-100%)
  const fillIntervalRef = useRef(null)
  const lastCompletedBottleRef = useRef(0) // Pour éviter les doublons

  // Réinitialiser le niveau de la bouteille quand elle est "pleine" (1L)
  useEffect(() => {
    const currentBottleProgress = (waterLiters % 1) * 100 // Progression de la bouteille actuelle
    setBottleLevel(currentBottleProgress)
    
    // Vérifier si une nouvelle bouteille est complétée
    const completedBottles = Math.floor(waterLiters)
    if (completedBottles > lastCompletedBottleRef.current) {
      console.log(`Nouvelle bouteille complétée! Bouteille #${completedBottles}, +42g`)
      setPlasticRecycled(prev => {
        const newValue = prev + 42
        console.log(`Plastique: ${prev}g -> ${newValue}g`)

        const API_URL = import.meta.env.VITE_API_URL
        fetch("http://localhost:8000/")
            .then(res => res.json())
            .then(data => console.log(data))

        return newValue
      })
      lastCompletedBottleRef.current = completedBottles
    }
  }, [waterLiters])

  const handleMouseDown = () => {
    if (isFilling) return
    
    setIsFilling(true)
    
    // Démarrer le remplissage continu
    fillIntervalRef.current = setInterval(() => {
      setWaterLiters(prev => prev + 0.025) // +0.025L toutes les 100ms
    }, 100) // Mise à jour toutes les 100ms pour un remplissage fluide
  }

  const handleMouseUp = () => {
    setIsFilling(false)
    
    // Arrêter le remplissage
    if (fillIntervalRef.current) {
      clearInterval(fillIntervalRef.current)
      fillIntervalRef.current = null
    }
  }

  const handleMouseLeave = () => {
    // Arrêter le remplissage si on sort du bouton
    handleMouseUp()
  }

  return (
    <div className="fountain-interface">
      {/* Section bouteille (1/3 gauche) */}
      <div className="bottle-section">
        <div className="bottle-container">
          <div className="bottle">
            <div 
              className={`water-level ${isFilling ? 'filling' : ''}`}
              style={{ height: `${bottleLevel}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Section compteurs (2/3 droite) */}
      <div className="counters-section">
        {/* Compteur litres d'eau */}
        <div className="counter water-counter">
          <h2 className="counter-title">Eau distribuée</h2>
          <div className="counter-value">{waterLiters.toFixed(1)}</div>
          <div className="counter-unit">litres</div>
        </div>

        {/* Compteur plastique recyclé */}
        <div className="counter plastic-counter">
          <h2 className="counter-title">Plastique recyclé</h2>
          <div className="counter-value">{(plasticRecycled / 1000).toFixed(3)}</div>
          <div className="counter-unit">kg</div>
        </div>
      </div>

      {/* Bouton de remplissage */}
      <button 
        className={`fill-button ${isFilling ? 'filling' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        {isFilling ? 'Remplissage...' : 'Maintenir pour remplir'}
      </button>
    </div>
  )
}

export default App
