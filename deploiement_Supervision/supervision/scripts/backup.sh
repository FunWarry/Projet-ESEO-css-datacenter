#!/bin/bash

# Variables
BACKUP_DIR="/vagrant"
DB_NAME="zabbix"
DB_USER="zabbix"
DB_PASSWORD="password"

echo "?? Sauvegarde de la base de données Zabbix..."
mysqldump -u$DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/backup.sql

echo "?? Sauvegarde des fichiers de configuration Zabbix..."
tar -czvf $BACKUP_DIR/zabbix_configs.tar.gz /etc/zabbix /usr/share/zabbix

echo "? Sauvegarde terminée ! Tout est dans $BACKUP_DIR"
