import requests
import time
from mfrc522 import SimpleMFRC522

debut_temps = {}  # Dictionnaire pour stocker les temps de départ

# Correspondance UID → Numéro de dossard
uid_to_dossard = {
    "802295430720": 1,
    "398878301859": 2,
    "913068665419": 3,
    "932696208197": 4
}

# Adresse du serveur sur le Raspberry Pi 2
server_url = "http://172.30.232.10:4000/api/rfid"

# Initialisation du lecteur RFID
reader = SimpleMFRC522()

print("📡 Place une carte RFID sur le lecteur...")

try:
    while True:
        # Lire la carte RFID ratio 
        uid, _ = reader.read_no_block()
        
        if uid:
            uid_hex = format(uid, 'X')  # Convertit l'UID en hexadécimal
            print(f"🎫 Carte détectée ! UID : {uid_hex}")

            # Associer l'UID à un dossard
            dossard = uid_to_dossard.get(str(uid), "Inconnu")

         
            if dossard != None and dossard not in debut_temps:
                debut_temps[dossard] = time.time()
                print(f"⏱️ Début de la course pour le dossard {dossard}.")
                
            
            elif dossard != None and dossard in debut_temps:
                temps_fin = time.time()
                chrono = temps_fin - debut_temps[dossard]
                print(f"⏱️ Fin de la course pour le dossard {dossard}. Temps écoulé : {chrono:.2f} secondes.")

            # Envoi au serveur
            payload = {"dossard": dossard, "temps": round(chrono, 2)}
            try:
                response = requests.post(server_url, json=payload)
                if response.status_code == 200:
                    print(f"✅ Dossard {dossard} envoyé avec succès au serveur.")
                else:
                    print(f"⚠️ Erreur d'envoi : {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"❌ Erreur de connexion : {e}")
        
        time.sleep(1)  # Pause pour éviter la lecture en boucle

except KeyboardInterrupt:
    print("\n🔴 Arrêt du programme.")
    print("\n🔴 Ratio :)")

finally:
    reader.close()