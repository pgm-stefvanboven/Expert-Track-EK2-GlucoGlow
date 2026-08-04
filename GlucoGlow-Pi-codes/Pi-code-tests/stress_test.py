import pygame
import time

pygame.init()
pygame.joystick.init()

joystick = pygame.joystick.Joystick(0)
joystick.init()

print("Controller gevonden:", joystick.get_name())

while True:
    pygame.event.pump()

    if joystick.get_button(0):
        print("ROOD")

    if joystick.get_button(1):
        print("GEEL")

    if joystick.get_button(2):
        print("GROEN")

    time.sleep(0.05)
