#!/bin/bash

# Récupérer le nom de la machine
HOSTNAME=$(hostname)
IP=$(hostname -I | awk '{print $2}')
LOG_FILE="/vagrant/logs/install_galera.log"

# Installation
sudo apt-get update \
  > $LOG_FILE 2>&1
sudo apt-get install -y mariadb-server galera-4 \
  >> $LOG_FILE 2>&1


# Écrire la configuration Galera dans le fichier 60-galera.cnf
sudo tee /etc/mysql/mariadb.conf.d/60-galera.cnf > /dev/null <<EOF
[galera]
# Mandatory settings
wsrep_on = ON
wsrep_provider = /usr/lib/galera/libgalera_smm.so
wsrep_cluster_name = "Projet_CSS"
wsrep_node_name = "$HOSTNAME"
wsrep_node_address = "$IP"
wsrep_cluster_address = gcomm://192.168.234.3,192.168.234.4,192.168.234.5
binlog_format = row
default_storage_engine = InnoDB
innodb_autoinc_lock_mode = 2
innodb_force_primary_key = 1

# Allow server to accept connections on all interfaces.
bind-address = 0.0.0.0

# Optional settings
#wsrep_slave_threads = 1
#innodb_flush_log_at_trx_commit = 0
log_error = /var/log/mysql/error-galera.log
EOF


# Vérifier si le nom est "galeranode1"
if [[ "$HOSTNAME" == "galeranode1" ]]; then
    sudo systemctl stop mariadb 
    sudo galera_new_cluster 
else
    sudo systemctl restart mariadb 
fi

if [ "$HOSTNAME" == "galeranode3" ]; then

    # Commandes SQL pour créer les bases et les utilisateurs
    SQL_COMMANDS="
    CREATE DATABASE IF NOT EXISTS etudiant1;
    CREATE DATABASE IF NOT EXISTS etudiant2;
    CREATE USER IF NOT EXISTS 'etudiant1'@'%' IDENTIFIED BY 'network';
    CREATE USER IF NOT EXISTS 'etudiant2'@'%' IDENTIFIED BY 'network';
    GRANT ALL PRIVILEGES ON etudiant1.* TO 'etudiant1'@'%';
    GRANT ALL PRIVILEGES ON etudiant2.* TO 'etudiant2'@'%';
    FLUSH PRIVILEGES;
    "
   
    # Exécution des commandes SQL sur MySQL/MariaDB
    mysql -u root -p -e "$SQL_COMMANDS"
fi
