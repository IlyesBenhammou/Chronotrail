import time
import requests
from mfrc522 import SimpleMFRC522

# Adresses du serveur API
serveur_url_dossard = "http://172.30.232.10:4000/api/dossards"
serveur_url_temps = "http://172.30.232.10:4000/api/temps-course"

reader = SimpleMFRC522()

print("📢 Passez votre carte pour enregistrer le dossard et le temps de course...")

try:
while True:
uid, _ = reader.read_no_block()

if uid:
uid_hex = format(uid, 'X')
print(f"🎫 Carte détectée ! UID : {uid_hex}")

# --- 1. Vérifier si le dossard est connu (requête dossard) ---
try:
response_dossard = requests.post(serveur_url_dossard, json={"uid": uid_hex})
if response_dossard.status_code in [200, 201]:
print(f"✅ {response_dossard.json()['message']}")
else:
print(f"⚠️ Erreur dossard : {response_dossard.status_code} - {response_dossard.text}")
except requests.exceptions.RequestException as e:
print(f"❌ Erreur connexion dossard : {e}")

# --- 2. Enregistrement du temps de course (départ ou arrivée) ---
try:
response_temps = requests.post(serveur_url_temps, json={"uid": uid_hex})
if response_temps.status_code == 200:
data_temps = response_temps.json()
print(f"⏱️ Temps final : {data_temps['temps']} sec")
else:
print(f"⚠️ Erreur temps : {response_temps.status_code} - {response_temps.text}")
except requests.exceptions.RequestException as e:
print(f"❌ Erreur connexion temps : {e}")

time.sleep(1)

except KeyboardInterrupt:
print("\n🛑 Arrêt du programme.")
finally:
reader.cleanup()
