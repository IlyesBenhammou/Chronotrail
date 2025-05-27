import requests
import time
from mfrc522 import SimpleMFRC522

url_temps = "http://172.30.232.10:4000/api/temps-course"
reader = SimpleMFRC522()

print("📢 Passez votre carte RFID...")

try:
    while True:
        uid, _ = reader.read_no_block()
        if uid:
            uid_str = format(uid, 'X')
            print(f"🎫 Carte détectée ! UID : {uid_str}")
            try:
                response = requests.post(url_temps, json={"uid": uid_str})
                if response.status_code == 200:
                    data = response.json()
                    if "temps" in data:
                        print(f"⏱️ Temps final : {data['temps']} sec pour Dossard {data['dossard']}")
                    else:
                        print(f"✅ {data['message']}")
                else:
                    print(f"⚠️ Erreur : {response.status_code} - {response.text}")
            except requests.exceptions.RequestException as e:
                print(f"❌ Erreur de connexion : {e}")
        time.sleep(1)
except KeyboardInterrupt:
    print("🛑 Arrêt du programme.")
