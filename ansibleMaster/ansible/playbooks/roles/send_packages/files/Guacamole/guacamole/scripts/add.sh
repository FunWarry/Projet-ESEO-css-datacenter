#!/bin/bash

nom="$1"
mdp="$2"
ip="$3"
fichier="/etc/guacamole/user-mapping.xml"

sudo sed -i "/<\/user-mapping>/i\\
  <authorize username=\"$nom\" password=\"$mdp\">\\
    <connection name=\"SSH $nom\">\\
      <protocol>ssh</protocol>\\
      <param name=\"hostname\">$ip</param>\\
      <param name=\"port\">22</param>\\
    </connection>\\
  </authorize>" "$fichier"

sudo systemctl restart tomcat9 2>/dev/null

echo "✅ Utilisateur $nom ajouté."
