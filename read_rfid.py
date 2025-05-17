import RPi.GPIO as GPIO
import time
import requests
from mfrc522 import SimpleMFRC522

# Adresse IP du Raspberry Pi 2 (backend)
SERVER_URL = "http://172.30.232.10:4000/api/temps-course"

reader = SimpleMFRC522()

print("📢 Passez votre carte RFID...")

try:
    while True:
        uid, _ = reader.read_no_block()
        
        if uid:
            uid_hex = format(uid, 'X')
            print(f"🎫 Carte détectée ! UID : {uid_hex}")

            try:
                response = requests.post(SERVER_URL, json={"uid": uid_hex})
                data = response.json()

                if response.status_code == 200:
                    if "temps" in data:
                        print(f"⏱️ Temps final : {data['temps']} sec (Dossard {data['dossard']})")
                    elif "message" in data:
                        print(f"✅ {data['message']} (Dossard {data.get('dossard', '?')})")
                else:
                    print(f"⚠️ Erreur : {response.status_code} - {data}")
                    
            except requests.exceptions.RequestException as e:
                print(f"❌ Erreur connexion serveur : {e}")
        
        time.sleep(1)

except KeyboardInterrupt:
    print("\n🛑 Arrêt du programme.")
finally:
    GPIO.cleanup()
