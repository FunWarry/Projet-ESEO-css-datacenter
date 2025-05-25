#!/bin/bash

set -e  # Stopper en cas d'erreur

# Déterminer le dossier du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Créer les dossiers cibles
mkdir -p /home/backup/playbooks
mkdir -p /home/backup/backup_scripts
mkdir -p /home/backup/variables

# Copier trigger_backup.yml vers /home/backup/playbooks
cp "$SCRIPT_DIR/trigger_backup.yml" /home/backup/playbooks/trigger_backup.yml

# Copier les scripts de sauvegarde vers /home/backup/backup_scripts
cp "$SCRIPT_DIR/backup_files.sh" /home/backup/backup_scripts/backup_files.sh
cp "$SCRIPT_DIR/backup_db.sh" /home/backup/backup_scripts/backup_db.sh

# Copier inventory_clients.ini depuis ../variables
cp "$SCRIPT_DIR/../variables/inventory_clients.ini" /home/backup/variables/inventory_clients.ini

# Appliquer les droits
chown -R backup:backup /home/backup/playbooks /home/backup/backup_scripts /home/backup/variables
chmod +x /home/backup/backup_scripts/*.sh

echo "Déploiement terminé."

