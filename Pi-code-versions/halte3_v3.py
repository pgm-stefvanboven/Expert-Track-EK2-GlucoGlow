import pygame
import time

pygame.init()
pygame.joystick.init()

joystick = pygame.joystick.Joystick(0)
joystick.init()

glucose = 60
latest_drop = time.time()
start_time = time.time()

previous_status = [False, False, False]

print("Start glucose:", glucose)

while True:
    pygame.event.pump()

    # Elke seconde glucose laten dalen
    if time.time() - latest_drop >= 1:

        glucose -= 1

        remaining = 60 - int(time.time() - start_time)

        # WIN
        if remaining <= 0:
            print("\nGEWONNEN!")
            print("Je hebt Thomas veilig door deze situatie geholpen.")
            break

        # VERLIES
        if glucose <= 30:
            print("\nGAME OVER")
            print("Thomas kreeg een ernstige hypo.")
            break

        print("Glucose:", glucose, "| Tijd:", remaining)

        latest_drop = time.time()

    # Knoppen controleren
    for i in range(3):

        current_status = joystick.get_button(i)

        if current_status and not previous_status[i]:

            # Rode knop
            if i == 0:
                glucose += 10
                print("Suiker gegeven ->", glucose)

            # Gele knop
            elif i == 1:
                print("Wachten")

            # Groene knop
            elif i == 2:
                print("Huidige waarde:", glucose)

        previous_status[i] = current_status

    time.sleep(0.01)