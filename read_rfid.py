import RPi.GPIO as GPIO
import time
import requests
from mfrc522 import SimpleMFRC522

reader = SimpleMFRC522()
serveur_url_temps = "http://172.30.232.10:4000/api/temps-course"

print("📢 En attente d'une carte...")

try:
    while True:
        uid, _ = reader.read_no_block()
        if uid:
            uid_hex = format(uid, 'X')
            print(f"🎫 Carte lue : {uid_hex}")

            try:
                response = requests.post(serveur_url_temps, json={"uid": uid_hex})
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Arrivée enregistrée pour le dossard {data['dossard']} - Temps : {data['temps']} sec (Course ID: {data['idcourse']})")
                else:
                    try:
                        error_data = response.json()
                        print(f"⚠️ Erreur : {response.status_code} - {error_data.error}")
                    except Exception:
                        print(f"⚠️ Erreur : {response.status_code} - {response.text}")
            except requests.exceptions.RequestException as e:
                print(f"❌ Erreur de connexion : {e}")

        time.sleep(1)

except KeyboardInterrupt:
    print("\n🛑 Programme arrêté.")
finally:
    GPIO.cleanup()
