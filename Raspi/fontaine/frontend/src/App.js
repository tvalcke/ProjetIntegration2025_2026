import { useState, useRef, useEffect } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import './styles/App.css'

function App() {
  const [isFilling, setIsFilling] = useState(false)
  const [waterLiters, setWaterLiters] = useState(0)
  const [plasticRecycled, setPlasticRecycled] = useState(0)
  const [bottleLevel, setBottleLevel] = useState(0)
  const fillIntervalRef = useRef(null)
  const lastCompletedBottleRef = useRef(0)
  const [serial, setSerial] = useState("")
  const [isPendingUpdate, setIsPendingUpdate] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8000";


  // --- WebSocket pour le bouton physique ---
  useEffect(() => {
    const ws = new WebSocket(`${API_URL.replace(/^http/, 'ws')}/ws`)

    ws.onmessage = (event) => {
      if (event.data === "start_fill") {
        startFilling()
      }
      if (event.data === "stop_fill") {
        stopFilling()
        setIsPendingUpdate(true);
      }
      if (event.data === "update_done") {
		setIsPendingUpdate(false); // le backend a fini ? refresh autorise
	  }
    }

    ws.onopen = () => console.log("✓ Connecté au backend via WebSocket")
    ws.onerror = (e) => console.error("❌ WebSocket error:", e)
    ws.onclose = () => console.warn("⚠️ WebSocket fermé")

    return () => ws.close()
  }, [])
  
  //-------------------------//
	useEffect(() => {
	  fetch(`${API_URL}/api/serial`)
		.then(res => res.json())
		.then(data => setSerial(data.serial))
		.catch(err => console.error("Erreur fetch serial:", err))
	}, [API_URL])



  // --- Remplissage / arrêt pour WebSocket et bouton virtuel ---
  const startFilling = () => {
    if (isFilling) return
    setIsFilling(true)
    fillIntervalRef.current = setInterval(() => {
      setWaterLiters(prev => prev + 0.008)
    }, 1000)
  }

  const stopFilling = () => {
    setIsFilling(false)
    if (fillIntervalRef.current) {
      clearInterval(fillIntervalRef.current)
      fillIntervalRef.current = null
    }
  }

  const handleMouseDown = () => startFilling()
  const handleMouseUp = () => stopFilling()
  const handleMouseLeave = () => stopFilling()

  // --- Calcul progression et envoi à Firebase ---
  useEffect(() => {
    const currentBottleProgress = (waterLiters % 1) * 100
    setBottleLevel(currentBottleProgress)

    const completedBottles = Math.floor(waterLiters)
    if (completedBottles > lastCompletedBottleRef.current) {
      const newPlastic = plasticRecycled + 42
      setPlasticRecycled(newPlastic)

      // POST vers backend -> Firebase
      fetch(`${API_URL}/api/create-item/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bottleNumber: completedBottles,
          waterLiters,
          plasticRecycledGrams: newPlastic
        })
      })
      .then(() => console.log("✅ Données envoyées à Firebase"))
      .catch(e => console.error("❌ Erreur envoi Firebase:", e))

      lastCompletedBottleRef.current = completedBottles
    }
  }, [waterLiters])

  // --- Lecture initiale depuis Firebase ---
  useEffect(() => {
    const today = new Date().toISOString().slice(0,10)
    fetch(`${API_URL}/api/read-item/${today}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setWaterLiters(data.waterLiters ?? 0)
          setPlasticRecycled(data.plasticRecycledGrams ?? 0)
          lastCompletedBottleRef.current = Math.floor(data.waterLiters ?? 0)
        }
      })
      .catch(e => console.error("Erreur lecture Firebase:", e))
  }, [])
  
  
  useEffect(() => {
	  const today = new Date().toISOString().slice(0,10);

	  const interval = setInterval(() => {
		if (!isFilling && !isPendingUpdate) {

		  fetch(`${API_URL}/api/read-item/${today}`)
			.then(r => r.json())
			.then(data => {
			  if (data) {
				setWaterLiters(data.waterLiters ?? 0);
				setPlasticRecycled(data.plasticRecycledGrams ?? 0);
				lastCompletedBottleRef.current = Math.floor(data.waterLiters ?? 0);
			  }
			})
			.catch(err => console.error("Erreur refresh :", err));
		}
	  }, 5000);

	  return () => clearInterval(interval);
	}, [isFilling, isPendingUpdate]);

  return (
    <div className="fountain-interface">
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

      <div className="counters-section">
		<div className="serial-section">
		  {serial && <QRCodeCanvas value={serial} size={128} />}
		  <p>{serial}</p>
		</div>
        <div className="counter water-counter">
          <h2 className="counter-title">Eau distribuée</h2>
          <div className="counter-value">{waterLiters.toFixed(2)}</div>
          <div className="counter-unit">litres</div>
        </div>
        <div className="counter plastic-counter">
          <h2 className="counter-title">Plastique recyclé</h2>
          <div className="counter-value">{(plasticRecycled / 1000).toFixed(3)}</div>
          <div className="counter-unit">kg</div>
        </div>
      </div>

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
