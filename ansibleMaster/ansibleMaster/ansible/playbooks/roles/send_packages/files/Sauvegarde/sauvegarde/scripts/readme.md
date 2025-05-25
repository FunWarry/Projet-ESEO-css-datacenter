## Sauvegarde automatique des bases MySQL avec BorgBackup

Ce script Bash permet de réaliser des sauvegardes automatiques de bases de données **MySQL** provenant de plusieurs serveurs distants. Il lit un fichier CSV listant les machines cibles (nom + adresse IP), effectue un **dump complet de toutes les bases de données**, et envoie ensuite ces dumps vers un serveur **proxy** via **BorgBackup**, un outil de sauvegarde sécurisé, dédupliqué et versionné.

---

### Fonctionnement général

Le script commence par définir quelques variables de configuration essentielles :  
- le chemin du **fichier CSV** contenant la liste des serveurs à sauvegarder,  
- le fichier de **logs** pour suivre l’état des sauvegardes,  
- les identifiants MySQL (utilisateur `root`, mot de passe `network`),  
- l’adresse du **serveur proxy** où seront stockées les sauvegardes,  
- le **répertoire Borg** distant qui recevra les archives.

Chaque ligne du fichier CSV est traitée une par une. Pour chaque machine :
1. Un **dump MySQL** complet est généré localement via `mysqldump --all-databases`.
2. Ce fichier est temporairement stocké dans un dossier dédié.
3. Le dump est ensuite **envoyé et archivé** dans un dépôt distant via la commande `borg create`.
4. Enfin, le fichier temporaire est supprimé et un message de log est enregistré.

---

### Sauvegarde avec Borg

Au lieu de transférer les fichiers avec `scp`, ce script utilise **BorgBackup** pour :
- compresser et dédupliquer les sauvegardes,
- créer une archive horodatée pour chaque machine (`nom-machine-mysql-YYYY-MM-DD_HH-MM-SS`),
- conserver un historique des versions,
- garantir une **intégrité des données**.

---

### Format du fichier CSV attendu

Le fichier `machines.csv` doit contenir deux colonnes séparées par des virgules :  
- le **nom** de la machine (utilisé pour nommer les dumps),
- son **adresse IP**.

**Exemple :**
```csv
webserver1,192.168.1.10
dbserver2,192.168.1.11
``