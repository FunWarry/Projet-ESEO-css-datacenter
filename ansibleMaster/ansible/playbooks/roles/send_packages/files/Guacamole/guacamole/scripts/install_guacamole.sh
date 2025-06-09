#!/bin/bash
LOG_FILE="/vagrant/logs/install.log"

echo "=== Mise à jour et installation des dépendances ==="

sudo apt clean \
  > $LOG_FILE 2>&1
sudo apt update \
  >> $LOG_FILE 2>&1
  
sudo apt-get install -y \
  build-essential libcairo2-dev libjpeg62-turbo-dev libpng-dev libtool-bin uuid-dev libossp-uuid-dev \
  libavcodec-dev libavformat-dev libavutil-dev libswscale-dev freerdp2-dev libpango1.0-dev libssh2-1-dev \
  libtelnet-dev libvncserver-dev libwebsockets-dev libpulse-dev libssl-dev libvorbis-dev libwebp-dev wget mariadb-server \
  >> "$LOG_FILE" 2>&1

echo "=== Téléchargement et compilation de guacamole-server ==="
cd /tmp
wget -q https://downloads.apache.org/guacamole/1.5.5/source/guacamole-server-1.5.5.tar.gz
tar -xzf guacamole-server-1.5.5.tar.gz
cd guacamole-server-1.5.5
sudo ./configure --with-systemd-dir=/etc/systemd/system/ --disable-guacenc  \
  >> "$LOG_FILE" 2>&1
sudo make \
  >> "$LOG_FILE" 2>&1
sudo make install \
  >> "$LOG_FILE" 2>&1

echo "=== Configuration système et démarrage de guacd ==="
sudo ldconfig
sudo systemctl daemon-reload
sudo systemctl enable --now guacd

echo "=== Création des répertoires de configuration Guacamole ==="
sudo mkdir -p /etc/guacamole/{extensions,lib}

echo "=== Installation de Tomcat 9 ==="
echo "deb http://deb.debian.org/debian/ bullseye main" | sudo tee /etc/apt/sources.list.d/bullseye.list
sudo apt-get update  \
  >> "$LOG_FILE" 2>&1
sudo apt-get install -y tomcat9 tomcat9-admin tomcat9-common tomcat9-user \
  >> "$LOG_FILE" 2>&1

echo "=== Téléchargement et déploiement du client web Guacamole ==="
cd /tmp
wget -q https://downloads.apache.org/guacamole/1.5.5/binary/guacamole-1.5.5.war \
  >> "$LOG_FILE" 2>&1
sudo mv guacamole-1.5.5.war /var/lib/tomcat9/webapps/guacamole.war
sudo systemctl restart tomcat9 guacd

echo "=== Sécurisation et configuration MariaDB ==="
mysql -u root  -e "
CREATE DATABASE guacadb;
CREATE USER 'guaca_nachos'@'localhost' IDENTIFIED BY 'P@ssword!';
GRANT SELECT,INSERT,UPDATE,DELETE ON guacadb.* TO 'guaca_nachos'@'localhost';
FLUSH PRIVILEGES;"

echo "=== Installation de l'extension JDBC Guacamole et du connecteur MySQL ==="
cd /tmp
wget -q https://downloads.apache.org/guacamole/1.5.5/binary/guacamole-auth-jdbc-1.5.5.tar.gz \
  >> "$LOG_FILE" 2>&1
tar -xzf guacamole-auth-jdbc-1.5.5.tar.gz
sudo mv guacamole-auth-jdbc-1.5.5/mysql/guacamole-auth-jdbc-mysql-1.5.5.jar /etc/guacamole/extensions/

wget -q https://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-j-9.1.0.tar.gz \
  >> "$LOG_FILE" 2>&1
tar -xzf mysql-connector-j-9.1.0.tar.gz
sudo cp mysql-connector-j-9.1.0/mysql-connector-j-9.1.0.jar /etc/guacamole/lib/

echo "=== Import de la structure SQL Guacamole dans MariaDB ==="
cd guacamole-auth-jdbc-1.5.5/mysql/schema/
cat *.sql | sudo mysql -u root guacadb

echo "=== Création du fichier guacamole.properties ==="
sudo bash -c 'cat > /etc/guacamole/guacamole.properties <<EOF
# MySQL
mysql-hostname: 127.0.0.1
mysql-port: 3306
mysql-database: guacadb
mysql-username: guaca_nachos
mysql-password: P@ssword!
EOF'

echo "=== Création du fichier guacd.conf ==="
sudo bash -c 'cat > /etc/guacamole/guacd.conf <<EOF
[server]
bind_host = 0.0.0.0
bind_port = 4822
EOF'

echo "=== Redémarrage des services Tomcat9, guacd et mariadb ==="
sudo systemctl restart tomcat9 guacd mariadb

sudo mysql -u root guacadb -e "
INSERT INTO guacamole_connection_group (connection_group_name, type, parent_id, enable_session_affinity, max_connections, max_connections_per_user)
VALUES 
('Admin', 'ORGANIZATIONAL', NULL, 0, 0, 0),
('Etudiants', 'ORGANIZATIONAL', NULL, 0, 0, 0);
"
sudo tee /etc/guacamole/user-mapping.xml > /dev/null <<EOF
<user-mapping>
</user-mapping>
EOF

sudo chown tomcat:tomcat /etc/guacamole/user-mapping.xml
sudo chmod 600 /etc/guacamole/user-mapping.xml

echo "Installation terminée. Apache Guacamole est prêt."
