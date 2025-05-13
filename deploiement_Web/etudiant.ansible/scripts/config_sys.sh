#!/bin/bash

# Récupérer le nom de la machine
HOSTNAME=$(hostname)
LOG_FILE="/vagrant/logs/config_sys.log"

if [[ "$HOSTNAME" == "etudiant1" ]]; then
  sudo ip addr flush dev enp0s8
  sudo ip addr add 192.168.232.3/23 dev enp0s8

elif [[ "$HOSTNAME" == "etudiant2" ]]; then
  sudo ip addr flush dev enp0s8
  sudo ip addr add 192.168.232.4/23 dev enp0s8
  
elif [[ "$HOSTNAME" == "relais" ]]; then
  sudo ip addr flush dev enp0s8
  sudo ip addr add 192.168.232.5/23 dev enp0s8
fi

sudo echo "search .                     
nameserver 192.168.238.10" > /etc/resolv.conf

