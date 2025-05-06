#!/bin/bash
# Script de sauvegarde simplifié

BORG_REPO="backupuser@192.168.236.3:/home/backupuser/borg_repo"
CSV_FILE="$1"
DATE=$(date +%F-%H%M)
TMP_DIR="/tmp/backup_$DATE"

mkdir -p "$TMP_DIR"

# Vérif fichier CSV
if [[ -z "$CSV_FILE" || ! -f "$CSV_FILE" ]]; then
    echo "Fichier CSV manquant ou invalide."
    exit 1
fi

while IFS=',' read -r MACHINE_NAME MACHINE_IP; do
    [[ -z "$MACHINE_NAME" || -z "$MACHINE_IP" ]] && continue

    BACKUP_NAME="${MACHINE_NAME}_$DATE"
    VBoxManage export "$MACHINE_NAME" -o "$TMP_DIR/${MACHINE_NAME}.ova" && \
        echo "Sauvegarde OK : $MACHINE_NAME" || \
        echo "Erreur OVA : $MACHINE_NAME"

    borg create --stats "$BORG_REPO::$BACKUP_NAME" "$TMP_DIR" && \
        echo "Sauvegarde OK : $MACHINE_NAME" || \
        echo "Erreur Borg : $MACHINE_NAME"

    echo "Sauvegarde OK : $MACHINE_NAME"

    rm -rf "$TMP_DIR"
    mkdir -p "$TMP_DIR"

done < "$CSV_FILE"

rm -rf "$TMP_DIR"
