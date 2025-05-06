#!/bin/bash

# Créer les dossiers s'ils n'existent pas
mkdir -p /home/vagrant/playbooks
mkdir -p /home/vagrant/backup_scripts

# Copier trigger_backup.yml vers /home/vagrant/playbooks
cp ./trigger_backup.yml /home/vagrant/playbooks/trigger_backup.yml

# Copier les scripts de sauvegarde vers /home/vagrant/backup_scripts
cp ./scripts/backup_files.sh /home/vagrant/backup_scripts/
cp ./scripts/backup_bdd.sh /home/vagrant/backup_scripts/

# Donner les bons droits
chown -R vagrant:vagrant /home/vagrant/playbooks /home/vagrant/backup_scripts
chmod +x /home/vagrant/backup_scripts/*.sh

echo "Déploiement terminé."

