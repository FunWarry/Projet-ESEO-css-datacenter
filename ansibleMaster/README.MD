# Dossier Ansible - ansibleMaster

Ce dossier contient les fichiers nécessaires au déploiement des services via Ansible.

## Structure principale du dossier `ansibleMaster`

```
ansibleMaster/
├── ansible/      # Contient les playbooks, variables et rôles Ansible
├── logs/         # Dossier pour les logs (journalisation)
├── scripts/      # Scripts shell utilisés pour la configuration
└── Vagrantfile   # Configuration Vagrant pour la machine virtuelle ansibleMaster
```

## Utilisation

Pour gérer et déployer les services, rendez-vous dans le dossier `ansible` :

```bash
cd ansibleMaster/ansible
````

Vous y trouverez :

* Les playbooks dans le dossier `playbooks/`
* Les fichiers d’inventaire et variables dans le dossier `variables/`

## Exemple

Lancer un playbook, par exemple pour le DNS :

```bash
ansible-playbook -i variables/inventory.ini playbooks/Dns.yml
```


## Notes

* Tous les déploiements sont conçus pour être exécutés avec l’utilisateur `ansible`.
* Les scripts de configuration complémentaires se trouvent dans le dossier `scripts/` à la racine du dossier.
