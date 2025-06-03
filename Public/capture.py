import RPi.GPIO as GPIO
import time
import requests
import subprocess
from mfrc522 import SimpleMFRC522
from datetime import datetime
import os
try:
    from picamera import PiCamera
except ImportError:
    print("Module 'picamera' non trouvé. Assurez-vous de l'installer ou adaptez vers picamera2.")

GPIO.setwarnings(False)

reader = SimpleMFRC522()

serveur_url_temps = "http://172.30.232.10:4000/api/temps-course"

local_dir = "/home/projet-raspberry2/photo_capture"
os.makedirs(local_dir, exist_ok=True)

try:
    camera = PiCamera()
    camera.resolution = (1280, 720)
except Exception as e:
    print(f"Erreur initialisation caméra : {e}")
    camera = None

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

                    if camera:
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        photo_filename = f"photo_{data['dossard']}_{timestamp}.jpg"
                        local_path = os.path.join(local_dir, photo_filename)
                        remote_path = f"/home/projet-chrono/capture_photo/public/photo_capture/{photo_filename}"

                        camera.capture(local_path)
                        print(f"📷 Photo capturée : {local_path}")

                        scp_cmd = ["scp", local_path, f"projet-chrono@172.30.232.10:{remote_path}"]
                        try:
                            subprocess.run(scp_cmd, check=True)
                            print(f"✅ Photo envoyée à {remote_path}")
                        except subprocess.CalledProcessError as e:
                            print(f"❌ Échec envoi SCP : {e}")

                        update_photo_url = "http://172.30.232.10:4000/api/temps-course/ajout-photo"
                        try:
                            resp = requests.post(update_photo_url, json={
                                "idinscription": data["idinscription"],
                                "photo": photo_filename
                            })
                            if resp.status_code == 200:
                                print("✅ Photo enregistrée en base")
                            else:
                                print(f"⚠️ Erreur base photo: {resp.status_code} {resp.text}")
                        except Exception as e:
                            print(f"❌ Erreur requête ajout photo : {e}")
                    else:
                        print("⚠️ Pas de caméra disponible, photo non prise.")
                else:
                    print(f"⚠️ Erreur serveur : {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"❌ Erreur réseau : {e}")

        time.sleep(1)

except KeyboardInterrupt:
    print("\n🛑 Programme arrêté.")

finally:
    if camera:
        camera.close()
    GPIO.cleanup()
