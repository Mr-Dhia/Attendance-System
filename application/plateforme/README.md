# 🛡️ BioPulse — Système Intelligent de Gestion de Présence & Pointage Biométrique IoT

[![Stack](https://img.shields.io/badge/Stack-Fullstack_IoT-0284c7?style=for-the-badge)](https://github.com)
[![React](https://img.shields.io/badge/Frontend-React_19_|_Vite_|_MUI_v9-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_|_Express_5_|_MongoDB-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org)
[![IoT](https://img.shields.io/badge/Hardware-ESP32_|_Capteur_Biométrique-FF6F00?style=for-the-badge&logo=espressif)](https://www.espressif.com)

**BioPulse** est une plateforme complète et moderne de gestion des temps et des présences en entreprise. Elle combine un **terminal de pointage physique IoT (ESP32)** équipé d'un capteur biométrique d'empreintes digitales et un **dashboard web SaaS haut de gamme** (React, Express, MongoDB).

---

## 📸 Aperçu de l'Architecture System

```mermaid
graph TD
    subgraph Hardware ["Hardware / IoT (Borne Physique)"]
        ESP[Terminal ESP32]
        FP[Capteur d'Empreinte Biométrique]
        OLED[Écran d'Affichage & LEDs]
        ESP -->|Lecture| FP
        ESP -->|Feedback| OLED
    end

    subgraph Network ["Réseau & Communication"]
        UDP[Découverte UDP BroadCast]
        HTTP[API REST HTTP/JSON]
    end

    subgraph Backend ["Serveur Backend Node.js / Express"]
        SERVER[Serveur Express.js]
        UDP_LISTEN[Écouteur UDP Discovery]
        AUTH[Middleware Auth & JWT]
        DB[(Base de données MongoDB)]
        SERVER --> AUTH
        SERVER --> DB
        UDP_LISTEN --> SERVER
    end

    subgraph Frontend ["Web Dashboard SaaS (React 19)"]
        DASH[Tableau de Bord Administrateur]
        STATS[Statistiques & Recharts]
        EMP[Gestion du Personnel]
        DASH --> STATS
        DASH --> EMP
    end

    ESP -->|Découverte automatique| UDP
    UDP --> UDP_LISTEN
    ESP -->|Envoi des pointages & Enrôlement| HTTP
    HTTP --> SERVER
    DASH <-->|API REST Axios| SERVER
```

---

## ⚡ Flux Biométrique & Découverte Réseau

```mermaid
sequenceDiagram
    autonumber
    participant ESP as Borne ESP32
    participant Server as Serveur Express (Node.js)
    participant DB as MongoDB
    participant React as Dashboard React

    Note over ESP, Server: 1. Découverte Réseau Automatique
    ESP->>Server: UDP Broadcast (Ping Découverte)
    Server-->>ESP: Réponse UDP (IP Serveur & Handshake)

    Note over ESP, React: 2. Scan Empreinte & Pointage
    ESP->>ESP: Scan de l'empreinte digitale
    ESP->>Server: POST /api/fingerprint/verify (Fingerprint ID + Key)
    Server->>DB: Recherche de l'employé & Création du pointage (In/Out)
    DB-->>Server: Pointage enregistré avec heure exacte
    Server-->>ESP: HTTP 200 OK (Nom de l'employé + Statut)
    Server->>React: Notification / Refresh temps réel
```

---

## 💼 Fiche d'Étude de Cas (Portfolio / Freelance Showcase)

> **Vous pouvez utiliser cette section pour présenter ce projet sur votre profil freelance (Malt, LinkedIn, Upwork) ou dans vos propositions commerciales.**

### 📌 Contexte & Problématique
Les entreprises cherchent à automatiser le suivi des présences de leurs collaborateurs, éliminer le pointage manuel sur papier et sécuriser les accès via des identifiants biométriques infalsifiables, tout en disposant d'un tableau de bord clair pour la direction RH.

### 💡 Solution Apportée par BioPulse
- **Pointeuse Matérielle Autonome** : Conçue sur microcontrôleur ESP32 avec capteur biométrique d'empreinte, écran d'affichage TFT/OLED et signaux lumineux LED.
- **Auto-Découverte sans configuration** : Le terminal trouve automatiquement le serveur backend sur le réseau local via un protocole UDP propriétaire.
- **Plateforme Web Enterprise** :
  - **Dashboard analytique** : Taux d'assiduité, présences en temps réel, retards et absences calculés automatiquement.
  - **Gestion complète des employés & départements** : Enrôlement biométrique guidé depuis le web.
  - **Gestion des plannings & horaires** : Attribution d'horaires de travail hebdomadaires et tolérances de retard.

### 🚀 Valeur Ajoutée Technique
- **Stack Moderne** : React 19, Vite, Material UI (Custom Dark Glassmorphic Theme), Node.js, Express, MongoDB.
- **Sécurité** : Authentification par Cookie HTTP-Only + JWT, validation par clé matérielle `DEVICE_KEY`, sanitisation des entrées.
- **Performance** : Temps de réponse biométrique < 300ms entre le scan physique et l'affichage web.

---

## 🛠️ Spécification des Endpoints d'API REST

| Méthode | Endpoint | Description | Authentification |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Connexion Administrateur & émission de cookie JWT | Publique |
| `GET` | `/api/auth/me` | Vérification de la session active | Cookie Token |
| `GET` | `/api/employees` | Liste complète des employés avec statut biométrique | Cookie Token |
| `POST` | `/api/employees` | Création d'un nouvel employé | Cookie Token |
| `POST` | `/api/fingerprint/enroll` | Déclenchement de l'enrôlement biométrique | Device Key / Cookie |
| `POST` | `/api/fingerprint/verify` | Enregistrement d'un pointage depuis la borne ESP32 | Device Key |
| `GET` | `/api/attendance` | Historique et rapports de présence filtrables | Cookie Token |
| `GET` | `/api/dashboard/stats` | Métriques et statistiques globales pour Recharts | Cookie Token |

---

## 🚀 Guide de Démarrage Rapide

### Prérequis
- **Node.js** v18+ et **npm** v9+
- **MongoDB** (En local `mongodb://127.0.0.1:27017` ou MongoDB Atlas)

### Installation & Lancement

1. **Cloner le dépôt et installer les dépendances** :
   ```bash
   # À la racine du projet
   npm install
   ```

2. **Configurer l'environnement** :
   Copier le fichier d'exemple et ajuster les variables :
   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Lancer le serveur backend & l'application React en simultané** :
   ```bash
   npm run dev
   ```
   * **Backend API** : `http://localhost:5000`
   * **Dashboard React** : `http://localhost:5173`

---

## 📄 Licence
Ce projet est sous licence MIT — Libre d'utilisation et de personnalisation pour des besoins commerciaux ou de portfolio.
