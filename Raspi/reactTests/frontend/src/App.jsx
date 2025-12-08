import { useEffect, useState } from "react";
import './App.css';

function App() {
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    ws.onmessage = (event) => {
      if (event.data === "button_pressed") {
        console.log("Bouton physique pressé !");
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 1000); // remet à zéro après animation
      }
    };
    return () => ws.close();
  }, []);

  return (
    <div className="App">
      <button
        className={`myButton ${isPressed ? "animate" : ""}`}
        onClick={() => setIsPressed(true)}
      >
        Fontaine
      </button>
    </div>
  );
}

export default App;
