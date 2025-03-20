import RPi.GPIO as GPIO
from mfrc522 import SimpleMFRC522

reader = SimpleMFRC522()

print("📡 Place une carte RFID sur le lecteur...")

try:
    while True:
        id, text = reader.read()
        print(f"🎫 Carte détectée ! UID : {id}")
except KeyboardInterrupt:
    print("\n🔴 Arrêt du programme")
finally:
    GPIO.cleanup()
