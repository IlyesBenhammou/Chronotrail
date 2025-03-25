import requests
import time
from mfrc522 import SimpleMFRC522

# Correspondance UID → Numéro de dossard
uid_to_dossard = {
    "802295430720": 1,
    "398878301859": 2,
    "913068665419": 3,
    "932696208197": 4
}

# Adresse du serveur
server_url = "http://172.30.232.10:4000/api/rfid"

# Initialisation du lecteur RFID
reader = SimpleMFRC522()

print("📡 Place une carte RFID sur le lecteur...")

try:
    while True:
        # Lire la carte
        uid, _ = reader.read_no_block()
        
        if uid:
            uid_str = str(uid)
            print(f"🎫 Carte détectée ! UID : {uid_str}")

            # Récupérer le numéro de dossard
            dossard = uid_to_dossard.get(uid_str, "Inconnu")

            # Envoyer au serveur
            payload = {"dossard": dossard}
            try:
                response = requests.post(server_url, json=payload)
                if response.status_code == 200:
                    print(f"✅ Dossard {dossard} envoyé avec succès au serveur.")
                else:
                    print(f"⚠️ Erreur d'envoi : {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"❌ Erreur de connexion : {e}")
        
        time.sleep(1)  # Petite pause pour éviter la lecture en boucle

except KeyboardInterrupt:
    print("\n🔴 Arrêt du programme.")
finally:
    reader.close()
