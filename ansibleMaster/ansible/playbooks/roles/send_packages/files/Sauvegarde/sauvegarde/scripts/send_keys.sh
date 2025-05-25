#!/bin/bash

LOG_FILE="/vagrant/logs/config_send_keys.log"
SSH_KEY="/home/backup1/.ssh/id_rsa"
SSH_PUB_KEY="/home/backup1/.ssh/id_rsa.pub"
PASSWORD="changeme"  # pour info, non utilisé ici

# Génération de la clé SSH si elle n'existe pas
if [ ! -f "$SSH_KEY" ]; then
    sudo -u backup1 ssh-keygen -t rsa -b 2048 -N "" -f "$SSH_KEY" >> "$LOG_FILE" 2>&1
fi

sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "repository@192.168.236.4" \
        "mkdir -p /home/repository/.ssh && chmod 700 /home/repository/.ssh && echo '$(cat $SSH_PUB_KEY)' >> /home/repository/.ssh/authorized_keys && chmod 600 /home/repository/.ssh/authorized_keys" >> "$LOG_FILE" 2>&1

# Extraction des IPs (en ignorant les sections et les commentaires)
IPS=$(grep -vE '^\[|^#|^$|=' /vagrant/variables/inventory_clients.ini)

# Envoi de la clé à chaque IP avec ssh
for IP in $IPS; do
    USER="agent"
    
    sshpass -p "vagrant" ssh -o StrictHostKeyChecking=no "vagrant@$IP" \
        "sudo useradd -m -d /home/agent -s /bin/bash agent && echo 'agent:changeme' | sudo chpasswd && echo 'agent ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/agent > /dev/null && sudo chmod 440 /etc/sudoers.d/agent" >> "$LOG_FILE" 2>&1


    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "agent@$IP" \
        "mkdir -p /home/agent/.ssh && chmod 700 /home/agent/.ssh && touch /home/agent/.ssh/authorized_keys && sed -i '/backup1/d' /home/agent/.ssh/authorized_keys && echo "$(cat $SSH_PUB_KEY)" >> /home/agent/.ssh/authorized_keys && chmod 600 /home/agent/.ssh/authorized_keys && sudo apt install borgbackup -y" >> "$LOG_FILE" 2>&1
done

echo "Cles SSH copiees avec succes sur toutes les machines."
