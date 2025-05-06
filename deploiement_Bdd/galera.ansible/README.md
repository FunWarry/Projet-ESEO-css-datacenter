Permet de déployer automatiquement un cluster Galera pour le gestionnaire de base de données MariaDB, accompagné d'un load balancer HAProxy. L'installation et la configuration sont réalisées à l’aide de Vagrant et de plusieurs scripts bash.

Dans ce projet, trois machines seront configurées pour former un **cluster Galera**, avec un **HAProxy** en guise de load balancer pour gérer les connexions de manière équilibrée.

## Déploiement Automatisé
Pré-requis :

**Vagrant** et **VirtualBox** doivent être installés avant de lancer le script.

Le Vagrantfile est conçu pour déployer 4 machines et exécuter automatiquement les scripts suivants :

## script_host (variable dans le Vagrantfile)
Associe un nom d’hôte à chaque machine en mettant à jour le fichier /etc/hosts :

## echo '192.168.234.3 galeranode1' >> /etc/hosts
## echo '192.168.234.4 galeranode2' >> /etc/hosts
## echo '192.168.234.5 galeranode3' >> /etc/hosts
## echo '192.168.234.6 haproxynode1' >> /etc/hosts

## script_ssh (variable dans le Vagrantfile)
Active la connexion SSH avec authentification pour chaque machine.

## config_sys.sh (script Bash dans scripts/)
Configure l’interface réseau enp0s8 avec le bon masque en fonction de la machine.

## script_route (variable dans le Vagrantfile)
Supprime la route NAT par défaut et la remplace par la passerelle appropriée.

## install_galera.sh (script Bash dans scripts/)
Installe et configure Galera Cluster sur les trois machines Galera :
Déploie MariaDB et Galera sur chaque nœud.
Initialise le cluster Galera sur galeranode1.
Crée deux utilisateurs (etudiant1, etudiant2).
Crée deux bases de données (etudiant1, etudiant2).

## install_ha.sh (script Bash dans scripts/)
Installe et configure HAProxy sur haproxynode1 :
Déploie un load balancer pour distribuer la charge entre les nœuds Galera.
Facilite l’accès aux bases de données en redirigeant les connexions automatiquement.

Lancer le déploiement

Pour démarrer toutes les machines et exécuter les scripts automatiquement :
```bash
vagrant up
```