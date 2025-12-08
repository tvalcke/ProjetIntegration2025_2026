#!/bin/bash
# === Script de gestion Fontaine ===
# Utilisation: ./start_fontaine.sh {start|stop|status}
# Si aucun argument, start est pris par defaut

BACKEND_DIR="/home/jemlo/projet/fontaine/backend"
FRONTEND_DIR="/home/jemlo/projet/fontaine/frontend"
LOG_DIR="/home/jemlo/projet/fontaine/logs"
PID_FILE="$LOG_DIR/pids.txt"

mkdir -p "$LOG_DIR"

# --- Fonctions ---
start() {
    echo "[Fontaine] Demarrage..."

    # --- Backend ---
    /usr/bin/python3 "$BACKEND_DIR/main.py" > "$LOG_DIR/backend.log" 2>&1 &
    BACK_PID=$!

    # --- Frontend ---
    cd "$FRONTEND_DIR"
    /usr/bin/npm start -- --host > "$LOG_DIR/frontend.log" 2>&1 &
    FRONT_PID=$!

    # --- Attendre que le frontend soit pret ---
    FRONTEND_URL="http://localhost:3000"
    echo "[Fontaine] Attente du frontend..."
    until curl --output /dev/null --silent --head --fail $FRONTEND_URL; do
        sleep 1
    done
    echo "[Fontaine] Frontend pret !"

    # --- Lancer Chromium en fullscreen en tant qu'utilisateur normal ---
	USER_NORMAL=jemlo
	DISPLAY=:0 sudo -u $USER_NORMAL /usr/bin/chromium --noerrdialogs --kiosk $FRONTEND_URL &


    # --- Sauvegarder PID ---
    echo "$BACK_PID $FRONT_PID" > "$PID_FILE"
    echo "[Fontaine] Backend PID: $BACK_PID | Frontend PID: $FRONT_PID"
}

status() {
    if [ ! -f "$PID_FILE" ]; then
        echo "[Fontaine] Aucun service lance."
        return
    fi
    read BACK_PID FRONT_PID < "$PID_FILE"
    echo "[Fontaine] Status des services :"
    ps -p $BACK_PID > /dev/null && echo "? Backend ($BACK_PID) tourne" || echo "? Backend arrete"
    ps -p $FRONT_PID > /dev/null && echo "? Frontend ($FRONT_PID) tourne" || echo "? Frontend arrete"
}

stop() {
    echo "[Fontaine] Arret des services..."

    # Tuer backend et frontend si PID sauvegardes
    if [ -f "$PID_FILE" ]; then
        read BACK_PID FRONT_PID < "$PID_FILE"
        echo "? Arret du backend ($BACK_PID)"
        kill $BACK_PID 2>/dev/null
        echo "? Arret du frontend ($FRONT_PID)"
        kill $FRONT_PID 2>/dev/null
        rm -f "$PID_FILE"
    fi

    # Nettoyage des processus Node restants du frontend
    FRONT_PIDS=$(pgrep -f "$FRONTEND_DIR")
    if [ -n "$FRONT_PIDS" ]; then
        echo "? Nettoyage des processus Node du frontend..."
        kill -9 $FRONT_PIDS 2>/dev/null
    fi

    # Nettoyage Chromium eventuel
    CHROME_PIDS=$(pgrep -f chromium)
    if [ -n "$CHROME_PIDS" ]; then
        echo "? Nettoyage des processus Chromium..."
        kill -9 $CHROME_PIDS 2>/dev/null
    fi

    echo "[Fontaine] Tous les services arretes."
}

# --- Action par defaut : start ---
ACTION=${1:-start}

case "$ACTION" in
    start) start ;;
    stop) stop ;;
    status) status ;;
    *) echo "Usage: $0 {start|stop|status}" ;;
esac
