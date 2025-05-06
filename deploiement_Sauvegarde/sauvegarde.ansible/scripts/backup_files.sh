#!/bin/bash
# Sauvegarde fichiers/config simplifiée

BORG_REPO="proxy@192.168.236.4:/home/backup/borg_repo"
DATE=$(date +%F-%H%M)
CSV_FILE="$1"
INCLUDES="/etc /var/www"

[[ -z "$CSV_FILE" || ! -f "$CSV_FILE" ]] && {
    echo "Fichier CSV manquant ou invalide."
    exit 1
}

export BORG_RSH="ssh -o StrictHostKeyChecking=no"

tail -n +2 "$CSV_FILE" | while IFS=',' read -r MACHINE_NAME MACHINE_IP ROLE; do
    [[ -z "$MACHINE_NAME" || -z "$MACHINE_IP" ]] && continue

    BACKUP_NAME="${MACHINE_NAME}-files-${DATE}"

    borg create --stats "$BORG_REPO::$BACKUP_NAME" $INCLUDES && \
        echo "Sauvegarde OK : $MACHINE_NAME" || \
        echo "Erreur Borg : $MACHINE_NAME"

done

