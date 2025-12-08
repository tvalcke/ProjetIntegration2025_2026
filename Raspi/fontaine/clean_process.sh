#!/bin/bash
# Nettoyage des processus Fontaine

echo "[Fontaine Cleanup] Killing leftover processes..."

# Kill tous les main.py backend
MAIN_PIDS=$(pgrep -f "main.py")
if [ -n "$MAIN_PIDS" ]; then
    echo "Killing main.py PIDs: $MAIN_PIDS"
    kill -9 $MAIN_PIDS
else
    echo "Aucun main.py en cours."
fi

# Kill tous les react-scripts / npm start du frontend
FRONTEND_PIDS=$(pgrep -f "react-scripts")
if [ -n "$FRONTEND_PIDS" ]; then
    echo "Killing frontend PIDs: $FRONTEND_PIDS"
    kill -9 $FRONTEND_PIDS
else
    echo "Aucun frontend en cours."
fi

# Optionnel : kill Chromium ouvert sur localhost:3000
CHROMIUM_PIDS=$(pgrep -f "chromium")
if [ -n "$CHROMIUM_PIDS" ]; then
    echo "Killing Chromium PIDs: $CHROMIUM_PIDS"
    kill -9 $CHROMIUM_PIDS
else
    echo "Aucun Chromium en cours."
fi

echo "[Fontaine Cleanup] Done."
