# Script Pour l'installation du serveur FTP

#!/bin/bash

# Vérifier les privilèges root
if [ "$EUID" -ne 0 ]; then
  echo "Veuillez exécuter ce script en tant que root."
  exit 1
fi

# Mettre à jour les dépôts
echo "Mise à jour des dépôts..."
apt update -y

# Installer Pure-FTPd
echo "Installation de Pure-FTPd..."
apt install -y pure-ftpd