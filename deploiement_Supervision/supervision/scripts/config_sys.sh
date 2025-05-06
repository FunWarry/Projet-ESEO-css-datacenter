
#!/bin/bash

# Récupérer le nom de la machine
HOSTNAME=$(hostname)
LOG_FILE="/vagrant/logs/config_sys.log"

if [[ "$HOSTNAME" == "relais" ]]; then
  sudo ip addr flush dev enp0s8
  sudo ip addr add 192.168.238.4/29 dev enp0s8
else
  sudo ip addr flush dev enp0s8
  sudo ip addr add 192.168.238.3/29 dev enp0s8
fi
sudo echo "search .                     
nameserver 192.168.238.10" > /etc/resolv.conf

