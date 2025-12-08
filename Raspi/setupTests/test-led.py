import RPi.GPIO as GPIO
import time

# --- Setup ---
LED_PIN = 17  # BCM numbering (Pin 11)
GPIO.setmode(GPIO.BCM)
GPIO.setup(LED_PIN, GPIO.OUT)

print("LED control started. It will blink every second. (Ctrl+C to exit)")

try:
    while True:
        GPIO.output(LED_PIN, GPIO.HIGH)  # Turn LED on
        print("LED ON")
        time.sleep(0.2)

        GPIO.output(LED_PIN, GPIO.LOW)   # Turn LED off
        print("LED OFF")
        time.sleep(0.2)

except KeyboardInterrupt:
    print("\nProgram stopped by user.")

finally:
    GPIO.cleanup()  # Always reset GPIO pins on exit
    print("GPIO cleanup complete.")
               # Pause 1 second