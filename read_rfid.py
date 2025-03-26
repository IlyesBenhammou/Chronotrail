import requests
import time
from mfrc522 import SimpleMFRC522

server_url = "http://172.30.232.10:4000/api/temps-course"
reader = SimpleMFRC522()

print("📡 Passez votre carte pour enregistrer le temps de course...")

try:
    while True:
        uid, _ = reader.read_no_block()
        
        if uid:
            uid_hex = format(uid, 'X')
            print(f"🎫 Carte détectée ! UID : {uid_hex}")

            payload = {"uid": uid_hex}
            try:
                response = requests.post(server_url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    if "temps" in data:
                        print(f"🏁 Temps final : {data['temps']} sec - {data['nom_coureur']} (Dossard {data['dossard']}, Course {data['id_course']})")
                    elif data["message"] == "Départ enregistré":
                        print(f"✅ Départ enregistré pour {data['nom_coureur']} (Dossard {data['dossard']}, Course {data['id_course']})")
                else:
                    print(f"⚠️ Erreur d'envoi : {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"❌ Erreur de connexion : {e}")
        
        time.sleep(1)

except KeyboardInterrupt:
    print("\n🔴 Arrêt du programme.")
finally:
    reader.close()
