## Déploiement d'un Serveur DNS - Projet ESEO Teaching Cloud

Permet de déployer automatiquement une machine virtuelle qui servira de **serveur DNS** au sein d’un réseau. L’installation et la configuration sont réalisées à l’aide de Vagrant et de plusieurs scripts bash.

Dans ce projet, nous allons configurer un serveur DNS nommé **srv-dns.dns.local** en utilisant **BIND9**, un serveur DNS largement utilisé.

## Déploiement Automatisé
Le déploiement repose sur un fichier Vagrantfile qui configure la machine et exécute automatiquement les scripts suivants :

## script_ssh (variable dans le Vagrantfile)
    Active l’authentification SSH pour permettre la connexion sécurisée à la machine.

## install_bind.sh (script Bash dans scripts/)
    Installe et configure BIND9 pour transformer la machine en un serveur DNS nommé srv-dns.dns.local.

## config_sys.sh (script Bash dans scripts/)
    Configure l’interface réseau enp0s8 avec le bon masque en fonction de la machine.

## script_route (variable dans le Vagrantfile)
    Supprime la route NAT par défaut et la remplace par la passerelle appropriée pour assurer une bonne connectivité.

## 
Lancer le déploiement

Pour déployer la machine, il suffit d’exécuter :
```bash
vagrant up
```
Cela créera et configurera automatiquement le serveur DNS.