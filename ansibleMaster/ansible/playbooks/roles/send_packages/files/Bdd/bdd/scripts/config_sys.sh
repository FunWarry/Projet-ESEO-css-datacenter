
#!/bin/bash

# Récupérer le nom de la machine
HOSTNAME=$(hostname)
LOG_FILE="/vagrant/logs/config_sys.log"

if [[ "$HOSTNAME" == "galeranode1" ]]; then
  sudo ip addr flush dev enp0s8
  sudo ip addr add 192.168.234.3/23 dev enp0s8

elif [[ "$HOSTNAME" == "galeranode2" ]]; then
  sudo ip addr flush dev enp0s8
  sudo ip addr add 192.168.234.4/23 dev enp0s8

elif [[ "$HOSTNAME" == "galeranode3" ]]; then
  sudo ip addr flush dev enp0s8
  sudo ip addr add 192.168.234.5/23 dev enp0s8

elif [[ "$HOSTNAME" == "haproxynode1" ]]; then
  sudo ip addr flush dev enp0s8
  sudo ip addr add 192.168.234.6/23 dev enp0s8
  sudo ip addr flush dev enp0s9
  sudo ip addr add 192.168.234.8/23 dev enp0s9
elif [[ "$HOSTNAME" == "haproxynode2" ]]; then
  sudo ip addr flush dev enp0s8
  sudo ip addr add 192.168.234.7/23 dev enp0s8
  sudo ip addr flush dev enp0s9
  sudo ip addr add 192.168.234.9/23 dev enp0s9
elif [[ "$HOSTNAME" == "relais" ]]; then
  sudo ip addr flush dev enp0s8
  sudo ip addr add 192.168.234.11/23 dev enp0s8

fi



