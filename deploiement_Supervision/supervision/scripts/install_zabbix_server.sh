#!/bin/bash

# Variables
DB_PASSWORD="password"

# Update system
sudo apt update -y
sudo apt install -y wget pkg-config gzip mariadb-server apache2 php libapache2-mod-php php-mysql
sudo apt install -y gzip

# Download and install Zabbix repository
wget https://repo.zabbix.com/zabbix/7.0/debian/pool/main/z/zabbix-release/zabbix-release_latest_7.0+debian12_all.deb
sudo dpkg -i zabbix-release_latest_7.0+debian12_all.deb
sudo apt update -y

# Install Zabbix packages
sudo apt install -y zabbix-server-mysql zabbix-frontend-php zabbix-apache-conf zabbix-sql-scripts zabbix-agent snmp

# Configure MariaDB
sudo systemctl start mariadb
sudo systemctl enable mariadb

mysql -uroot -e "CREATE DATABASE zabbix CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;"
mysql -uroot -e "CREATE USER 'zabbix'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
mysql -uroot -e "GRANT ALL PRIVILEGES ON zabbix.* TO 'zabbix'@'localhost';"
mysql -uroot -e "SET GLOBAL log_bin_trust_function_creators = 1;"

# Import initial schema
sudo zcat /usr/share/zabbix-sql-scripts/mysql/server.sql.gz | mysql --default-character-set=utf8mb4 -uzabbix -p${DB_PASSWORD} zabbix

mysql -uroot -e "SET GLOBAL log_bin_trust_function_creators = 0;"

# Configure Zabbix server
sudo sed -i "s/# DBPassword=/DBPassword=${DB_PASSWORD}/" /etc/zabbix/zabbix_server.conf
sudo sed -i "s/# ListenIP=0.0.0.0/ListenIP=0.0.0.0/" /etc/zabbix/zabbix_server.conf
sudo sed -i "s/# AllowRoot=0/AllowRoot=1/" /etc/zabbix/zabbix_server.conf

# Restart services
sudo systemctl restart zabbix-server zabbix-agent apache2
sudo systemctl enable zabbix-server zabbix-agent apache2

echo "Zabbix Server 7.0 installation completed successfully!"
