#!/bin/bash

LOG_FILE="/vagrant/logs/config_agent.log"

# Créer l'utilisateur 'agent' avec /home/agent comme home s'il n'existe pas
if ! id "agent" &>/dev/null; then
    sudo useradd -m -d /home/agent -s /bin/bash agent >> $LOG_FILE 2>&1
    echo "agent:changeme" | sudo chpasswd >> $LOG_FILE 2>&1
fi

# Créer le fichier sudoers pour l'utilisateur 'agent'
echo "agent ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/agent > /dev/null
sudo chmod 440 /etc/sudoers.d/agent
