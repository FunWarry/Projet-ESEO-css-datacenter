[liens vers la documentation d'installation complette](http://20.86.62.213:3000/gevraima/Projet-ESEO/wiki/Guide_installation)

# Guide d'installation Complet du système - ESEO Teaching Cloud

## I. Guide d'installation d'OPNSense

### Prérequis :

* Un ordinateur avec :
    * \> 4 cœurs
    * \> 8 Go de RAM
    * \> 40 Go d'espace libre
    * 2 cartes Ethernet
    * Une connexion vers le routeur de l'ESEO
    * Une connexion vers le switch de votre LAN

### Obtention de l'ISO OPNSense :

1.  Allez sur [opnsense.org/downloads](https://opnsense.org/downloads)
2.  Sélectionnez l'image DVD.
3.  Après le téléchargement, lancez la commande `bzip2 -d OPNsense-<nomdefichier>.bz2` en ajustant `<nomdefichier>` avec le nom du fichier téléchargé.

### Mise en place de VirtualBox :

4.  Sur VirtualBox, créez une nouvelle machine FreeBSD (64-bit) en sélectionnant l'ISO décompressé précédemment.
5.  Dans l'onglet "Hardware", mettez au minimum 2 Go de RAM et 2 cœurs de CPU. Si possible, utilisez 8 Go et 4 cœurs.
6.  Dans l'onglet "Hard Disk", mettez au minimum 40 Go. Si possible, utilisez 120 Go.
7.  Cliquez sur "Finish".
8.  Dans le menu principal de VirtualBox, cliquez sur "Configuration".
9.  Donnez deux interfaces bridge à OPNSense pour chaque interface réseau : une pour le LAN (enp1s0) et l'autre pour le WAN (eno1).

### Installation d'OPNSense :

10. Lancez la machine virtuelle.
11. L'invite de commande peut vous demander d'assigner des interfaces. WAN doit être l'interface connectée à l'extérieur de votre réseau, et LAN celle connectée à l'intérieur.
12. Attendez que l'invite vous demande un mot de passe.
13. Entrez le mot de passe "installer".
14. Vous devriez voir un menu pour choisir la disposition du clavier. Utilisez la flèche du bas pour sélectionner "French", puis validez avec Tab et "Continue".
15. Dans le menu suivant, choisissez "ZFS".
16. Sélectionnez le disque.
17. Confirmez que vous voulez continuer avec le swap de la taille recommandée.
18. Confirmez que vous voulez effacer le contenu du disque.

Le logiciel va maintenant installer OPNSense. Cela peut prendre un certain temps.

19. L'interface vous donnera deux options : changer le mot de passe ou continuer l'installation. Choisissez "Continue". Le mot de passe pourra être modifié plus tard.
20. Après le redémarrage, éteignez la machine en tapant "5" dans l'invite de commande.
21. Allez dans les paramètres de la machine sur VirtualBox, et dans l'onglet "Storage", retirez le disque ISO.
22. Relancez la machine virtuelle.
23. Depuis votre réseau, accédez à l'interface web à l'adresse indiquée dans l'invite de commande.
24. Connectez-vous avec le mot de passe que vous avez choisi.
25. Allez dans `System -> Firmware -> Status`.

### Fichier de Configuration OPNSense
Le fichier de configuration OPNSense se trouve dans le dossier "Configuration Opnsense". Pour importer cette configuration :
1.  Se connecter à l'interface web d'OPNSense.
2.  Aller dans `System` -> `Configuration` -> `Backup / Restore`.
3.  Choisir l'option "Restore Configuration".
4.  Sélectionner le fichier de configuration à importer.
5.  Cliquer sur "Restore".
6.  Redémarrer le système.


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

	![Description de l'image](http://20.86.62.213:3000/gevraima/Projet-ESEO/raw/commit/b74c1875816d3d1f7da28785210a8f82089c980d/plan%20de%20branchement.png)
    
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
    * Copiez et collez le script de configuration du routeur dans le terminal (clique droit pour coller sur une console putty).
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

[Script du routeur](http://20.86.62.213:3000/gevraima/Projet-ESEO/src/branch/réseau/script%20routeur%20projet.txt)

[Script du switch](http://20.86.62.213:3000/gevraima/Projet-ESEO/src/branch/réseau/script%20switch%20projet.txt)

Se trouve dans le dossier "scripte réseau" pour le rendu Incrément 1.

---

## III. Guide d'installation des VMs : Ansible Master - Projet ESEO
Ce dossier met en place une machine virtuelle nommée `ansibleMaster` à l'aide de **Vagrant** et **VirtualBox**, destinée à l'automatisation du déploiement de services via **Ansible**.

### Structure du Dossier

```
ansibleMaster/
├── ansible/         # Contient les playbooks, inventaires et rôles Ansible
├── logs/            # Dossier pour stocker les journaux d’exécution
├── scripts/         # Scripts shell utilisés pour la configuration système
├── Vagrantfile      # Fichier de configuration Vagrant

````

### Description du `Vagrantfile`

- **Box utilisée** : `chavinje/fr-book-64`
- **Nom de la VM** : `ansibleMaster`
- **Adresse IP publique** : `192.168.238.13`
- **Ressources** :
  - CPU : 2 cœurs
  - RAM : 2048 Mo

### Provisioning

Au démarrage, la VM est configurée automatiquement avec :

- Activation de l’authentification SSH par mot de passe
- Configuration réseau statique (`192.168.238.13/29`)
- Redéfinition de la passerelle par défaut (`192.168.238.9`)
- Configuration du DNS (`192.168.4.2`)
- Exécution de deux scripts :
  - `scripts/config_sys.sh` : configuration système en crééant l'utilisateurs ansible et un alias master pour contrôler l'infra 
  - `scripts/send_keys.sh` : déploiement de clés vers les hotes (Firewall, DNS, Web, Bdd, Supervision, Sauvegarde).

### Lancement du projet

1. **Prérequis** :
   - [Vagrant](https://www.vagrantup.com/downloads)
   - [VirtualBox](https://www.virtualbox.org/wiki/Downloads)

2. **Démarrage** :

   Depuis le dossier `ansibleMaster` :

```bash
vagrant up
````

Cela télécharge l’image, crée la VM, configure le réseau et exécute les scripts.

3. **Connexion à la VM** :

```bash
vagrant ssh ansibleMaster
```
4. **Contrôle des serveurs physique** :
Se connecter avec l'utilisateur ansible qui a pour mot de passe N3twork! et exécuter

```bash
master
```

# Ancienne version





























### 1. Déploiement d'un Cluster Galera avec HAProxy via Vagrant  

Permet de déployer **automatiquement un cluster Galera** pour le gestionnaire de base de données **MariaDB**, accompagné d'un **load balancer HAProxy**. L'installation et la configuration sont réalisées à l’aide de **Vagrant** et de plusieurs scripts bash.  

#### Qu'est-ce que Galera ?  

**Galera Cluster** est une solution de **réplication synchrone** pour MariaDB qui permet de :  

- [x] Assurer la haute disponibilité des bases de données.  
- [x] Répliquer les données en **temps réel** entre plusieurs nœuds.
- [x] Offrir une **tolérance aux pannes** en cas de défaillance d’un serveur.
- [x] Permettre un **scaling horizontal** en répartissant la charge sur plusieurs serveurs.  

Dans ce projet, **trois machines** seront configurées pour former un **cluster Galera**, avec un **HAProxy** en guise de load balancer pour gérer les connexions de manière équilibrée.  

#### Déploiement Automatisé  

**Pré-requis :**  
- **Vagrant** et **VirtualBox** doivent être installés avant de lancer le script.  

Le **Vagrantfile** est conçu pour **déployer 4 machines** et exécuter automatiquement les scripts suivants :  

1. `script_host` (variable dans le Vagrantfile)  
Associe un **nom d’hôte** à chaque machine en mettant à jour le fichier `/etc/hosts` :  
```sh
echo '192.168.234.3 galeranode1' >> /etc/hosts
echo '192.168.234.4 galeranode2' >> /etc/hosts
echo '192.168.234.5 galeranode3' >> /etc/hosts
echo '192.168.234.6 haproxynode1' >> /etc/hosts
```  

2. `script_ssh` (variable dans le Vagrantfile)  
Active la **connexion SSH** avec authentification pour chaque machine.  

3. `config_sys.sh` (script Bash dans `scripts/`)  
Configure l’interface réseau **enp0s8** avec le bon **masque** en fonction de la machine.  

4. `script_route` (variable dans le Vagrantfile)  
Supprime la **route NAT par défaut** et la remplace par la **passerelle appropriée**.  

5. `install_galera.sh` (script Bash dans `scripts/`)  
Installe et configure **Galera Cluster** sur les **trois machines Galera** :  
Déploie **MariaDB** et **Galera** sur chaque nœud.  
Initialise le **cluster Galera** sur `galeranode1`.  
Crée **deux utilisateurs** (`etudiant1`, `etudiant2`).  
Crée **deux bases de données** (`etudiant1`, `etudiant2`).  

6. `install_ha.sh` (script Bash dans `scripts/`)  
Installe et configure **HAProxy** sur `haproxynode1` :  
Déploie un **load balancer** pour distribuer la charge entre les nœuds Galera.  
Facilite l’accès aux bases de données en redirigeant les connexions automatiquement.  

---

#### Lancer le déploiement  

***A faire dans le répertoire où se situe le vagrantfile pour le déploiment des vms galera***

Pour **démarrer** toutes les machines et exécuter les scripts automatiquement :  
```sh
vagrant up
```  

---

#### Remarques  

- Les configurations peuvent être personnalisées en modifiant les fichiers de configuration MariaDB et HAProxy.  

**Pourquoi utiliser HAProxy ?**  
HAProxy assure une **répartition équilibrée** des connexions aux bases de données et améliore la **disponibilité** du cluster.  

**Où voir les logs ?**  
- Logs MariaDB/Galera : `/var/log/mysql/error.log`  
- Logs HAProxy : `/var/log/haproxy.log`  

---

#### Références  

🔗 [Documentation Galera Cluster](https://www.it-connect.fr/comment-mettre-en-place-mariadb-galera-cluster-sur-debian-11/)  
🔗 [Documentation HAProxy](https://www.haproxy.com/blog/haproxy-configuration-basics-load-balance-your-servers)  

---

### 2. Déploiement d'un Serveur DNS - Projet ESEO Teaching Cloud  

Permet de déployer automatiquement une machine virtuelle qui servira de **serveur DNS** au sein d’un réseau. L’installation et la configuration sont réalisées à l’aide de **Vagrant** et de plusieurs scripts bash.  

#### Pourquoi un serveur DNS ?  

Un **serveur DNS (Domain Name System)** est un élément clé dans un réseau. Il permet de **traduire les noms de domaine en adresses IP**, facilitant ainsi l'accès aux services sans avoir à retenir des adresses numériques complexes.  

Dans ce projet, nous allons configurer un serveur DNS nommé **srv-dns.dns.local** en utilisant **BIND9**, un serveur DNS largement utilisé.  

#### Déploiement Automatisé  

Le déploiement repose sur un fichier **Vagrantfile** qui configure la machine et exécute automatiquement les scripts suivants :  

1. **script_ssh** (variable dans le Vagrantfile)  
   - Active l’authentification SSH pour permettre la connexion sécurisée à la machine.  

2. **install_bind.sh** (script Bash dans `scripts/`)  
   - Installe et configure **BIND9** pour transformer la machine en un **serveur DNS nommé srv-dns.dns.local**.
   
3. **config_sys.sh** (script Bash dans `scripts/`)  
   - Configure l’interface réseau **enp0s8** avec le bon masque en fonction de la machine.  

4. **script_route** (variable dans le Vagrantfile)  
   - Supprime la route NAT par défaut et la remplace par la **passerelle appropriée** pour assurer une bonne connectivité.  
 

#### Lancer le déploiement  

***A faire dans le répertoire où se situe le vagrantfile pour le déploiment des de la VM DNS***

Pour déployer la machine, il suffit d’exécuter :  

```bash
vagrant up
```

Cela créera et configurera automatiquement le serveur DNS.  


#### Remarque  

- Vous pouvez personnaliser la configuration DNS en modifiant le fichier de configuration de **BIND9** après l’installation.

---

### 3. Déploiement des Machines Étudiants

Ce projet utilise **Vagrant** pour déployer deux machines virtuelles, **etudiant1** et **etudiant2**. Lors du déploiement, quatre scripts seront exécutés afin de configurer les machines, définir les paramètres réseau, et d'installer un serveur web avec du contenu spécifique sur chaque machine.

#### Structure
```
.
├── Vagrantfile
├── scripts/
│   ├── config_sys.sh
│   ├── install_web.sh
```

#### Déploiement

***A faire dans le répertoire où se situe le vagrantfile pour le déploiment des vms etudiant***

Pour déployer les machines, exécutez simplement la commande suivante :
```bash
vagrant up
```
Cela créera et configurera les machines virtuelles avec les paramètres définis.

#### Scripts déployés
Quatre scripts principaux sont exécutés lors du déploiement :

1. **Activation de la connexion SSH** (`script_ssh`)
Ce script, défini sous forme de variable dans le `Vagrantfile`, active la connexion SSH avec authentification pour les machines virtuelles.

2. **Configuration réseau** (`config_sys.sh`)
- Localisé dans le répertoire `scripts/`
- Configure l'interface **bridge** (`enp0s8`) avec le bon masque réseau en fonction de la machine.

3. **Gestion des routes** (`script_route`)
- Défini sous forme de variable dans le `Vagrantfile`
- Supprime la route NAT par défaut et la remplace par la passerelle par défaut du serveur concerné.

4. **Installation du serveur web** (`install_web.sh`)
- Localisé dans le répertoire `scripts/`
- Déploie un serveur web sur chaque machine et configure le contenu :
  - **etudiant1** : Installe **phpMyAdmin** et le met à disposition sur le port **80**
  - **etudiant2** : Déploie une page HTML simple sur le port **80**

#### Accès aux Machines
Une fois le déploiement terminé, vous pouvez accéder aux machines via SSH :
```bash
vagrant ssh etudiant1
vagrant ssh etudiant2
```
Ou visiter les sites déployés dans un navigateur :
- **etudiant1** : [http://192.168.232.3] (phpMyAdmin)
- **etudiant2** : [http://192.168.232.4] (Page HTML)

---

### 4. Déploiement de la Machine Zabbix server

Ce projet utilise **Vagrant** pour déployer deux machines virtuelles, **etudiant1** et **etudiant2**. Lors du déploiement, quatre scripts seront exécutés afin de configurer les machines, définir les paramètres réseau, et d'installer un serveur web avec du contenu spécifique sur chaque machine.

#### Déploiement

***A faire dans le répertoire où se situe le vagrantfile pour le déploiment de la VM serveur Zabbix***

Pour déployer les machines, exécutez simplement la commande suivante :
```bash
vagrant up
```
Cela créera et configurera les machines virtuelles avec les paramètres définis.

#### Accès aux Machines

Une fois l'installation terminée, accédez à l'interface web à l'adresse:
```
http://adresse-ip-serveur/zabbix
```

Identifiants par défaut:
- Utilisateur: Admin
- Mot de passe: zabbix

#### Notes importantes

- Remplacez 'password' par un mot de passe sécurisé
- Modifiez le mot de passe par défaut après la première connexion
- Vérifiez les logs en cas de problème dans `/var/log/zabbix/`

#### Liens utiles

- [Documentation officielle Zabbix](https://www.zabbix.com/documentation/)

---
