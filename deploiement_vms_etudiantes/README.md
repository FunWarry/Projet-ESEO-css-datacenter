

Ce projet utilise **Vagrant** pour déployer deux machines virtuelles, etudiant1 et etudiant2. Lors du déploiement, quatre scripts seront exécutés afin de configurer les machines, définir les paramètres réseau, et d'installer un serveur web avec du contenu spécifique sur chaque machine.

## Structure
.
├── Vagrantfile
├── scripts/
│   ├── config_sys.sh
│   ├── install_web.sh

## Déploiement

Pour déployer les machines, exécutez simplement la commande suivante dans le répertoire contenant le Vagrantfile :
```bash
vagrant up
```
Cela créera et configurera les machines virtuelles avec les paramètres définis.
Scripts déployés

Quatre scripts principaux sont exécutés lors du déploiement :

## Activation de la connexion SSH (script_ssh) 

Ce script, défini sous forme de variable dans le Vagrantfile, active la connexion SSH avec authentification pour les machines virtuelles.

## Configuration réseau (config_sys.sh)

Localisé dans le répertoire scripts/ .
Configure l'interface bridge (enp0s8) avec le bon masque réseau en fonction de la machine.

## Gestion des routes (script_route)

Défini sous forme de variable dans le Vagrantfile
Supprime la route NAT par défaut et la remplace par la passerelle par défaut du serveur concerné.

## Installation du serveur web (install_web.sh)

Localisé dans le répertoire scripts/
Déploie un serveur web sur chaque machine et configure le contenu :
    etudiant1 : Installe phpMyAdmin et le met à disposition sur le port 80
    etudiant2 : Déploie une page HTML simple sur le port 80

## Accès aux Machines

Une fois le déploiement terminé, vous pouvez accéder aux machines via SSH :
vagrant ssh etudiant1
vagrant ssh etudiant2

Ou visiter les sites déployés dans un navigateur :

    etudiant1 : [http://192.168.232.3] (phpMyAdmin)
    etudiant2 : [http://192.168.232.4] (Page HTML)
