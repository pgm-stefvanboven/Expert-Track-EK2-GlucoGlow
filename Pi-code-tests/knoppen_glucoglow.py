# Import necessary libraries
import pygame
import requests

# Initialize Pygame and the joystick module
pygame.init()
pygame.joystick.init()

# Check if any joysticks are connected
joystick = pygame.joystick.Joystick(0)
joystick.init()

print("Encoder actief")

# Main loop to handle joystick events
while True:

    # Handle Pygame events
    for event in pygame.event.get():
        
        # Check if the event is a joystick button press
        if event.type == pygame.JOYBUTTONDOWN:
            
            # Check which button was pressed and send a request to the server
            if event.button == 0:
                
                # Print which button was pressed and send a GET request to the server
                print("Knop 1")
                requests.get(
                    "http://localhost:5000/button/0"
                )
                
            # Check if button 1 was pressed
            elif event.button == 1:

                # Print which button was pressed and send a GET request to the server
                print("Knop 2")
                requests.get(
                    "http://localhost:5000/button/1"
                )
                
            # Check if button 2 was pressed
            elif event.button == 2:

                # Print which button was pressed and send a GET request to the server
                print("Knop 3")
                requests.get(
                    "http://localhost:5000/button/2"
                )
