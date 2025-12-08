from gpiozero import Button
button = Button(17)
print("Appuyez sur le bouton...")
button.wait_for_press()
print("Bouton pressé !")
