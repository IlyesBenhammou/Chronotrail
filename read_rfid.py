import RPi.GPIO as GPIO
from mfrc522 import SimpleMFRC522
import requests

# URL du serveur sur le 2e Raspberry Pi
server_url = "http://172.30.232.10:4000/api/rfid"

# Initialiser le lecteur RFID
reader = SimpleMFRC522()

print("📡 Place une carte RFID sur le lecteur...")

try:
    while True:
        id, text = reader.read()  # Lire l'UID et le texte associé de la carte RFID
        print(f"🎫 Carte détectée ! UID : {id}")
        
        # Envoi de l'UID au serveur via une requête POST
        payload = {'id': str(id)}  # Envoi de l'UID comme données
        response = requests.post(server_url, json=payload)  # Envoi au serveur
        
        # Vérification si la requête a réussi
        if response.status_code == 200:
            print("✅ UID envoyé avec succès au serveur.")
        else:
            print(f"❌ Erreur lors de l'envoi de l'UID : {response.status_code}")
except KeyboardInterrupt:
    print("\n🔴 Arrêt du programme")
finally:
    GPIO.cleanup()  # Nettoyer les GPIO pour éviter tout conflit
