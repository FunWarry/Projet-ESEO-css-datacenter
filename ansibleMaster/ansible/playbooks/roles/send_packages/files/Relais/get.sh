#!/bin/bash

# Extraire l'IP de eno1
ip=$(ip -o -4 addr show dev eno1 | awk '{print $4}' | cut -d/ -f1)

# Extraire du masque de eno1
masque=$(ip -o -4 addr show dev eno1 | awk '{print $4}' | cut -d/ -f2)

# Extraire la route par défaut via eno1
default_route=$(ip route | grep "^default" | grep "dev eno1" | awk '{print $3}')

if [[ "$ip" == "192.168.232.2" ]]; then
  ip="192.168.232.5"
elif [[ "$ip" == "192.168.234.2" ]]; then
  ip="192.168.234.11"
elif [[ "$ip" == "192.168.236.2" ]]; then
  ip="192.168.236.11"
elif [[ "$ip" == "192.168.238.2" ]]; then
  ip="192.168.238.5"
elif [[ "$ip" == "192.168.238.11" ]]; then
  ip="192.168.238.12"
fi

sed -i "s/IP_CO/"$ip"/g" /home/etudis/Bureau/Relais/relais/Vagrantfile
sed -i "s/MASQUE/"$masque"/g" /home/etudis/Bureau/Relais/relais/Vagrantfile
sed -i "s/PASSERELLE/"$default_route"/g" /home/etudis/Bureau/Relais/relais/Vagrantfile
