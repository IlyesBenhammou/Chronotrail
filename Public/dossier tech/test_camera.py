#!/usr/bin/env python3

import time
import os
from datetime import datetime

try:
    from picamera2 import Picamera2
    print("✅ Module picamera2 importé avec succès")
except ImportError as e:
    print(f"❌ Erreur import picamera2 : {e}")
    print("💡 Exécutez : sudo apt install python3-picamera2")
    exit(1)

# Test de la caméra
def test_camera():
    print("📸 Test de la caméra...")
    
    try:
        # Initialisation
        camera = Picamera2()
        camera.configure(camera.create_still_configuration())
        camera.start()
        print("✅ Caméra initialisée")
        
        # Attendre la stabilisation
        time.sleep(2)
        
        # Créer le dossier de test
        test_dir = "/home/pi/chronotrail-capture/test_photos"
        if not os.path.exists(test_dir):
            os.makedirs(test_dir)
        
        # Prendre une photo de test
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"test_photo_{timestamp}.jpg"
        filepath = os.path.join(test_dir, filename)
        
        camera.capture_file(filepath)
        print(f"📸 Photo de test sauvegardée : {filepath}")
        
        # Vérifier la taille du fichier
        if os.path.exists(filepath):
            size = os.path.getsize(filepath)
            print(f"📊 Taille du fichier : {size} bytes")
            if size > 10000:  # Plus de 10KB, probablement OK
                print("✅ Test réussi ! La caméra fonctionne correctement")
            else:
                print("⚠️ Fichier très petit, vérifiez la connexion de la caméra")
        
        # Nettoyage
        camera.stop()
        camera.close()
        
    except Exception as e:
        print(f"❌ Erreur lors du test : {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🔧 Test de la configuration caméra pour ChronoTrail")
    print("=" * 50)
    
    # Test de la caméra
    if test_camera():
        print("\n✅ Tous les tests sont passés !")
        print("🚀 Votre système est prêt pour ChronoTrail avec capture photo")
    else:
        print("\n❌ Des problèmes ont été détectés")
        print("💡 Vérifiez :")
        print("   - La connexion physique de la caméra")
        print("   - L'activation dans raspi-config")
        print("   - Les permissions du dossier")