
#!/bin/bash

# Récupérer le nom de la machine
HOSTNAME=$(hostname)
LOG_FILE="/vagrant/logs/config_sys.log"

if [[ "$HOSTNAME" == "galeranode1" ]]; then
  ip addr flush dev enp0s8
  ip addr add 192.168.238.3/23 dev enp0s8

fi

sudo echo "search .                     
nameserver 192.168.238.10" > /etc/resolv.conf

# Redémarrer Apache2
echo "=> Redémarrage d'Apache2..."
sudo systemctl restart apache2 \
  >> $LOG_FILE 2>&1

