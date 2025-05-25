#!/bin/bash

## install Mariadb server (ex Mysql))

IP=$(hostname -I | awk '{print $2}')
APT_OPT="-o Dpkg::Progress-Fancy="0" -q -y"
LOG_FILE="/vagrant/logs/install_bdd.log"
DEBIAN_FRONTEND="noninteractive"

#Utilisateur a créer (si un vide alors pas de création)
DBNAME="squashtm"
DBUSER="squash-tm"
DBPASSWD="password"

#Fichier sql à injecter (présent dans un sous répertoire)
DBFILE="files/mariadb-full-install-version-6.0.1.RELEASE.sql"

echo "START - install MariaDB - "$IP

echo "=> [1]: Install required packages ..."
DEBIAN_FRONTEND=noninteractive

sudo apt install curl software-properties-common dirmngr -y \
  > $LOG_FILE 2>&1

curl -LsS -O https://downloads.mariadb.com/MariaDB/mariadb_repo_setup \
  >> $LOG_FILE 2>&1
sudo bash mariadb_repo_setup --mariadb-server-version=10.6 \
  >> $LOG_FILE 2>&1


apt-get install -o Dpkg::Progress-Fancy="0" -q -y \
	mariadb-server \
	mariadb-client -y \
  >> $LOG_FILE 2>&1

sudo systemctl start mariadb \
  >> $LOG_FILE 2>&1
sudo systemctl enable mariadb \
  >> $LOG_FILE 2>&1

echo "=> [2]: Configuration du service"
if [ -n "$DBNAME" ] && [ -n "$DBUSER" ] && [ -n "$DBPASSWD" ] ;then
  mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS $DBNAME CHARACTER SET utf8mb4 COLLATE utf8mb4_bin" \
  >> $LOG_FILE 2>&1
  mysql -uroot -proot -e "CREATE USER '$DBUSER'@'localhost' IDENTIFIED BY '$DBPASSWD'" \
  >> $LOG_FILE 2>&1
  mysql -uroot -proot -e "GRANT ALL ON $DBNAME.* TO '$DBUSER'@'localhost'" \
  >> $LOG_FILE 2>&1
  mysql -uroot -proot -e "FLUSH PRIVILEGES" \
  >> $LOG_FILE 2>&1
  mysql -uroot -proot $DBNAME < /vagrant/$DBFILE \
  >> $LOG_FILE 2>&1
fi

# Donner l'accès au port 3306 depuis n'importe qu'elle addresse
# on peut remplacer le 192.168.56.10 par le 0.0.0.0
sed -i 's/127.0.0.1/0.0.0.0/g' /etc/mysql/mariadb.conf.d/50-server.cnf \
  >> $LOG_FILE 2>&1

sudo systemctl restart mariadb \
  >> $LOG_FILE 2>&1

echo "END - install MariaDB"