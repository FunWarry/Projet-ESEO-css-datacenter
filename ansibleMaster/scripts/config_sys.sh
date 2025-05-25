#!/bin/bash
USER="ansible"
PASSWORD="N3twork!"
HOME_DIR="/home/$USER"
LOG_FILE="/vagrant/logs/config_sys.log"

# MAJ & paquets de base
apt-get update -y >> "$LOG_FILE" 2>&1
apt-get install -y wget curl unzip sshpass ansible >> "$LOG_FILE" 2>&1

# Création de l’utilisateur
if ! id "$USER" &>/dev/null; then
  useradd -m -s /bin/bash "$USER"
  echo "$USER:$PASSWORD" | chpasswd
  usermod -aG sudo "$USER"
  echo "ansible ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ansible
fi

# Préparation SSH
mkdir -p "$HOME_DIR/.ssh"
touch "$HOME_DIR/.ssh/authorized_keys"
chmod 700 "$HOME_DIR/.ssh"
chmod 600 "$HOME_DIR/.ssh/authorized_keys"
chown -R "$USER:$USER" "$HOME_DIR/.ssh"

#Ajouts de l'alias
sudo -u ansible bash -c "grep -qxF \"alias master='bash /vagrant/scripts/master.sh'\" ~/.bashrc || echo \"alias master='bash /vagrant/scripts/master.sh'\" >> ~/.bashrc && source ~/.bashrc"
