#!/bin/bash
# Sauvegarde MySQL/MariaDB simplifiée

BORG_REPO="proxy@192.168.236.4:/home/backup/borg_repo"
DATE=$(date +%F-%H%M)
MYSQL_USER="root"
MYSQL_PASSWORD="network"
CSV_FILE="$1"

[[ -z "$CSV_FILE" || ! -f "$CSV_FILE" ]] && {
    echo "Fichier CSV manquant ou invalide."
    exit 1
}

export BORG_RSH="ssh -o StrictHostKeyChecking=no"

tail -n +2 "$CSV_FILE" | while IFS=',' read -r MACHINE_NAME MACHINE_IP ROLE; do
    [[ -z "$MACHINE_NAME" || -z "$MACHINE_IP" ]] && continue

    TMP_DIR=$(mktemp -d)
    DUMP_FILE="${TMP_DIR}/${MACHINE_NAME}_mysql_${DATE}.sql"
    BACKUP_NAME="${MACHINE_NAME}-mysql-${DATE}"

    mysqldump -h "$MACHINE_IP" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" --all-databases > "$DUMP_FILE"  && \
        echo "Dump OK : $MACHINE_NAME" || \
        echo "Erreur Dump : $MACHINE_NAME"

    borg create --stats "$BORG_REPO::$BACKUP_NAME" "$TMP_DIR" && \
        echo "Sauvegarde OK : $MACHINE_NAME" || \
        echo "Erreur Borg : $MACHINE_NAME"

    rm -rf "$TMP_DIR"

done

