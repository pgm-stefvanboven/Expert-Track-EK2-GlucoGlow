import pygame
import time
import requests 

pygame.init()
scherm = pygame.display.set_mode((100, 100))
pygame.display.set_caption("Knoppen Lezer")
pygame.joystick.init()

print("🚀 SCRIPT GELADEN (Stabiele Versie)")

SERVER_URL = "http://10.45.239.212:5000/button/" 
actieve_joysticks = {}

while True:
    try:
        for event in pygame.event.get():
            
            # --- DE GELUIDSDEMPER ---
            # Event 1536 is de 'stick drift' spam van de DragonRise. We negeren dit stilletjes.
            if event.type == 1536:
                continue 
            
            # --- HOTPLUGGING ---
            if event.type == pygame.JOYDEVICEADDED:
                joy = pygame.joystick.Joystick(event.device_index)
                joy.init() # <--- Dit wekt hem tot leven
                actieve_joysticks[joy.get_instance_id()] = joy
                print(f"🔌 USB Verbonden: {joy.get_name()}")

            elif event.type == pygame.JOYDEVICEREMOVED:
                if event.instance_id in actieve_joysticks:
                    del actieve_joysticks[event.instance_id]
                print("⚠️ USB verbinding verbroken! (Hardware power dip)")

            # --- KNOPPEN LOGICA ---
            elif event.type == pygame.JOYBUTTONDOWN:
                knop_id = event.button
                print(f"✅ Knop {knop_id} ingedrukt!")
                
                try:
                    # Stuur het naar je game-server
                    requests.get(f"{SERVER_URL}{knop_id}", timeout=1)
                except Exception:
                    pass

    except Exception:
        # Fouten negeren zodat het script blijft draaien
        pass

    time.sleep(0.01)