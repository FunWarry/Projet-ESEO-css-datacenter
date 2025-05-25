#!/bin/bash

INVENTAIRE="/vagrant/ansible/variables/inventory.ini"
SSH_KEY="/home/ansible/.ssh/id_rsa"
SSH_PUB_KEY="${SSH_KEY}.pub"
USER="etudis"
LOG_FILE="/vagrant/logs/send_keys.log"
PASSWORD="N3twork!"  # pour info, non utilisÃ© ici

if [ ! -f "$SSH_KEY" ]; then
    sudo -u ansible ssh-keygen -t rsa -b 2048 -N "" -f "$SSH_KEY" >> "$LOG_FILE" 2>&1
fi

# Extraction des IPs (en ignorant les sections et les commentaires)
IPS=$(grep -vE '^\[|^#|^$|=' "$INVENTAIRE")

# Envoi de la clÃ© Ã  chaque IP avec ssh
for IP in $IPS; do
    echo "Envoi de la cle a $USER@$IP"
    
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$IP" \
        "mkdir -p /home/etudis/.ssh && chmod 700 /home/etudis/.ssh && sed -i '/ansibleMaster/d' /home/etudis/.ssh/authorized_keys  && echo '$(cat $SSH_PUB_KEY)' >> /home/etudis/.ssh/authorized_keys && chmod 600 /home/etudis/.ssh/authorized_keys" >> "$LOG_FILE" 2>&1
done

echo "cle envoyées"
