#!/bin/bash

FILE_PATH="$1"
REMOTE_NAME="mydrive"
FOLDER_ID="1rJHWo-NkxCcNcO2T4wIbf7JHbDk5wSRK"

if [ -z "$FILE_PATH" ]; then
  echo "Usage: $0 /chemin/vers/fichier"
  exit 1
fi

# Installer rclone si pas pr�sent
if ! command -v rclone &> /dev/null; then
  echo "Installation de rclone..."
  curl https://rclone.org/install.sh | sudo bash
fi

# V�rifier si config rclone existe
CONFIG_PATH="$HOME/.config/rclone/rclone.conf"
if [ ! -f "$CONFIG_PATH" ]; then
  echo "Configuration rclone non trouv�e. Veuillez lancer 'rclone config' manuellement pour autoriser l'acc�s � Google Drive."
  echo "Apr�s configuration, relancez ce script."
  exit 2
fi

# Upload du fichier
echo "Upload de $FILE_PATH vers Google Drive dossier $FOLDER_ID..."
rclone copy "$FILE_PATH" "$REMOTE_NAME:$FOLDER_ID"

if [ $? -eq 0 ]; then
  echo "Upload r�ussi !"
else
  echo "Erreur pendant l'upload."
fi
