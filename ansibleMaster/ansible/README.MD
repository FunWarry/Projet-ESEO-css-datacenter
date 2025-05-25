# Dossier Ansible - Projet ESEO

Ce dossier contient tous les fichiers Ansible nécessaires au déploiement et à la gestion des services dans le cadre du projet ESEO.



## Structure du dossier `ansible`

```
ansible/
├── playbooks/          # Playbooks Ansible pour le déploiement des services
│   ├── Bdd.yml
│   ├── destroy\_all.yml
│   ├── DHCP.yml
│   ├── Dns.yml
│   ├── Relais.yml
│   ├── roles/          # Rôles Ansible pour modulariser les déploiements
│   ├── Sauvegarde.yml
│   ├── send\_packages.yml
│   ├── Squash.yml
│   ├── Supervision.yml
│   └── Web.yml
├── variables/
│   └── inventory.ini    # Inventaire des hôtes pour cibler les machines
```



## Description des composants

### Playbooks principaux

- `Bdd.yml` : déploiement et configuration des bases de données
- `destroy_all.yml` : destruction complète des services déployés
- `DHCP.yml` : configuration et déploiement du service DHCP
- `Dns.yml` : configuration et déploiement du service DNS
- `Relais.yml` : configuration du service relais (ex : serveur mail)
- `Sauvegarde.yml` : gestion des sauvegardes des données
- `send_packages.yml` : rôle et playbook de distribution des fichiers nécessaires aux machines
- `Squash.yml` : déploiement du service Squash (gestionnaire de versions ou sessions)
- `Supervision.yml` : mise en place du système de supervision
- `Web.yml` : déploiement des services Web

### Variables et Inventaire

- `inventory.ini` : fichier d’inventaire Ansible listant les machines cibles et groupes d’hôtes  
  C’est dans ce fichier que sont définis les IPs et noms des machines sur lesquelles Ansible agit.

### Rôles Ansible et fichiers

- Le dossier `roles/` contient des rôles réutilisables pour organiser le code Ansible.

- En particulier, le rôle `send_packages` utilise des fichiers situés sous :  
  `playbooks/roles/send_packages/files/`  

  Ce répertoire contient des sous-dossiers correspondant aux différents services :  
```
Bdd/
Creer\_Vm/
DHCP/
Dns/
Relais/
Sauvegarde/
Squash/
Supervision/
Web/
```

Ces fichiers sont copiés sur les machines cibles lors du déploiement via le playbook `send_packages.yml`.



## Remarques importantes

- Tous les fichiers de déploiement et scripts sont exécutés sous l’utilisateur **`ansible`** (sur la machine de contrôle et/ou cible selon la configuration).

- Assurez-vous que l’utilisateur `etudis` dispose des droits nécessaires pour exécuter les commandes Ansible et accéder aux fichiers.



## Exemple d'utilisation

Lancer le playbook DNS :

```bash
ansible-playbook -i ansible/variables/inventory.ini ansible/playbooks/Dns.yml
````

Distribuer les fichiers nécessaires à un service via `send_packages` :

```bash
ansible-playbook -i ansible/variables/inventory.ini ansible/playbooks/send_packages.yml
```

Détruire tous les services déployés :

```bash
ansible-playbook -i ansible/variables/inventory.ini ansible/playbooks/destroy_all.yml
```
