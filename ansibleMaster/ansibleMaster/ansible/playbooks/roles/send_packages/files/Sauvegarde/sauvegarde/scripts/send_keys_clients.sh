#!/bin/bash

INVENTAIRE="$1"
[ -z "$INVENTAIRE" ] && INVENTAIRE="/vagrant/variables/inventory_clients.ini"

LOG_FILE="/vagrant/logs/send_keys_clients.log"
SSH_KEY="/home/backup/.ssh/id_rsa"
SSH_PUB_KEY="/home/backup/.ssh/id_rsa.pub"
PASSWORD="vagrant"
USER_INIT="vagrant"

mkdir -p /vagrant/logs
touch "$LOG_FILE"

if [ ! -f "$SSH_KEY" ]; then
    sudo -u backup ssh-keygen -t rsa -b 2048 -N "" -f "$SSH_KEY"
fi

PUBKEY_CONTENT=$(sudo cat "$SSH_PUB_KEY")

IPS=$(grep -Eo '([0-9]{1,3}\.){3}[0-9]{1,3}' "$INVENTAIRE")
for IP in $IPS; do
    echo "Configuration de $IP" | tee -a "$LOG_FILE"
    echo "IPs ciblées :"
    echo "$IPS"


    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER_INIT@$IP" bash -s <<EOF
sudo useradd -m -s /bin/bash backup 2>/dev/null || true
sudo mkdir -p /home/backup/.ssh
echo '$PUBKEY_CONTENT' | sudo tee /home/backup/.ssh/authorized_keys > /dev/null
sudo chmod 700 /home/backup/.ssh
sudo chmod 600 /home/backup/.ssh/authorized_keys
sudo chown -R backup:backup /home/backup/.ssh
echo 'backup ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/backup > /dev/null
sudo chmod 440 /etc/sudoers.d/backup
EOF
done

