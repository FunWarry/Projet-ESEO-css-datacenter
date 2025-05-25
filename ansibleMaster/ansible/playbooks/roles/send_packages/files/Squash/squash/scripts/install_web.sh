#!/bin/bash

## install web server with php


IP=$(hostname -I | awk '{print $2}')

APT_OPT="-o Dpkg::Progress-Fancy="0" -q -y"
LOG_FILE="/vagrant/logs/install_web.log"
DEBIAN_FRONTEND="noninteractive"

echo "START - install web Server - "$IP

echo "=> [1]: Installing required packages..."
apt-get install $APT_OPT \
  apache2 \
  php \
  libapache2-mod-php \
  php-mysql \
  php-intl \
  php-curl \
  php-xmlrpc \
  php-soap \
  php-gd \
  php-json \
  php-cli \
  php-pear \
  php-xsl \
  php-zip \
  php-mbstring \
  > $LOG_FILE 2>&1


echo "=> [2]: Apache2 configuration"
# Add configuration of /etc/apache2

# Ajout de deux ports d'écoute : le 223 et le 228
# Le port 223 pour le frontend
# Le port 228 pour le myadmin

cat <<EOF > /etc/apache2/ports.conf
Listen 80
Listen 228

<IfModule ssl_module>
        Listen 443
</IfModule>

<IfModule mod_gnutls.c>
        Listen 443
</IfModule>

# vim: syntax=apache ts=4 sw=4 sts=4 sr noet
EOF

# File creation myadmin.conf
# Fichier de configuration pour le phpmyadmin
touch /etc/apache2/sites-available/myadmin.conf
cat <<EOF > /etc/apache2/sites-available/myadmin.conf
<VirtualHost *:228>
    DocumentRoot /var/www/html/myadmin
    ServerName myadmin.local

    ErrorLog ${APACHE_LOG_DIR}/myadmin.log
    CustomLog ${APACHE_LOG_DIR}/myadmin_access.log combined
</VirtualHost> 
EOF


# Activation des sites
a2ensite myadmin.conf \
  >> $LOG_FILE 2>&1

echo "Phpmyadmin prêt et accessible sur l'ip publique et le port 228"

systemctl restart apache2 \
  >> $LOG_FILE 2>&1

echo "END - install web Server"
