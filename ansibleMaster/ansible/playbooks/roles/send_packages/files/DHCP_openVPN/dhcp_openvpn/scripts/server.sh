#!/bin/bash

# Mise à jour du système
sudo apt update -y

# Installation d'OpenVPN et Easy-RSA
sudo apt install -y openvpn easy-rsa sshpass

# Création du dossier Easy-RSA
sudo make-cadir /root/openvpn-ca
cd /root/openvpn-ca

# Configuration des paramètres CA
sudo bash -c "cat > vars <<EOF
set_var EASYRSA_REQ_COUNTRY    \"FR\"
set_var EASYRSA_REQ_PROVINCE   \"Pays de la Loire\"
set_var EASYRSA_REQ_CITY       \"Angers\"
set_var EASYRSA_REQ_ORG        \"ESEO\"
set_var EASYRSA_REQ_EMAIL      \"projet-cloud@computing.fr\"
set_var EASYRSA_REQ_OU         \"My Organizational Unit\"
EOF"

# Initialisation du PKI et génération des certificats/cles
sudo ./easyrsa init-pki
sudo EASYRSA_BATCH=1 ./easyrsa build-ca nopass
sudo EASYRSA_BATCH=1 ./easyrsa gen-req server nopass
sudo EASYRSA_BATCH=1 ./easyrsa sign-req server server
sudo ./easyrsa gen-dh
sudo openvpn --genkey --secret pki/ta.key

# Création du dossier de configuration OpenVPN
sudo mkdir -p /etc/openvpn/server

# Copie des certificats/cles vers le dossier OpenVPN
sudo cp pki/ca.crt /etc/openvpn/server/
sudo cp pki/dh.pem /etc/openvpn/server/
sudo cp pki/ta.key /etc/openvpn/server/
sudo cp pki/issued/server.crt /etc/openvpn/server/
sudo cp pki/private/server.key /etc/openvpn/server/

# Copie du fichier de configuration serveur
sudo cp /vagrant/files/server.conf /etc/openvpn/server/

# Activation du forwarding IP
sudo sed -i 's/^#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf
sudo sysctl -p

# Activation et démarrage du service OpenVPN
sudo systemctl enable openvpn-server@server
sudo systemctl start openvpn-server@server
