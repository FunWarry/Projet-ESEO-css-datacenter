#!/bin/bash


APT_OPT="-o Dpkg::Progress-Fancy="0" -q -y"
LOG_FILE="/vagrant/logs/install_web.log"

sudo apt-get update $APT_OPT \
  > $LOG_FILE 2>&1
sudo apt-get install -y bind9 \
  dnsutils \
  >> $LOG_FILE 2>&1

cd /etc/bind || exit
sudo cp named.conf.options named.conf.options.bkp
sudo cp named.conf.local named.conf.local.bkp

# Configuration automatique de named.conf.options
cat > /etc/bind/named.conf.options <<EOL
acl "lan" {
        192.168.239.248/29;  #vlan10
        192.168.232.0/23; #vlan20
        192.168.234.0/23; #vlan30
        192.168.236.0/23; #vlan40
        192.168.238.0/29; #vlan50
        192.168.238.8/29; #vlan60
        localhost;
};

options {
    directory "/var/cache/bind";

  forwarders {
        192.168.4.2;
    };

    dnssec-validation no;

    listen-on { any; };
    allow-query { lan; };

};
EOL

# Vérification de la configuration de BIND
named-checkconf \
  >> $LOG_FILE 2>&1

# Configuration  de named.conf.local
cat > /etc/bind/named.conf.local <<EOL
zone "dns.local" {
    type master;
    file "/etc/bind/db.dns.local";
    allow-update { none; };
};

zone "238.168.192.in-addr.arpa" {
    type master;
    file "/etc/bind/db.reverse.dns.local";
    allow-update { none; };

};
EOL

# Création et modification du fichier de zone (db.dns.local)
cat > /etc/bind/db.dns.local <<EOL
\$TTL    604800
@       IN      SOA     srv-dns.dns.local. admin.dns.local. (
                              2         ; Serial
                         604800         ; Refresh
                          86400         ; Retry
                        2419200         ; Expire
                         604800 )       ; Negative Cache TTL
;
@               IN      NS      srv-dns.dns.local.
srv-dns         IN      A       192.168.238.10
EOL

# configuration de la zone inverse
sudo cp /etc/bind/db.dns.local /etc/bind/db.reverse.dns.local

cat > /etc/bind/db.reverse.dns.local <<EOL
\$TTL    604800
@       IN      SOA     srv-dns.dns.local. admin.dns.local. (
                              2         ; Serial
                         604800         ; Refresh
                          86400         ; Retry
                        2419200         ; Expire
                         604800 )       ; Negative Cache TTL
;
@               IN      NS      srv-dns.dns.local.
10              IN      PTR     srv-dns.dns.local.
EOL


# Création et modification du fichier de zone (db.dns.local)
cat > /etc/default/named <<EOL
# run resolvconf?
RESOLVCONF=no

# startup options for the server
OPTIONS="-4 -u bind"
EOL

# Vérification de la zone DNS
named-checkzone dns.local /etc/bind/db.dns.local

# Démarrage et activation de BIND9
echo "Démarrage et activation de BIND9..."
sudo systemctl start bind9 \
  >> $LOG_FILE 2>&1

sudo systemctl enable named.service \
  >> $LOG_FILE 2>&1

sleep 5

sudo systemctl restart bind9 \
  >> $LOG_FILE 2>&1


