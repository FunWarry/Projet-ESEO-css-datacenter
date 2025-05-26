#!/bin/bash

read -p "Quelle est le nom de l'interface des serveurs Physique WEB, Supervision, Bdd, Sauvegarde, DNS ? " interface

sed -i "s/bridge: *\"[^\"]*\"/bridge: \"$interface\"/g" /vagrant/ansible/playbooks/roles/send_packages/files/*/*/Vagrantfile

read -p "Quelle est le nom de l'interface des serveurs Physique Firewall interne au réseau privé ? " interface

sed -i "s/bridge: *\"[^\"]*\"/bridge: \"$interface\"/g" /vagrant/ansible/playbooks/roles/send_packages/files/DHCP/dhcp/Vagrantfile
