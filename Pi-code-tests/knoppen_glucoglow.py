import pygame
import time

pygame.init()
pygame.display.init()
pygame.display.set_mode((100, 100))

pygame.joystick.init()

print("Aantal joysticks:", pygame.joystick.get_count())

if pygame.joystick.get_count() == 0:
    print("Geen joystick gevonden!")
    quit()

joystick = pygame.joystick.Joystick(0)
joystick.init()

print("Joystick:", joystick.get_name())

while True:
    pygame.event.pump()

    for event in pygame.event.get():
        print(event)

    time.sleep(0.01)