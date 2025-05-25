#!/bin/bash

## install web server with php


IP=$(hostname -I | awk '{print $2}')

APT_OPT="-o Dpkg::Progress-Fancy="0" -q -y"
LOG_FILE="/vagrant/logs/install_squash.log"
DEBIAN_FRONTEND="noninteractive"
SQUASH_TM="/opt/squash-tm/bin/startup.sh"

echo "START - install web Server - "$IP
apt-get install $APT_OPT \
  openjdk-17-jdk \
  openjdk-17-jre \
  > $LOG_FILE 2>&1

tar -zxvf /vagrant/squash-tm-6.0.1.RELEASE.tar.gz -C /opt/ \
  >> $LOG_FILE 2>&1
adduser --system --group --home /opt/squash-tm squash-tm \
  >> $LOG_FILE 2>&1
chown -R squash-tm:squash-tm /opt/squash-tm \
  >> $LOG_FILE 2>&1
chmod +x /opt/squash-tm/bin/startup.sh \
  >> $LOG_FILE 2>&1
sed -i 's/DB_TYPE=h2/DB_TYPE="mariadb"/g' $SQUASH_TM \
  >> $LOG_FILE 2>&1
sed -i 's/DB_URL="jdbc:h2:..\/data\/squash-tm;NON_KEYWORDS=ROW,VALUE"/DB_URL="jdbc:mariadb:\/\/localhost:3306\/squashtm"/g' $SQUASH_TM \
  >> $LOG_FILE 2>&1
sed -i 's/DB_USERNAME=sa/DB_USERNAME="squash-tm"/g' $SQUASH_TM \
  >> $LOG_FILE 2>&1 
sed -i 's/DB_PASSWORD=sa/DB_PASSWORD="password"/g' $SQUASH_TM \
  >> $LOG_FILE 2>&1

touch /opt/squash-tm/squash-tm.service
cat <<EOF > /opt/squash-tm/squash-tm.service
[Unit]
Description=Squash-tm daemon
After=systemd-user-sessions.service time-sync.target

[Service]
WorkingDirectory=/opt/squash-tm/bin
ExecStart=/opt/squash-tm/bin/startup.sh
ExecStop=/bin/kill $MAINPID
KillMode=process
Type=simple
User=squash-tm
Group=squash-tm
Restart=on-failure
RestartSec=10
StartLimitInterval=120
StartLimitBurst=3
StandardOutput=null
StandardError=null

[Install]
WantedBy=multi-user.target
EOF

cp /opt/squash-tm/squash-tm.service /etc/systemd/system/ \
  >> $LOG_FILE 2>&1

systemctl daemon-reload \
  >> $LOG_FILE 2>&1

systemctl enable squash-tm \
  >> $LOG_FILE 2>&1

systemctl start squash-tm \
  >> $LOG_FILE 2>&1