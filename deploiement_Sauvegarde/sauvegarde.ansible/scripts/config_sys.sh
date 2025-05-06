#!/bin/bash

# Récupérer le nom de la machine
HOSTNAME=$(hostname)
LOG_FILE="/vagrant/logs/config_sys.log"

if [[ "$HOSTNAME" == "sauvegarde1" ]]; then
  ip addr flush dev enp0s8
  ip addr add 192.168.236.3/23 dev enp0s8

elif [[ "$HOSTNAME" == "proxy1" ]]; then
  ip addr flush dev enp0s8
  ip addr add 192.168.236.4/23 dev enp0s8

elif [[ "$HOSTNAME" == "relais" ]]; then
  sudo ip addr flush dev enp0s8
  sudo ip addr add 192.168.236.10/23 dev enp0s8

else
  ip addr flush dev enp0s8
  ip addr add 192.168.236.5/23 dev enp0s8
fi

sudo echo "search .                     
nameserver 192.168.238.10" > /etc/resolv.conf
