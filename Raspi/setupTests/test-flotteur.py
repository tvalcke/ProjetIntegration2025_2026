import RPi.GPIO as GPIO
import time

# --- GPIO setup ---
BUTTON_PIN = 17  # BCM numbering (Pin 11)
GPIO.setmode(GPIO.BCM)
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
# Using an internal pull-up resistor; the pin reads LOW when pressed

print("Press the button! (Ctrl+C to exit)")

try:
    while True:
        if GPIO.input(BUTTON_PIN) == GPIO.LOW:
            print("Button pressed!")
            time.sleep(0.3)  # debounce delay
        else:
            time.sleep(0.05)

except KeyboardInterrupt:
    print("\nExiting program.")

finally:
    GPIO.cleanup()
