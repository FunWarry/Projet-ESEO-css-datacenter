# Projet Infrastructure et Logiciels

Ce projet met en place une infrastructure virtualisée composée de trois machines virtuelles, configurées avec **Vagrant** et **VirtualBox**, pour offrir un environnement de développement sécurisé, fiable et performant. Le déploiement de l’ensemble de l’infrastructure se fait en une seule commande :
```bash
vagrant up
```
## Connexion SSH
Se connecter à une VM (firewall par exemple)
    ```vagrant ssh firewall```

Arréter une VM (victime par exemple)
    ```vagrant halt victime```

Détruire toutes les VMs (sans demande de confirmation)
    ```vagrant destroy -f```

## Serveur de Base de Données (srv-bdd)
Le serveur **srv-bdd** héberge la base de données **MariaDB**. Placé dans un réseau privé (IP : `192.168.56.81`), il garantit la sécurité des données tout en restant accessible aux développeurs. Un mécanisme de sauvegarde automatique exécute chaque nuit à 00h00 des sauvegardes de la base de données, offrant une solution de restauration rapide en cas de problème.

## Serveur Web (srv-web)
Le serveur **srv-web** exécute **Apache2** et permet le déploiement d’applications via un dépôt Git. Accessible à l’adresse `192.168.56.80`, ce serveur est chargé de récupérer, déployer et gérer les applications des développeurs. Une fois l’application déployée, elle est disponible à l’adresse sécurisée suivante :
`https://192.168.56.82/HomePage.php`.

## Proxy Inverse Sécurisé (reverse-proxy)
La machine **reverse-proxy** joue un rôle clé dans la sécurisation des échanges. Fonctionnant comme un intermédiaire entre les utilisateurs et les serveurs backend, elle utilise des certificats SSL auto-signés pour chiffrer les communications. Accessible à l’adresse `192.168.56.82`, ce proxy gère la création des certificats SSL et configure **Apache** pour assurer un trafic HTTPS sécurisé. Elle limite les connexions aux autres machines en jouant le rôle d'un bastion.
