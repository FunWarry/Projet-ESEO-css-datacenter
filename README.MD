[liens vers la documentation d'installation complette](http://20.86.62.213:3000/gevraima/Projet-ESEO/wiki/Guide_installation)

# Guide d'installation Complet du système - ESEO Teaching Cloud

## I. Guide d'installation d'OPNSense

### 1. Prérequis :

* Un ordinateur avec :
    * \> 4 cœurs
    * \> 8 Go de RAM
    * \> 40 Go d'espace libre
    * 2 cartes Ethernet
    * Une connexion vers le routeur de l'ESEO
    * Une connexion vers le switch de votre LAN

### 2. Déploiement automatisé d’OPNSense

Un script dédié permet désormais d’automatiser les étapes suivantes :

1. **Téléchargement automatique de l'ISO OPNSense**
2. **Création de la VM VirtualBox**
3. **Import automatique du fichier de configuration `config_opnsense.xml`**
4. **Démarrage initial de la VM**

### 3. Lancement du script

bash scripts/setup_opnsense.sh

Ce script :

1. **Télécharge l’ISO depuis https://opnsense.org/downloads**

2. **Crée une VM FreeBSD 64-bit dans VirtualBox**

3. **Affecte 2 interfaces réseau (LAN et WAN)**

4. **Attache le disque dur et l’ISO**

5. **Lance automatiquement la VM**

6. **Accède à l’interface web pour importer la configuration**

### 4. Étapes manuelles restantes

* Une fois la VM lancée et la configuration importée :

	* Aller dans System > Configuration > Backup / Restore

	* Sélectionner le fichier fourni dans Configuration Opnsense

	* Importer la configuration
    
    * Redémarrer la machine

	
  **⚠️ Certaines configurations spécifiques (interfaces, NAT) doivent encore être ajustées manuellement après import.**
---

## II. Guide d'installation du réseau

Ce guide décrit les étapes à suivre pour installer et configurer la partie réseau de votre système, en utilisant les scripts de configuration du routeur et du switch, ainsi que le schéma de branchement réseau.

### 1. Prérequis

Avant de commencer, assurez-vous d'avoir les éléments suivants :

* Les scripts de configuration du routeur et du switch.
* Le schéma de branchement réseau.
* Les équipements réseau (routeur, switch, câbles Ethernet).
* Un ordinateur avec une interface réseau et un logiciel de terminal (par exemple, PuTTY).

### 2. Étapes d'installation

1.  **Branchement des équipements :**

	![Description de l'image](http://132.220.122.42:3000/gevraima/Projet-ESEO/raw/branch/increment_3/Documentation/plan%20de%20branchement.png)
    
    * Suivez le schéma de branchement réseau pour connecter les équipements entre eux à l'aide des câbles Ethernet.
    * Assurez-vous que tous les équipements sont correctement alimentés.

2.  **Configuration du routeur :**

    * Connectez votre ordinateur au routeur à l'aide d'un câble serial.
    * Ouvrez un logiciel de terminal et configurez la connexion avec les paramètres suivants :
        * Type de connexion : Série (ou Telnet si le routeur est configuré pour le permettre)
        * Débit en bauds : 9600 (ou autre valeur spécifiée par le fabricant)
        * Bits de données : 8
        * Parité : Aucune
        * Bits d'arrêt : 1
        * Contrôle de flux : Aucun
    * Mettez le routeur sous tension et attendez qu'il démarre.
    * Copiez et collez le script de configuration du routeur dans le terminal en plusieurs partie pour éviter les problème, de préférence acl par acl puis le reste (clique droit pour coller sur une console putty).
    * Enregistrez la configuration en tapant sur "entrer" pour la commande `copy running-config startup-config`.

3.  **Configuration du switch :**

    * Connectez votre ordinateur au switch à l'aide d'un câble serial.
    * Ouvrez un logiciel de terminal et configurez la connexion de la même manière que pour le routeur.
    * Mettez le switch sous tension et attendez qu'il démarre.
    * Copiez et collez le script de configuration du switch dans le terminal (clique droit pour coller sur une console putty).
    * Enregistrez la configuration en tapant sur "entrer" pour la commande `copy running-config startup-config`.

4.  **Vérification de la connectivité :**

    * Une fois les configurations du routeur et du switch terminées, vérifiez la connectivité entre les différents équipements.
    * Utilisez la commande `ping` sur votre ordinateur pour tester la connectivité avec le routeur, le switch et les autres équipements du réseau.
    * Si la connectivité n'est pas établie, vérifiez les branchements, les configurations et les adresses IP.



### 3. Scripts de configuration

[Script du routeur](http://132.220.122.42:3000/gevraima/Projet-ESEO/src/branch/increment_3/script%20réseau/script%20routeur%20projet.txt)

[Script du switch](http://132.220.122.42:3000/gevraima/Projet-ESEO/src/branch/increment_3/script%20réseau/script%20switch%20projet.txt)

Se trouve dans le dossier "scripte réseau" pour le rendu Incrément 1.

---


## III. Déploiement des Services avec Ansible Master

### 1. Présentation

Le déploiement des services de l’infrastructure est centralisé via une machine **ansibleMaster**, située sur le **VLAN 60 (DNS)**. Elle permet de configurer et lancer le déploiement de toutes les VMs nécessaires (DNS, Web, BDD, Supervision, etc.) via un ensemble de **playbooks Ansible**.

### 2. Structure du dossier `ansibleMaster`

```
ansibleMaster/
├── ansible/ # Contient les playbooks, rôles et inventaire
├── logs/ # Fichiers de journalisation Ansible
├── scripts/ # Scripts bash complémentaires (menu, setup, etc.)
└── Vagrantfile # Fichier Vagrant pour déployer ansibleMaster
```

### 3. Structure du sous-dossier `ansible`

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

---

### 4. Utilisation

#### a. Démarrage d’Ansible Master

```
cd ansibleMaster
vagrant up
```
#### b. Connexion à la machine
```
vagrant ssh
cd /vagrant/ansible
```
### 5. Exécution des playbooks

Tous les playbooks s'exécutent via l’utilisateur ansible, et sont lancés depuis le répertoire ansible.

➤ Exemple : déploiement du serveur DNS
```
ansible-playbook -i variables/inventory.ini playbooks/Dns.yml
```
➤ Exemple : envoi des fichiers de configuration
```
ansible-playbook -i variables/inventory.ini playbooks/send_packages.yml
```
➤ Exemple : destruction de toutes les VMs/services
```
ansible-playbook -i variables/inventory.ini playbooks/destroy_all.yml
```
### 6. Menu interactif (optionnel)

Un script scripts/deploiement.sh permet de choisir les services à déployer via un menu :

```
bash scripts/deploiement.sh
```
Menu proposé :

```
=== Déploiement ESEO Cloud ===
1. Déployer serveur DNS
2. Déployer cluster Galera + HAProxy
3. Déployer machines Étudiants
4. Déployer serveur Zabbix
5. Déployer infrastructure de sauvegarde
```
Chaque option exécute un playbook correspondant.

### 7. Remarques importantes

* Le fichier inventory.ini contient les IPs, noms d’hôtes et groupes utilisés par Ansible.

* Tous les déploiements sont testés avec l’utilisateur ansible.

* Assurez-vous que l’utilisateur etudis a les droits nécessaires si vous utilisez une VM alternative.

* Les logs sont stockés dans logs/ pour consultation en cas d’erreur.

### 8. Bonnes pratiques

* Ne jamais modifier directement les fichiers dans roles/send_packages/files/ sans versionner les changements.

* Toujours tester les modifications dans un environnement local avant de les intégrer à l’environnement de production.

* Documenter tout ajout de rôle ou playbook dans le wiki Git.

## IV. Mise en place de Zabbix

### Informations

* Lors de l'installation de la vms via l'Ansible master, un fichier de configuration est importé, Pour les dashboard, il faut ensuite importer un fichier spécifique

### Utilisation de Zabbix

Une fois l'installation de toute les vms terminée, accédez à l'interface web à l'adresse:
```
http://192.168.238.3/zabbix
```
pour l'ip publique donc hors de notre reseau de projet:
````
http://192.168.4.240:1000/zabbix
````

Identifiants par défaut:
- Utilisateur: Admin
- Mot de passe: zabbix

#### Notes importantes

- Remplacez 'password' par un mot de passe sécurisé
- Modifiez le mot de passe par défaut après la première connexion
- Vérifiez les logs en cas de problème dans `/var/log/zabbix/`

#### Liens utiles

- [Documentation officielle Zabbix](https://www.zabbix.com/documentation/)

#### Accès aux Dashboards

Après connexion :

1. Allez dans **Monitoring > Dashboards**
2. Vous trouverez plusieurs dashboards préconfigurés :

   - **Global View** : Vue d'ensemble de l'infrastructure
   - **Sécurité** : État des firewalls, IDS, règles réseau
   - **Réseaux** : Surveillance des équipements réseau (trafic, interfaces)
   - **BDD** : Suivi des bases de données (MySQL, PostgreSQL, etc.)
   - **LB et Web** : Charge sur les Load Balancers, disponibilité des sites web

Chaque dashboard offre :
- Une **visualisation graphique** claire des indicateurs de performance
- Une **liste des alertes récentes** classées par gravité

#### Voir les hôtes existants

Pour explorer les hôtes surveillés :

1. Cliquez sur **Monitoring > Hosts**
2. Une liste d’hôtes s’affiche (serveurs, équipements réseau, etc.)
3. Cliquez sur un hôte pour accéder aux détails suivants :
   - **Items** : Voir les éléments surveillés (CPU, mémoire, services, etc.)
   - **Graphs** : Visualiser les graphiques de performance
   - **Problems** : Vérifier les alertes et incidents en cours

#### Ajouter un nouvel hôte

1. Allez dans **Monitoring > Hosts**
2. En haut à droite cliquez sur **Create host**
3. Remplissez les informations suivantes :
   - **Host name** : Nom de l’hôte (ex. `srv-web-01`)
   - **Groups** : Ajouter à un groupe existant (ex : `Linux servers`)
   - **Interfaces** : Saisissez l’IP ou le DNS selon le type d’interface (**Agent**, **SNMP**, etc.)

4. Lier un **Template** :
   - Allez dans l’onglet **Templates**
   - Cliquez sur **Add**
   - Sélectionnez un template adapté (ex : `Template OS Linux by Zabbix agent`)

5. Cliquez sur **Add**

L’hôte sera automatiquement surveillé et apparaîtra parmi les hôtes dès que des données seront reçues car implicitement chaque VM dans notre infrastructure à un agent Zabbix d'installé qui va remonter les métriques vers notre serveur Zabbix.

Selon le **type d’hôte** que vous souhaitez ajouter, la méthode varie :

---

#### Ajouter un **serveur Linux** (Zabbix Agent)

1. Allez dans **Configuration > Hosts**
2. Cliquez sur **Create host**
3. Remplissez :
   - **Host name** : ex. `srv-database-01`
   - **Group** : ex. `Linux servers`
   - **Interfaces** : IP + sélectionnez le type **Agent**
4. Lier un template :
   - Onglet **Templates**
   - Cliquez sur **Add**
   - Choisissez **Template OS Linux by Zabbix agent**
5. Cliquez sur **Add**

---

#### Ajouter un **équipement réseau** (switch, routeur...)

1. Allez dans **Configuration > Hosts**
2. Cliquez sur **Discovery** (ou utilisez une règle de découverte déjà active)
3. Sélectionnez un hôte détecté automatiquement
4. Cliquez sur **Create host** ou **Convert to host**
5. Remplissez :
   - **Host name** : ex. `switch-core`
   - **Group** : `Network devices`
   - Interface : **SNMP**, avec IP correcte
6. Lier un template :
   - Exemple : **Template Net Cisco SNMP** (ou un template SNMP générique adapté)
7. Cliquez sur **Add**
---

#### Ajouter des hôtes automatiquement à partir d’une plage IP

Zabbix permet de configurer la **découverte réseau** depuis le menu **Data collection > Discovery**. Voici comment créer une règle de découverte adaptée à ton environnement.

1. Accéder à la création de la règle

- Aller dans `Data collection > Discovery`
- Cliquer sur **Create discovery rule**


2. Remplir les paramètres principaux

| Champ                         | Valeur recommandée                       |
|------------------------------|-------------------------------------------|
| **Name**                     | `Scan réseau local`                      |
| **Discovery by**             | `Zabbix agent` ou `SNMPv2 agent`         |
| **Server/Proxy**             | Choisir le serveur Zabbix ou un proxy    |
| **IP range**                 | `192.168.0.1-254` *(ou selon ton réseau)*|
| **Update interval**          | `1h`                                     |
| **Maximum concurrent checks**| `Unlimited` *(ou personnaliser si besoin)*|


3. Ajouter des vérifications

- Dans la section **Checks**, cliquer sur **Add**
- Sélectionner un **Type** :
  - `Zabbix agent` pour les serveurs
  - `SNMP` pour les équipements réseau
- Tu peux ajouter plusieurs types si nécessaire


4. Définir les critères d’unicité

Ces critères permettent à Zabbix d’éviter les doublons lors de la découverte automatique.

- Coche un ou plusieurs critères :
  - `IP address` *(recommandé)*
  - `Host name`, `DNS name`, `Visible name` *(optionnel selon ton usage)*


5. Activer la règle

- Vérifie que l’option **Enabled** est cochée
- Clique sur **Add**


6. Créer une Action liée à la découverte

1. Aller dans `Configuration > Actions`
2. Onglet **Discovery actions**
3. Cliquer sur **Create action**

Exemple d'action automatique :

- **Name** : `Ajout auto - Serveurs Linux`
- **Conditions** :
  - `Discovery check = Zabbix agent`
  - `IP = 192.168.0.1-254`
- **Operations** :
  - `Add to host group` : `Linux servers`
  - `Link to template` : `Template OS Linux by Zabbix agent`
  - `Add host` : activé


Zabbix va désormais :
- Scanner automatiquement la plage IP indiquée toutes les heures
- Identifier les hôtes répondant aux critères
- Créer les hôtes dans Zabbix
- Leur associer un **template** et un **groupe** automatiquement

---

#### Créer un Trigger et un Action d'Alerte

Dans Zabbix 7, les **actions** liées à des **triggers** sont configurées séparément depuis l’onglet `Alerte > Actions > Trigger actions`.

---

##### Étape 1 : Créer un Trigger

1. Aller dans `Configuration > Hosts`
2. Sélectionner l’hôte cible (ex. `srv-web-01`)
3. Onglet `Triggers` → **Create trigger**
4. Renseigner les champs :
   - **Name** : `CPU > 80% pendant 5 min`
   - **Severity** : `High`
   - **Expression** :
     - Cliquer sur **Add**
     - Choisir un item : `system.cpu.util`
     - Fonction : `last(300)`
     - Opérateur : `>`
     - Valeur : `80`
     - Cliquer sur **Insert**
   - Exemple généré :  
     ```
     {srv-web-01:system.cpu.util.last(300)}>80
     ```
5. Cliquer sur **Add**

---

##### Étape 2 : Créer une Action liée au Trigger

1. Aller dans `Alerte > Actions > Trigger actions`
2. Cliquer sur **Create action**
3. Renseigner les champs :
   - **Name** : `Alerte CPU haute`
   - **Conditions** :
     - `Trigger severity = High`
     - `Trigger name contains CPU`
   - **Operations** :
     - **Default operation** :
       - Cliquer sur **Add step**
       - **Send message to users** :
         - Sélectionner un groupe d'utilisateurs (ex. Admins)
         - Choisir le moyen de notification (Ms Teams , Telegram, etc.)


## V. Guide d’Installation de l’Environnement de Sauvegarde Automatisée

Ce guide décrit la mise en place d’un système de sauvegarde automatisé entre plusieurs clients, une machine de sauvegarde et une machine de contrôle (`proxy1`) utilisant Ansible, BorgBackup et des scripts personnalisés. Lors du lancement de l'infrastructure via l'Ansible master, C'est vms sont déployé en même temps que les autres.

---

### I. Infrastructure

#### Rôles des machines :

| Machine      | Rôle                                    |
| ------------ | --------------------------------------- |
| `proxy1`     | Machine centrale avec dépôt BorgBackup  |
| `sauvegarde` | Machine de contrôle (Ansible + Vagrant) |
| `clientX`    | Machines à sauvegarder                  |

---

### II. Configuration des Machines

#### 1. Lancement des VMs avec Vagrant

Sur `sauvegarde1` :

```bash
cd ~/Bureau/sauvegarde.ansible/
vagrant up
```

---

#### 2. Connexion automatique en SSH : échange de clés

Sur `sauvegarde1`, exécuter :

```bash
bash scripts/send_keys.sh
```

Cela :

* génère une clé SSH pour l'utilisateur `vagrant` (si elle n'existe pas),
* copie la **clé publique vers l’utilisateur `backup` de `proxy1`**,
* prépare la connexion SSH pour permettre les sauvegardes sans mot de passe.

---

### III. Déploiement Automatisé avec Ansible

#### 1. Vérifier que les machines sont accessibles

```bash
ansible -i inventory.ini all -m ping
```

---

#### 2. Exécuter le playbook principal

Depuis `sauvegarde1` :

```bash
ansible-playbook -i inventory.ini node.yml
```

Ce playbook :

* Lance les VMs avec `vagrant up`.
* Attends la connexion SSH.
* Appelle :

  * `config_proxy.yml` pour la machine `proxy1`
  * `config_sauv.yml` pour `sauvegarde1`
  * `agent_zabbix.yml` pour installer les agents sur `proxy1` et `sauvegarde1`

---

### IV. Déclenchement et Planification des Sauvegardes

#### 1. Déclencher manuellement les sauvegardes

```bash
ansible-playbook -i inventory.ini trigger_backup.yml
```

Ce playbook :

* Exécute les scripts de sauvegarde (`backup_files.sh` et `backup_bdd.sh`) sur chaque client.
* Ajoute des tâches cron pour automatiser :

  * Sauvegarde de fichiers chaque nuit à 2h.
  * Sauvegarde BDD toutes les 6h.
* Vérifie le contenu du dépôt Borg depuis `proxy1`.

---

### V. Fichier `inventory.ini` (exemple générique)

```ini
[sauv]
sauvegarde1

[proxy]
proxy1

[clients]
client1
client2
client3

[all:vars]
ansible_user=vagrant
ansible_ssh_private_key_file=/home/vagrant/.ssh/id_rsa
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
```

---

### VI. Fichier `machines.csv` (référencé dans les scripts)

```csv
hostname,ip,role
client1,192.168.236.*,client
client2,192.168.234.*,client
client3,192.168.232.*,client
```

---

### VII. Résultat attendu

* Toutes les machines **client** sauvegardent leurs fichiers et bases via Borg vers `proxy1`.
* L’infrastructure est **automatisée**, **supervisée** (Zabbix), et extensible à d’autres sous-réseaux.
* Le contrôle est centralisé sur `sauvegarde1`.

---
- Modifiez le mot de passe par défaut après la première connexion
- Vérifiez les logs en cas de problème dans `/var/log/zabbix/`

#### Liens utiles

- [Documentation officielle Zabbix](https://www.zabbix.com/documentation/)

---
