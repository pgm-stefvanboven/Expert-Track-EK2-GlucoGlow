import pygame
import time

pygame.init()
pygame.joystick.init()

joystick = pygame.joystick.Joystick(0)
joystick.init()

glucose = 60
laatste_daling = time.time()

vorige_status = [False, False, False]

print("Start glucose:", glucose)

while True:
    pygame.event.pump()

    # Glucose daalt elke seconde
    if time.time() - laatste_daling >= 1:
        glucose -= 1
        print("Glucose:", glucose)
        laatste_daling = time.time()

    # Knoppen controleren
    for i in range(3):
        huidige_status = joystick.get_button(i)

        if huidige_status and not vorige_status[i]:

            if i == 0:
                glucose += 10
                print("Suiker gegeven ->", glucose)

            elif i == 1:
                print("Wachten")

            elif i == 2:
                print("Huidige waarde:", glucose)

        vorige_status[i] = huidige_status

    time.sleep(0.01)
