#!/bin/bash

FILE_PATH="$1"
REMOTE_NAME="mydrive"
FOLDER_ID="1rJHWo-NkxCcNcO2T4wIbf7JHbDk5wSRK"

if [ -z "$FILE_PATH" ]; then
  echo "Usage: $0 /chemin/vers/fichier"
  exit 1
fi

# Installer rclone si pas présent
if ! command -v rclone &> /dev/null; then
  echo "Installation de rclone..."
  curl https://rclone.org/install.sh | sudo bash
fi

# Vérifier si config rclone existe
CONFIG_PATH="$HOME/.config/rclone/rclone.conf"
if [ ! -f "$CONFIG_PATH" ]; then
  echo "Configuration rclone non trouvée. Veuillez lancer 'rclone config' manuellement pour autoriser l'accès à Google Drive."
  echo "Après configuration, relancez ce script."
  exit 2
fi

# Upload du fichier
echo "Upload de $FILE_PATH vers Google Drive dossier $FOLDER_ID..."
rclone copy "$FILE_PATH" "$REMOTE_NAME:$FOLDER_ID"

if [ $? -eq 0 ]; then
  echo "Upload réussi !"
else
  echo "Erreur pendant l'upload."
fi
