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

# Créer un utilisateur système pour le FTP
FTP_USER="ftpuser"
FTP_PASSWORD="ftppassword"
FTP_HOME="/home/$FTP_USER"

# Créer l'utilisateur et son répertoire personnel
echo "Création de l'utilisateur FTP..."
useradd -m -d "$FTP_HOME" -s /usr/sbin/nologin "$FTP_USER"
echo -e "$FTP_PASSWORD\n$FTP_PASSWORD" | passwd "$FTP_USER"

