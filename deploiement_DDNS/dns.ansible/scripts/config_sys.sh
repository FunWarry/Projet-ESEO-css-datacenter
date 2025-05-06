#!/bin/bash

# Récupérer le nom de la machine
HOSTNAME=$(hostname)
LOG_FILE="/vagrant/logs/config_sys.log"

if [["$HOSTNAME" == "srv-dns"]]; then
	sudo ip addr flush dev enp0s8
	sudo ip addr add 192.168.238.10/29 dev enp0s8

elif [["$HOSTNAME" == "dhcp"]]; then 
	sudo ip addr flush dev enp0s8
	sudo ip addr add 192.168.238.12/29 dev enp0s8
fi

sudo echo "search .                     
nameserver 192.168.238.10" > /etc/resolv.conf

