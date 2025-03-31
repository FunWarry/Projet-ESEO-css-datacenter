#!/bin/bash

# Récupérer le nom de la machine
APT_OPT="-o Dpkg::Progress-Fancy="0" -q -y"
HOSTNAME=$(hostname)
LOG_FILE="/vagrant/logs/install_web.log"
MYADMIN_VERSION="5.2.1"
SITE_CONF="/etc/apache2/sites-available/000-default.conf"
WWW_REP="/var/www/html"

# Installer Apache2
echo "=> Installation d'Apache2..."
sudo apt update $APT_OPT \
  > $LOG_FILE 2>&1

sudo apt install $APT_OPT \
 apache2 \
  mariadb-client \
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
  openssl \
  php-mbstring \
  php-zip \
  php-gd \
  php-xml \
  php-pear \
  php-cgi \
  >> $LOG_FILE 2>&1

if [[ "$HOSTNAME" == "etudiant1" ]]; then

  wget -q -O /tmp/myadmin.zip \
  https://files.phpmyadmin.net/phpMyAdmin/${MYADMIN_VERSION}/phpMyAdmin-${MYADMIN_VERSION}-all-languages.zip \
  >> $LOG_FILE 2>&1

  unzip /tmp/myadmin.zip -d ${WWW_REP} \
  >> $LOG_FILE 2>&1
  rm /tmp/myadmin.zip

  echo "[3] - Configuration files for phpmyadmin  "
  ln -s ${WWW_REP}/phpMyAdmin-${MYADMIN_VERSION}-all-languages ${WWW_REP}/myadmin
  mkdir ${WWW_REP}/myadmin/tmp
  chown www-data:www-data ${WWW_REP}/myadmin/tmp
  randomBlowfishSecret=$(openssl rand -base64 32)
  sed -e "s|cfg\['blowfish_secret'\] = ''|cfg['blowfish_secret'] = '$randomBlowfishSecret'|" \
    ${WWW_REP}/myadmin/config.sample.inc.php \
    > ${WWW_REP}/myadmin/config.inc.php

  sed -i "s/cfg\['Servers'\]\[\$i\]\['host'\] = 'localhost';/cfg\['Servers'\]\[\$i\]\['host'\] = '192.168.234.6';/g" ${WWW_REP}/myadmin/config.inc.php

cat <<EOF > "$SITE_CONF"
<VirtualHost *:80>
    DocumentRoot /var/www/html/myadmin
    
    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
EOF

  # Activer le site et recharger Apache
  a2ensite 000-default.conf \
  >> $LOG_FILE 2>&1

else
# Créer et modifier le fichier index.html avec cat <<EOF
cat <<EOF > /var/www/html/index.html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon Site Par Défaut</title>
</head>
<body>
    <h1>Bienvenue sur le site de l'étudiant 2</h1>
    <p>Ceci est la page d'accueil de mon site web.</p>
</body>
</html>
EOF
fi

# Redémarrer Apache2

echo "=> Redémarrage d'Apache2..."
sudo systemctl restart apache2 \
  >> $LOG_FILE 2>&1

