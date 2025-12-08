import { useState, useRef, useEffect } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import './styles/App.css'

function App() {
  const [isFilling, setIsFilling] = useState(false)
  const [waterLiters, setWaterLiters] = useState(0)
  const [plasticRecycled, setPlasticRecycled] = useState(0)
  const [deptWaterLiters, setDeptWaterLiters] = useState(0)
  const [deptPlasticGrams, setDeptPlasticGrams] = useState(0)
  const [bottleLevel, setBottleLevel] = useState(0)
  const fillIntervalRef = useRef(null)
  const lastCompletedBottleRef = useRef(0)
  const [serial, setSerial] = useState("")
  const [isPendingUpdate, setIsPendingUpdate] = useState(false)
  const API_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8000"

  // --- WebSocket pour le bouton physique et mise à jour temps réel ---
  useEffect(() => {
    const ws = new WebSocket(`${API_URL.replace(/^http/, 'ws')}/ws`)

    ws.onmessage = (event) => {
      const msg = event.data

      if (msg.startsWith("init:")) {
        // format: init:{machineWater}:{machinePlastic}:{deptWater}:{deptPlastic}:{isPressed}
        const [_, mWater, mPlastic, dWater, dPlastic, isPressed] = msg.split(":")
        setWaterLiters(parseFloat(mWater))
        setPlasticRecycled(parseInt(mPlastic))
        lastCompletedBottleRef.current = Math.floor(parseFloat(mWater))
        setDeptWaterLiters(parseFloat(dWater))
        setDeptPlasticGrams(parseInt(dPlastic))
        setIsFilling(isPressed === "True" || isPressed === "true")
        return
      }

      if (msg === "start_fill") startFilling()
      if (msg === "stop_fill") {
        stopFilling()
        setIsPendingUpdate(true)
      }

      if (msg.startsWith("dept_update:")) {
        // format: dept_update:{deptWater}:{deptPlastic}
        const [_, dWater, dPlastic] = msg.split(":")
        setDeptWaterLiters(parseFloat(dWater))
        setDeptPlasticGrams(parseInt(dPlastic))
      }

      if (msg === "update_done") setIsPendingUpdate(false)
    }

    ws.onopen = () => console.log("✓ Connecté au backend via WebSocket")
    ws.onerror = (e) => console.error("❌ WebSocket error:", e)
    ws.onclose = () => console.warn("⚠️ WebSocket fermé")

    return () => ws.close()
  }, [])

  // --- Serial ---
  useEffect(() => {
    fetch(`${API_URL}/api/serial`)
      .then(res => res.json())
      .then(data => setSerial(data.serial))
      .catch(err => console.error("Erreur fetch serial:", err))
  }, [API_URL])

  // --- Remplissage / arrêt ---
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

  // --- Calcul progression et niveau bouteille ---
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
          lastTransaction: {
            waterLiters: waterLiters - lastCompletedBottleRef.current,
            plasticRecycledGrams: newPlastic - plasticRecycled
          }
        })
      })
      .then(() => console.log("✅ Données envoyées à Firebase"))
      .catch(e => console.error("❌ Erreur envoi Firebase:", e))

      lastCompletedBottleRef.current = completedBottles
    }
  }, [waterLiters])

  // --- Refresh automatique du département toutes les 5s si pas de remplissage en cours ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isFilling && !isPendingUpdate) {
        const today = new Date().toISOString().slice(0,10)
        fetch(`${API_URL}/api/read-department/${today}`)
          .then(r => r.json())
          .then(data => {
            if (data) {
              setDeptWaterLiters(data.waterLiters ?? 0)
              setDeptPlasticGrams(data.plasticRecycledGrams ?? 0)
            }
          })
          .catch(err => console.error("Erreur refresh :", err))
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isFilling, isPendingUpdate])

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
          <h2 className="counter-title">Eau distribuée (machine)</h2>
          <div className="counter-value">{waterLiters.toFixed(2)}</div>
          <div className="counter-unit">litres</div>
        </div>

        <div className="counter water-counter-dept">
          <h2 className="counter-title">Eau totale (département)</h2>
          <div className="counter-value">{deptWaterLiters.toFixed(2)}</div>
          <div className="counter-unit">litres</div>
        </div>
        <div className="counter plastic-counter-dept">
          <h2 className="counter-title">Plastique total (département)</h2>
          <div className="counter-value">{(deptPlasticGrams / 1000).toFixed(3)}</div>
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
