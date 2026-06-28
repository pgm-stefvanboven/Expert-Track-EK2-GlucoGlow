import pygame
import requests

pygame.init()
pygame.joystick.init()

joystick = pygame.joystick.Joystick(0)
joystick.init()

print("Encoder actief")

while True:

    for event in pygame.event.get():

        if event.type == pygame.JOYBUTTONDOWN:

            if event.button == 0:

                print("Knop 1")
                requests.get(
                    "http://localhost:5000/button/0"
                )

            elif event.button == 1:

                print("Knop 2")
                requests.get(
                    "http://localhost:5000/button/1"
                )

            elif event.button == 2:

                print("Knop 3")
                requests.get(
                    "http://localhost:5000/button/2"
                )
