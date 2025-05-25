#!/bin/bash
IP=$(hostname -I | awk '{print $2}')
APT_OPT="-o Dpkg::Progress-Fancy="0" -q -y"
LOG_FILE="/vagrant/logs/MysqlDump.log"
DEBIAN_FRONTEND="noninteractive"


# Utilisateur et nom de la base de donnée
DBNAME="squashtm"
DBUSER="squash-tm"
DBPASSWD="password"


# Chemin vers le script à éditer pour la sauvegarde
BACKUP_SCRIPT="/data/backup_script.sh"
BACKUP_DIR="/data/MysqlDump"

echo "START - Sauvegarde en cas de crache - " $IP

echo "=> [1]: Installing required packages..."
apt-get update $APT_OPT \
  >> $LOG_FILE 2>&1

mkdir /data
mkdir $BACKUP_DIR
touch $BACKUP_SCRIPT

echo "=> [2]: Fichier $BACKUP_SCRIPT pour le backup..."


# création du fichier bash pour récupérer chaque jour la base de donné.
cat <<EOF > $BACKUP_SCRIPT
#!/bin/bash

# Répertoire de sauvegarde
BACKUP_DIR="/data/MysqlDump"

# Utilisateur et nom de la base de donnée
DB_NAME="$DBNAME"
DB_USER="$DBUSER"
DB_PASSWD="$DBPASSWD"

# Vérifier la présence du repertoire \$BACKUP_DIR
if [ ! -d "\$BACKUP_DIR" ]; then
    mkdir -p "\$BACKUP_DIR"
fi

# Nom du fichier de sauvegarde
echo "Saisir le nom du fichier du nom de sauvegarde"
read NAME

# Vérifier la préssence du repertoire \$BACKUP_DIR/\$NAME
if [ ! -d "\$BACKUP_DIR/\$NAME" ]; then
    mkdir -p "\$BACKUP_DIR/\$NAME"
fi

# Commande mysqldump pour sauvegarder la base de données
mysqldump -u \$DB_USER -p\$DB_PASSWD \$DB_NAME > \$BACKUP_DIR/\$NAME/\$DB_NAME.sql

# Vérifier si la sauvegarde a été réalisée avec succès
if [ $? -eq 0 ]; then
    rsync -avu /data/MysqlDump/ /vagrant/bdd/
    echo "Sauvegarde de la base de données \$DB_NAME effectuée avec succès dans \$BACKUP_DIR/\$NAME ET DANS /vagrant/bdd/\$NAME"
else
    echo "Il y a eu une erreur lors de la sauvegarde de la base de données \$DB_NAME"
fi
EOF


# Éditer temporairement le crontab
TEMP_CRON=$(mktemp)
crontab -l > $TEMP_CRON

# Ajouter la tâche au crontab (ici, une exécution quotidienne à minuit)
echo "0 0 * * * bash $BACKUP_SCRIPT" >> $TEMP_CRON

# Installer le nouveau crontab
crontab $TEMP_CRON

# Suppression de la varialble temporaire
rm $TEMP_CRON

echo "END - Sauvegarde de la base de donnée dans le fichier"$BACKUP_DIR
