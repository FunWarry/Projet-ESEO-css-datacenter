#!/bin/bash
LOG_FILE="/vagrant/logs/config_ssh.log"

echo "$(cat /vagrant/files/id_rsa.pub)" >> /home/vagrant/.ssh/authorized_keys