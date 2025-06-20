#!/bin/bash

# Récupération des paramètres ou demande à l'utilisateur
IP_MACHINE=$1
if [ -z "$IP_MACHINE" ]; then
  read -p "Entrez l'adresse IP de la machine : " IP_MACHINE
fi

NOM_CONNEXION=$2
if [ -z "$NOM_CONNEXION" ]; then
  read -p "Entrez le nom de la connexion : " NOM_CONNEXION
fi

NOM_GROUPE=$3
if [ -z "$NOM_GROUPE" ]; then
  read -p "Entrez le nom du groupe : " NOM_GROUPE
fi

# Affichage (ou usage)
echo "IP_MACHINE   = $IP_MACHINE"
echo "NOM_CONNEXION = $NOM_CONNEXION"
echo "NOM_GROUPE    = $NOM_GROUPE"

# Construction et exécution de la requête SQL
sudo mysql -u root guacadb -e "
-- Récupération de l'ID du groupe de connexions
SET @group_id = (SELECT connection_group_id FROM guacamole_connection_group WHERE connection_group_name = '$NOM_GROUPE');

-- Vérification que le groupe existe
-- Si le groupe n'existe pas, on peut l'ajouter ici (optionnel)

-- Insertion de la connexion SSH
INSERT INTO guacamole_connection (connection_name, protocol, parent_id, max_connections, max_connections_per_user)
VALUES ('$NOM_CONNEXION', 'ssh', @group_id, 5, 2);

SET @conn_id = LAST_INSERT_ID();

-- Paramètres de la connexion SSH
INSERT INTO guacamole_connection_parameter (connection_id, parameter_name, parameter_value)
VALUES
(@conn_id, 'hostname', '$IP_MACHINE'),
(@conn_id, 'port', '22'),
(@conn_id, 'enable-sftp', 'true');

-- Attribution de la permission READ à l'entité ID 1
INSERT INTO guacamole_connection_permission (entity_id, connection_id, permission)
VALUES (1, @conn_id, 'READ');
"
