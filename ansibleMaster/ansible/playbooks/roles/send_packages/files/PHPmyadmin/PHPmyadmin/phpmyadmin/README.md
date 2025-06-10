# VM PHPmyadmin

Ce projet utilise **Vagrant** pour créer une machine virtuelle nommée `phpmyadmin` avec une configuration réseau et SSH personnalisée.

## Configuration

* Box utilisée : `chavinje/fr-book-64`
* Nom de la VM : `phpmyadmin`
* CPU : 2
* RAM : 1024 Mo
* Adresse IP : `192.168.232.4` (interface bridgée)

## Provisioning

Deux scripts sont exécutés automatiquement lors de la création de la VM :

### 1. SSH

* Active `ChallengeResponseAuthentication` dans la configuration SSH
* Redémarre le service SSH
* Ajoute une clé publique (contenue dans `files/id_rsa.pub`) dans `~/.ssh/authorized_keys` de l'utilisateur `vagrant`

### 2. Réseau

* Vide les adresses IP existantes sur `enp0s8`
* Attribue l'adresse IP `192.168.232.4/23`
* Supprime la route par défaut existante
* Ajoute une nouvelle route par défaut via `192.168.232.1`

## Utilisation

```bash
vagrant up         # Démarre la machine virtuelle
vagrant ssh        # Se connecte à la VM
```

## Remarques

* Le fichier `files/id_rsa.pub` doit exister avant l'exécution de `vagrant up`
* L'interface réseau `eno1` de la machine hôte est utilisée pour le mode bridge

