import os
import time

def get_cpu_temp():
    try:
        with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
            temp_c = float(f.readline().strip()) / 1000.0
            return temp_c
    except FileNotFoundError:
        stream = os.popen("vcgencmd measure_temp")
        output = stream.read().strip()
        if "temp=" in output:
            return float(output.replace("temp=", "").replace("'C", ""))
        return None

while True:
    temp = get_cpu_temp()
    if temp is not None:
        print("CPU Temperature:", round(temp, 2), "C")
    else:
        print("Could not read CPU temperature.")
    time.sleep(2)