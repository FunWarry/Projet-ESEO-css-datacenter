# Application de Déploiement de VMs

Application web complète pour le déploiement et la gestion de machines virtuelles (VMs) avec Vagrant et Ansible, offrant une interface utilisateur intuitive pour gérer des environnements virtuels complexes.

## 🌟 Fonctionnalités Principales

### Déploiement de VMs
- Interface utilisateur intuitive pour le déploiement de VMs
- Support de différents types de VMs :
  - Serveurs Java/Tomcat
  - Piles LAMP complètes
  - Bases de données MariaDB
  - Bases de données PostgreSQL
- Configuration personnalisable (RAM, CPU)
- Attribution automatique d'IP fixes par type de VM

### Gestion des VMs
- Vue d'ensemble des VMs en cours d'exécution
- Suppression sélective de plusieurs VMs
- Affichage détaillé des spécifications techniques

## 🖥 Installation sur Debian 12

### 1. Mettre à jour le système
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates
```

### 2. Installer Node.js 18.x

Pour lancer le système, il vous faut installer Node.js 18.x 
ainsi que npm.

### 3. Démarrer l'application
```bash
# Installer les dépendances Node.js
npm install --production

# Démarrer l'application en production
npm start
```

### 4.**Accéder à l'interface avec l'application en local**
   Ouvrez votre navigateur à l'adresse : [http://localhost:3000](http://localhost:3000)

## 🏗 Architecture Technique

### Composants Principaux
- **Frontend** : Interface utilisateur réactive (HTML5, CSS3, JavaScript)
- **Backend** : API REST avec Node.js et Express
- **Base de données** : MySQL pour la persistance des données
- **Virtualisation** : Vagrant avec VirtualBox
- **Provisioning** : Ansible pour la configuration automatique

### Schéma d'Adressage Réseau
| Type de VM | Plage d'IP | Usage |
|------------|------------|-------|
| Web/Java | 192.168.232.10 - 192.168.233.254 | Serveurs d'applications |
| Base de données | 192.168.234.10 - 192.168.234.254 | Bases de données |

## 📁 Structure du Projet

```
CSS-deployment/
├── .github/               # Configuration CI/CD GitHub
├── db/                    # Module de base de données
│   ├── connection.js      # Gestion des connexions DB
│   └── operations.js      # Opérations CRUD
├── logs/                  # Journaux d'application
├── public/                # Fichiers statiques
│   ├── assets/            # Images, polices, etc.
│   ├── css/               # Feuilles de style
│   ├── js/                # Scripts frontend
│   └── *.html             # Pages HTML
├── src/
│   ├── server/           # Code serveur
│   │   ├── api/           # Contrôleurs API
│   │   ├── middleware/    # Middleware Express
│   │   ├── services/      # Logique métier
│   │   └── utils/         # Utilitaires
│   └── config/            # Configuration
└── vagrantfiles/          # Configurations Vagrant
    ├── java/              # Machines Java/Tomcat
    ├── lamp/              # Piles LAMP
    └── database/          # Bases de données
```