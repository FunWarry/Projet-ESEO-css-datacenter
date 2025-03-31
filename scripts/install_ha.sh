#!/bin/bash

# Récupérer le nom de la machine
HOSTNAME=$(hostname)
IP=$(hostname -I | awk '{print $2}')
LOG_FILE="/vagrant/logs/install_galera.log"

# Installation
sudo apt-get update \
  > $LOG_FILE 2>&1
sudo apt-get install -y haproxy\
  >> $LOG_FILE 2>&1

cp /vagrant/files/haproxy.cfg /etc/haproxy/haproxy.cfg

systemctl restart haproxy
