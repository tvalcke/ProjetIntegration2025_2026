import RPi.GPIO as GPIO
import time

# --- GPIO setup ---
SWITCH_PIN = 17  # Change if using a different pin

GPIO.setmode(GPIO.BCM)  # Use Broadcom pin numbering
GPIO.setup(SWITCH_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)  # Pull-up resistor enabled

print("Monitoring switch state... (CTRL+C to exit)")

try:
    last_state = GPIO.input(SWITCH_PIN)
    while True:
        current_state = GPIO.input(SWITCH_PIN)
        if current_state != last_state:
            if current_state == GPIO.LOW:
                print("Switch turned ON (closed)")
            else:
                print("Switch turned OFF (open)")
            last_state = current_state
        time.sleep(0.05)  # Small delay to debounce and reduce CPU usage
except KeyboardInterrupt:
    print("Exiting program...")
finally:
    GPIO.cleanup()

