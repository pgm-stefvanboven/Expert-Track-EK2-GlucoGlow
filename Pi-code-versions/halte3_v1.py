import pygame
import time

pygame.init()
pygame.joystick.init()

joystick = pygame.joystick.Joystick(0)
joystick.init()

glucose = 60

while True:
    pygame.event.pump()

    # Rode knop = suiker geven
    if joystick.get_button(0):
        glucose += 10
        print("🔴 SUIKER GEGEVEN")
        print("Glucose:", glucose)
        time.sleep(0.3)

    # Gele knop = wachten
    if joystick.get_button(1):
        print("🟡 WACHTEN...")
        time.sleep(2)

    # Groene knop = checken
    if joystick.get_button(2):
        print("🟢 HUIDIGE WAARDE:", glucose)
        time.sleep(0.3)

    glucose -= 1
    print("Glucose:", glucose)

    time.sleep(1)