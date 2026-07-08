import os

# --- DE MAGISCHE ARCADE INSTELLINGEN ---
# 1. Zorg dat de joystick altijd gelezen wordt, ook als de browser open staat (geen focus nodig!)
os.environ["SDL_JOYSTICK_ALLOW_BACKGROUND_EVENTS"] = "1"
# 2. Forceer Pygame om onzichtbaar te blijven en géén schermpje te maken
os.environ["SDL_VIDEODRIVER"] = "dummy"

import pygame
import time
import requests 

# We starten Pygame, maar zonder display functies! Geen zwart schermpje meer!
pygame.init()
pygame.joystick.init()

print("🚀 ONZICHTBAAR SCRIPT GELADEN! Je kunt nu naar je browser gaan.")

SERVER_URL = "http://10.45.239.212:5000/button/" 
actieve_joysticks = {}

while True:
    try:
        for event in pygame.event.get():
            
            # --- GELUIDSDEMPER VOOR DE SPAM ---
            if event.type == 1536:
                continue 
            
            # --- HOTPLUGGING (Als de USB hapert) ---
            if event.type == pygame.JOYDEVICEADDED:
                joy = pygame.joystick.Joystick(event.device_index)
                joy.init()
                actieve_joysticks[joy.get_instance_id()] = joy
                print(f"🔌 USB Verbonden: {joy.get_name()}")

            elif event.type == pygame.JOYDEVICEREMOVED:
                if event.instance_id in actieve_joysticks:
                    del actieve_joysticks[event.instance_id]
                print("⚠️ USB verbinding verbroken! Wachten op herstel...")

            # --- KNOPPEN LOGICA ---
            elif event.type == pygame.JOYBUTTONDOWN:
                knop_id = event.button
                print(f"✅ Knop {knop_id} ingedrukt!")
                
                try:
                    requests.get(f"{SERVER_URL}{knop_id}", timeout=1)
                except Exception:
                    pass

    except Exception:
        pass

    time.sleep(0.01)