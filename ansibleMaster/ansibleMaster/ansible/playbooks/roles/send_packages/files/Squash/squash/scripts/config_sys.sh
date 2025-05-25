#!/bin/bash



sudo ip addr flush dev enp0s8
sudo ip addr add 192.168.232.7/23 dev enp0s8


sudo echo "search .                     
nameserver 192.168.238.10" > /etc/resolv.conf

