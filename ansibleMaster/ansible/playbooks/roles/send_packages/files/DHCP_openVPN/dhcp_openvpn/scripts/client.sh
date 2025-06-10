#!/bin/bash

cd /root/openvpn-ca

sudo EASYRSA_BATCH=1 ./easyrsa gen-req client nopass
sudo EASYRSA_BATCH=1 ./easyrsa sign-req client client

IP=$(hostname -I | awk '{print $1}')

sudo bash -c "cat > /root/client.ovpn <<EOF
client
dev tun
proto udp
remote $IP 1194
resolv-retry infinite
nobind

persist-key
persist-tun

data-ciphers AES-256-CBC
data-ciphers-fallback AES-256-CBC
cipher AES-256-CBC
verb 3

<ca>
\$(cat /root/openvpn-ca/pki/ca.crt)
</ca>

<cert>
\$(cat /root/openvpn-ca/pki/issued/client.crt)
</cert>

<key>
\$(cat /root/openvpn-ca/pki/private/client.key)
</key>

<tls-auth>
\$(cat /root/openvpn-ca/pki/ta.key)
</tls-auth>
key-direction 1
EOF"

sudo sshpass -p "N3twork!" scp -o StrictHostKeyChecking=no /root/client.ovpn etudis@192.168.232.2:/home/etudis/Bureau/Web/web/files/client.ovpn
