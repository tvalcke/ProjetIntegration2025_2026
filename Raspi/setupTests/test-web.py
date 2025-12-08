from flask import Flask, render_template_string
import RPi.GPIO as GPIO
import threading
import time

# --- GPIO setup ---
SWITCH_PIN = 17  # BCM numbering
GPIO.setmode(GPIO.BCM)
GPIO.setup(SWITCH_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# --- Customizable display text ---
TEXT_ON = "Il n'y a plus d'eau en reserve"
TEXT_OFF = "Il reste de l'eau dans la reserve"

# --- Shared variable ---
display_text = "Waiting for state..."
switch_is_on = None

# --- Flask web app ---
app = Flask(__name__)

# --- Stylish HTML Template ---
HTML_PAGE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="1">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Raspberry Pi Switch Monitor</title>
  <style>
    :root {
      --bg-color: #121212;
      --card-bg: #1e1e1e;
      --on-color: #4caf50;
      --off-color: #e53935;
      --text-color: #f1f1f1;
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }

    h1 {
      font-size: 3.2em;
      margin-bottom: 10px;
      text-align: center;
      transition: color 0.5s ease, transform 0.3s ease;
    }

    .card {
      padding: 40px 60px;
      border-radius: 20px;
      background-color: var(--card-bg);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      text-align: center;
    }

    .on h1 {
      color: var(--off-color);
      transform: scale(1.05);
    }

    .off h1 {
      color: var(--on-color);
      transform: scale(1.0);
    }

    footer {
      position: absolute;
      bottom: 20px;
      font-size: 0.9em;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="card {{css_class}}">
    <h1>{{text}}</h1>
  </div>
  <footer>Raspberry Pi Switch Monitor</footer>
</body>
</html>
"""

@app.route("/")
def index():
    css_class = "on" if switch_is_on else "off"
    return render_template_string(HTML_PAGE, text=display_text, css_class=css_class)

# --- Background thread that monitors the switch ---
def switch_listener():
    global switch_is_on, display_text
    last_state = GPIO.input(SWITCH_PIN)
    switch_is_on = (last_state == GPIO.LOW)
    display_text = TEXT_ON if switch_is_on else TEXT_OFF

    while True:
        current_state = GPIO.input(SWITCH_PIN)
        if current_state != last_state:
            if current_state == GPIO.LOW:
                switch_is_on = True
                display_text = TEXT_ON
            else:
                switch_is_on = False
                display_text = TEXT_OFF
            last_state = current_state
        time.sleep(0.05)

# --- Main entry point ---
if __name__ == "__main__":
    try:
        threading.Thread(target=switch_listener, daemon=True).start()
        app.run(host="0.0.0.0", port=5000)
    except KeyboardInterrupt:
        print("\nExiting...")
    finally:
        GPIO.cleanup()
