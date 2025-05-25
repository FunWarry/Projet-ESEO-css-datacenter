#!/bin/bash
## install base system
## [JCG] creation d'un script system de base commun à toutes les VMS

IP=$(hostname -I | awk '{print $2}') 
VLAN=$( hostname -I | awk '{print $2}' | awk -F '.' '{print $3}')
DEFAULT=$(hostname -I | awk '{print $2}'| grep -Eo '^[0-9]{0,3}.[0-9]{0,3}.[0-9]{0,3}')

if [ "$VLAN" -ge 128 ] && [ "$VLAN" -le 131 ]; then
    MASK="/22"
    IP="$IP/22"
else
    if [ "$VLAN" -eq 132 ]; then
        IP="$IP/24"
    else
        IP="$IP/25"
    fi
fi

echo $IP
DEFAULT="${DEFAULT}.1"

ip addr flush dev enp0s8
ip addr add "$IP" dev enp0s8
ip route replace default via "$DEFAULT" dev enp0s8

cat <<EOF > /etc/resolv.conf 
search .
nameserver 192.168.238.10
EOF
