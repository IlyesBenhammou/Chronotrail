import RPi.GPIO as GPIO
import time
import requests
from mfrc522 import SimpleMFRC522
from picamera2 import Picamera2
from datetime import datetime
import os

# Configuration
reader = SimpleMFRC522()
serveur_url_temps = "http://172.30.232.10:4000/api/temps-course"
serveur_url_photo = "http://172.30.232.10:4000/api/enregistrer-photo"

# Dossier pour sauvegarder les photos
PHOTOS_DIR = "/home/projet-raspberry2/chronotrail-capture/photos"
if not os.path.exists(PHOTOS_DIR):
    os.makedirs(PHOTOS_DIR)

# Initialisation de la caméra
try:
    camera = Picamera2()
    camera.configure(camera.create_still_configuration())
    camera.start()
    print("📸 Caméra initialisée")
except Exception as e:
    print(f"❌ Erreur initialisation caméra : {e}")
    camera = None

def prendre_photo_et_enregistrer(idinscription, dossard, idcourse):
    """Prend une photo, la sauvegarde et l'enregistre en base"""
    if camera is None:
        print("❌ Caméra non disponible")
        return None
    
    try:
        # Nom du fichier avec timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"dossard_{dossard}_course_{idcourse}_{timestamp}.jpg"
        filepath = os.path.join(PHOTOS_DIR, filename)
        
        # Capture de la photo
        camera.capture_file(filepath)
        print(f"📸 Photo sauvegardée localement : {filename}")
        
        # Enregistrer les infos de la photo en base
        try:
            heure_arrivee = datetime.now().isoformat()
            photo_data = {
                "idinscription": idinscription,
                "coderfid": filename,
                "heurearrive": heure_arrivee
            }
            
            response = requests.post(serveur_url_photo, json=photo_data)
            if response.status_code == 200:
                print(f"✅ Photo enregistrée en base pour l'inscription {idinscription}")
            else:
                print(f"⚠️ Erreur enregistrement photo en base : {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Erreur connexion pour enregistrement photo : {e}")
        
        return filepath
        
    except Exception as e:
        print(f"❌ Erreur capture photo : {e}")
        return None

print("📢 En attente d'une carte...")
print(f"📁 Photos sauvegardées dans : {PHOTOS_DIR}")

try:
    while True:
        uid, _ = reader.read_no_block()
        if uid:
            uid_hex = format(uid, 'X')
            print(f"🎫 Carte lue : {uid_hex}")

            try:
                # Envoi des données au serveur
                response = requests.post(serveur_url_temps, json={"uid": uid_hex})
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Arrivée enregistrée pour le dossard {data['dossard']} - Temps : {data['temps']} sec (Course ID: {data['idcourse']})")
                    
                    # Prendre une photo après l'enregistrement réussi
                    if 'idinscription' in data:
                        photo_path = prendre_photo_et_enregistrer(
                            data['idinscription'], 
                            data['dossard'], 
                            data['idcourse']
                        )
                        
                        if photo_path:
                            print(f"📸 Photo du dossard {data['dossard']} capturée et enregistrée avec succès")
                    
                    # Pause pour éviter les lectures multiples
                    time.sleep(3)
                    
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
    if camera:
        camera.stop()
        camera.close()
    GPIO.cleanup()
    print("🔧 Nettoyage terminé")
