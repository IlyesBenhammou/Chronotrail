import RPi.GPIO as GPIO
import time
import requests
from mfrc522 import SimpleMFRC522

reader = SimpleMFRC522()
serveur_url_temps = "http://172.30.232.10:4000/api/temps-course"

print("📢 Lecture RFID en cours...")

try:
    while True:
        uid, _ = reader.read_no_block()
        if uid:
            uid_hex = format(uid, 'X')
            print(f"🎫 Carte détectée : UID = {uid_hex}")

            try:
                response = requests.post(serveur_url_temps, json={"uid": uid_hex})
                data = response.json()
                if response.status_code == 200:
                    print(f"✅ {data['message']} - Dossard {data['dossard']}, Course {data['course']}")
                    if "temps" in data:
                        print(f"⏱️ Temps : {data['temps']} sec")
                else:
                    print(f"⚠️ Erreur : {data['error']}")
            except Exception as e:
                print(f"❌ Erreur de connexion : {e}")

        time.sleep(1)

except KeyboardInterrupt:
    print("🛑 Fin du programme")
finally:
    GPIO.cleanup()
