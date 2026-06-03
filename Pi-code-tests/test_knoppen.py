import pygame
import time

pygame.init()
pygame.joystick.init()

joystick = pygame.joystick.Joystick(0)
joystick.init()

print("Controller gevonden:", joystick.get_name())

while True:
    pygame.event.pump()

    for i in range(joystick.get_numbuttons()):
        if joystick.get_button(i):
            print(f"Knop {i} ingedrukt")

    time.sleep(0.1)
