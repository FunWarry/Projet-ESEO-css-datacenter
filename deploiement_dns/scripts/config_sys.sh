
#!/bin/bash

# Récupérer le nom de la machine
HOSTNAME=$(hostname)
LOG_FILE="/vagrant/logs/config_sys.log"

sudo ip addr flush dev enp0s8
sudo ip addr add 192.168.238.10/29 dev enp0s8

sudo echo "search .                     
nameserver 192.168.238.10" > /etc/resolv.conf

