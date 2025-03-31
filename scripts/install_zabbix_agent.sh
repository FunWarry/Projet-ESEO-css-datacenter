#!/bin/bash

# Mise à jour des paquets existants
echo "Mise à jour des paquets existants..."
sudo apt update && sudo apt upgrade -y

# Installation des dépendances pour Zabbix et autres services (Apache, PHP, MariaDB, etc.)
echo "Installation des paquets nécessaires..."
sudo apt install -y wget pkg-config gzip apache2 php libapache2-mod-php php-mysql

# a. Installation du dépôt Zabbix
echo "Téléchargement et installation du dépôt Zabbix..."
wget https://repo.zabbix.com/zabbix/7.0/debian/pool/main/z/zabbix-release/zabbix-release_latest_7.0+debian12_all.deb -O /tmp/zabbix-release_latest.deb
sudo dpkg -i /tmp/zabbix-release_latest.deb
sudo apt update

# b. Installation de l'agent Zabbix
echo "Installation de l'agent Zabbix..."
sudo apt install zabbix-agent -y

# c. Démarrer et activer le service Zabbix
echo "Démarrage et activation du service Zabbix agent..."
sudo systemctl restart zabbix-agent
sudo systemctl enable zabbix-agent

# Vérification de l'état du service
echo "Vérification de l'état du service Zabbix agent..."
sudo systemctl status zabbix-agent

# Configuration du fichier zabbix_agentd.conf
echo "Configuration du fichier zabbix_agentd.conf..."
#CURRENT_HOSTNAME=$(hostname)

# Vérification de l'existence du fichier de configuration avant de tenter des modifications
if [ -f /etc/zabbix/zabbix_agentd.conf ]; then

    echo "Le fichier zabbix_agentd.conf existe, modification des paramètres..."
    # Remplacement de certains paramètres dans le fichier de configuration
    sudo sed -i 's/^Server=127.0.0.1/Server=192.168.238.3/' /etc/zabbix/zabbix_agentd.conf
    sudo sed -i 's/^# ListenIP=0.0.0.0/ListenIP=0.0.0.0/' /etc/zabbix/zabbix_agentd.conf
    sudo sed -i 's/^ServerActive=127.0.0.1/ServerActive=192.168.238.3/' /etc/zabbix/zabbix_agentd.conf
    #sudo sed -i 's/^Hostname=Zabbix server/Hostname=${CURRENT_HOSTNAME}/' /etc/zabbix/zabbix_agentd.conf
    
    # Vérification des changements dans le fichier
    echo "Affichage des premières lignes du fichier modifié :"
    head -n 10 /etc/zabbix/zabbix_agentd.conf
else
    echo "Le fichier /etc/zabbix/zabbix_agentd.conf n'existe pas."
fi

# Redémarrage de l'agent Zabbix pour prendre en compte les nouvelles configurations
echo "Redémarrage de l'agent Zabbix..."
sudo systemctl restart zabbix-agent

# Vérification finale du statut
echo "Vérification finale de l'état du service Zabbix agent..."
sudo systemctl status zabbix-agent
