#!/bin/bash

# Chaque ligne contient : "NomConnexion|IP"
firewall=(
  "PC Physique Firewall|192.168.4.171"
  "DHCP_OPENVPN|192.168.239.253"
)

dns=(
  "PC Physique DNS|192.168.238.11"
  "DNS|192.168.238.10"
  "Ansible Master|192.168.0.13"
  "Relais|192.168.0.11"
)

web=(
  "PC Physique Web|192.168.232.2"
  "Web|192.168.232.8"
  "Squash|192.168.232.7"
  "Guacamole|192.168.232.3"
  "PHPmyAdmin|192.168.232.4"
  "Relais|192.168.232.5"
)

bdd=(
  "PC Physique Bdd|192.168.234.2"
  "Galeranode1|192.168.234.3"
  "Galeranode2|192.168.234.4"
  "Galeranode3|192.168.234.5"
  "HAproxynode1|192.168.234.6"
  "HAproxynode2|192.168.234.7"
  "Relais|192.168.234.11"
)

supervision=(
  "PC Physique Supervision|192.168.238.2"
  "Supervision|192.168.238.3"
  "Relais|192.168.238.5"
)

sauvegarde=(
  "PC Physique Sauvegarde|192.168.236.2"
  "Sauvegarde|192.168.236.3"
  "Proxy|192.168.236.4"
  "Client test|192.168.236.5"
  "Relais|192.168.238.11"
)

# Fonction pour générer les requêtes d’insertion
insert_group() {
  local group_name="$1"
  local group_array="$2"

  echo "-- $group_name"
  echo "SET @group_id = (SELECT connection_group_id FROM guacamole_connection_group WHERE connection_group_name = '$group_name');"

  eval "entries=(\"\${$group_array[@]}\")"

  for entry in "${entries[@]}"; do
    local name=$(echo "$entry" | cut -d'|' -f1)
    local ip=$(echo "$entry" | cut -d'|' -f2)

    echo "INSERT INTO guacamole_connection (connection_name, protocol, parent_id) VALUES ('$name', 'ssh', @group_id);"
    echo "SET @conn_id = LAST_INSERT_ID();"
    echo "INSERT INTO guacamole_connection_parameter (connection_id, parameter_name, parameter_value) VALUES
      (@conn_id, 'hostname', '$ip'),
      (@conn_id, 'port', '22');"
    echo "INSERT INTO guacamole_connection_permission (entity_id, connection_id, permission) VALUES (1, @conn_id, 'READ');"
  done
}

# Création des groupes principaux
sudo mysql -u root guacadb -e "
INSERT INTO guacamole_connection_group (connection_group_name, type, parent_id, enable_session_affinity, max_connections, max_connections_per_user)
VALUES
('PC Physique Firewall', 'ORGANIZATIONAL', NULL, 0, 0, 0),
('PC Physique DNS', 'ORGANIZATIONAL', NULL, 0, 0, 0),
('PC Physique Web', 'ORGANIZATIONAL', NULL, 0, 0, 0),
('PC Physique Bdd', 'ORGANIZATIONAL', NULL, 0, 0, 0),
('PC Physique Supervision', 'ORGANIZATIONAL', NULL, 0, 0, 0),
('PC Physique Sauvegarde', 'ORGANIZATIONAL', NULL, 0, 0, 0);
"

# Insertion des connexions SSH dans chaque groupe
sudo mysql -u root guacadb <<EOF
$(insert_group "PC Physique Firewall" firewall)
$(insert_group "PC Physique DNS" dns)
$(insert_group "PC Physique Web" web)
$(insert_group "PC Physique Bdd" bdd)
$(insert_group "PC Physique Supervision" supervision)
$(insert_group "PC Physique Sauvegarde" sauvegarde)
EOF

echo "✅ Connexions SSH ajoutées avec noms et IPs personnalisés."
