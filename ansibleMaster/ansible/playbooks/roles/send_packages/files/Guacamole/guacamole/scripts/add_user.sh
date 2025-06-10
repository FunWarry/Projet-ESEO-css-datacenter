#!/bin/bash

USER="$1"
PASSWORD="network"

# Cr�er le groupe
sudo mysql -u root guacadb -e "
INSERT INTO guacamole_connection_group (connection_group_name, type, parent_id, enable_session_affinity, max_connections, max_connections_per_user)
VALUES ('$USER', 'ORGANIZATIONAL', NULL, 0, 0, 0);
"

# R�cup�rer l'ID du groupe
GROUP_ID=$(sudo mysql -u root guacadb -N -e "SELECT connection_group_id FROM guacamole_connection_group WHERE connection_group_name='$USER';" | tr -d '\n')

# Cr�er la connexion SSH
sudo mysql -u root guacadb -e "
INSERT INTO guacamole_connection (connection_name, protocol, parent_id, max_connections, max_connections_per_user)
VALUES ('SSH-Connexion-$USER', 'ssh', $GROUP_ID, 5, 2);
"

# R�cup�rer l'ID de la connexion
CONN_ID=$(sudo mysql -u root guacadb -N -e "SELECT connection_id FROM guacamole_connection WHERE connection_name='SSH-Connexion-$USER';" | tr -d '\n')

# Ajouter les param�tres de la connexion
sudo mysql -u root guacadb -e "
INSERT INTO guacamole_connection_parameter (connection_id, parameter_name, parameter_value) VALUES
($CONN_ID, 'hostname', '192.168.232.2'),
($CONN_ID, 'port', '22'),
($CONN_ID, 'enable-sftp', 'true');
"

# Cr�er une entit� utilisateur (ignore l�erreur si d�j� existant)
sudo mysql -u root guacadb -e "
INSERT IGNORE INTO guacamole_entity (name, type) VALUES ('$USER', 'USER');
"

# R�cup�rer l'ID de l'entit�
ENTITY_ID=$(sudo mysql -u root guacadb -N -e "SELECT entity_id FROM guacamole_entity WHERE name='$USER';" | tr -d '\n')

# G�n�rer un salt et un hash SHA256 pour le mot de passe
SALT=$(openssl rand -hex 8)
PASSWORD_HASH=$(echo -n "${PASSWORD}${SALT}" | sha256sum | awk '{print $1}')

# Cr�er le user avec mot de passe hach� � ignore s�il existe
sudo mysql -u root guacadb -e "
INSERT IGNORE INTO guacamole_user (entity_id, password_hash, password_salt, password_date, disabled, expired)
VALUES ($ENTITY_ID, '$PASSWORD_HASH', '$SALT', NOW(), 0, 0);
"

# Donner le droit READ
sudo mysql -u root guacadb -e "
INSERT INTO guacamole_connection_permission (entity_id, connection_id, permission)
VALUES ($ENTITY_ID, $CONN_ID, 'READ');
"
