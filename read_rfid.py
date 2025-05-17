import requests
import time
from mfrc522 import SimpleMFRC522

# ⚠️ Remplace par l’IP de ton Raspberry Pi 2
URL_DOSSARD = "http://172.30.232.10:4000/api/dossards"
URL_TEMPS = "http://172.30.232.10:4000/api/temps-course"

reader = SimpleMFRC522()

print("📢 Passez votre carte RFID...")

try:
    while True:
        uid, _ = reader.read_no_block()
        if uid:
            uid_hex = format(uid, 'X')
            print(f"🎫 Carte détectée ! UID : {uid_hex}")

            # Envoie UID pour lier au dossard
            try:
                response_dossard = requests.post(URL_DOSSARD, json={"uid": uid_hex})
                print(f"ℹ️ Réponse dossard : {response_dossard.status_code} - {response_dossard.json()}")
            except Exception as e:
                print(f"❌ Erreur connexion dossard : {e}")

            # Envoie UID pour enregistrer temps
            try:
                response_temps = requests.post(URL_TEMPS, json={"uid": uid_hex})
                print(f"⏱️ Réponse temps : {response_temps.status_code} - {response_temps.json()}")
            except Exception as e:
                print(f"❌ Erreur connexion temps : {e}")

        time.sleep(2)

except KeyboardInterrupt:
    print("🛑 Arrêt du programme.")
