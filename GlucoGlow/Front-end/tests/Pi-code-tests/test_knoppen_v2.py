import pygame
import time

pygame.init()
pygame.joystick.init()

joystick = pygame.joystick.Joystick(0)
joystick.init()

vorige_status = [False, False, False]

while True:
    pygame.event.pump()

    for i in range(3):
        huidige_status = joystick.get_button(i)

        if huidige_status and not vorige_status[i]:
            print(f"Knop {i} één keer ingedrukt")

        vorige_status[i] = huidige_status

    time.sleep(0.01)
