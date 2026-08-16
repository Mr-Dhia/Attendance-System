# 🛡️ BioPulse — Intelligent IoT Biometric Attendance System & SaaS Web Platform

[![Stack](https://img.shields.io/badge/Stack-IoT_&_Fullstack_Web-0284c7?style=for-the-badge)](https://github.com/Mr-Dhia/Attendance-System)
[![ESP32](https://img.shields.io/badge/Hardware-ESP32_|_Biometric_Fingerprint-FF6F00?style=for-the-badge&logo=espressif)](https://www.espressif.com)
[![React](https://img.shields.io/badge/Frontend-React_19_|_Vite_|_MUI_v9-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_|_Express_5_|_MongoDB-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org)

**BioPulse** is an enterprise-grade time & attendance tracking platform that seamlessly integrates a **physical IoT biometric terminal (ESP32 micro-controller)** with a **premium dark glassmorphic SaaS web dashboard** (React 19, Express, MongoDB).

---

## 📁 Repository Structure

```text
├── Hardware/                       # ESP32 C++ / Arduino firmware source code
│   └── pointeuse/                  # Hardware modules: fingerprint sensor, TFT/OLED display, LEDs, UDP/HTTP networking
├── application/plateforme/         # Fullstack Web Application
│   ├── backend/                    # Express 5 REST API, MongoDB Mongoose, JWT Auth, UDP Discovery Listener
│   └── attendance-system/          # SaaS Web Dashboard (React 19, Material UI, Tailwind CSS, Recharts)
```

---

## 📸 Overall System Architecture

```mermaid
graph TD
    subgraph Hardware ["Hardware / IoT (ESP32 Physical Terminal)"]
        ESP[ESP32 Microcontroller]
        FP[Biometric Fingerprint Sensor]
        OLED[Display & Status LEDs]
        ESP -->|Biometric scan| FP
        ESP -->|Status feedback| OLED
    end

    subgraph Network ["Networking & Communication"]
        UDP[UDP Broadcast Network Discovery]
        HTTP[HTTP/JSON REST API]
    end

    subgraph Backend ["Node.js / Express Backend Server"]
        SERVER[Express.js Server]
        UDP_LISTEN[UDP Discovery Listener]
        AUTH[Auth & JWT Middleware]
        DB[(MongoDB Database)]
        SERVER --> AUTH
        SERVER --> DB
        UDP_LISTEN --> SERVER
    end

    subgraph Frontend ["SaaS Web Dashboard (React 19)"]
        DASH[HR Admin Dashboard]
        STATS[Analytics & Recharts]
        EMP[Employee & Biometric Management]
        DASH --> STATS
        DASH --> EMP
    end

    ESP -->|Auto-discovery| UDP
    UDP --> UDP_LISTEN
    ESP -->|Check-in & Enrollment| HTTP
    HTTP --> SERVER
    DASH <-->|Axios REST API| SERVER
```

---

## ⚡ Biometric Check-in Sequence

```mermaid
sequenceDiagram
    autonumber
    participant ESP as ESP32 Terminal
    participant Server as Express Server (Node.js)
    participant DB as MongoDB
    participant React as React Dashboard

    Note over ESP, Server: 1. Zero-Config UDP Network Auto-Discovery
    ESP->>Server: UDP Broadcast (Discovery Ping)
    Server-->>ESP: UDP Response (Server IP & Handshake)

    Note over ESP, React: 2. Biometric Scan & Real-Time Logging
    ESP->>ESP: Scan fingerprint sensor
    ESP->>Server: POST /api/fingerprint/verify (Fingerprint ID + Device Key)
    Server->>DB: Find Employee & Record Attendance Log (In/Out)
    DB-->>Server: Saved attendance entry with timestamp
    Server-->>ESP: HTTP 200 OK (Employee Name + Status)
    Server->>React: Real-time dashboard update & notification
```

---

## 💼 Freelance Portfolio Case Study

> **Use this section as a reference case study in freelance proposals and client pitches (Upwork, Malt, LinkedIn).**

### 📌 Context & Business Problem
Modern enterprises require automated, tamper-proof workforce attendance tracking. Manual paper logs or badge sharing lead to inaccuracies, whereas BioPulse provides biometric verification connected directly to a central HR management system.

### 💡 BioPulse Solution
- **Autonomous IoT Terminal**: ESP32 micro-controller featuring an optical fingerprint sensor, status LEDs, and screen notifications.
- **Zero-Config Network Auto-Discovery**: Custom UDP broadcast protocol allowing hardware units to detect the backend server automatically without manual IP configuration.
- **Enterprise Web Platform**:
  - **Real-Time HR Analytics**: Live attendance feed, automated late arrivals, and absence tracking via Recharts charts.
  - **Employee & Department Management**: Web-guided biometric enrollment.
  - **Work Schedules & Shift Assignment**: Custom weekly shifts and grace period tolerance settings.

### 🚀 Technical Stack & Performance
- **Hardware Firmware**: ESP32 C++, Arduino framework, Adafruit Fingerprint Library.
- **Frontend**: React 19, Vite, Material UI (Custom Glassmorphic Theme), Recharts, Tailwind CSS.
- **Backend**: Node.js, Express 5, MongoDB (Mongoose), JWT authentication, Nodemailer.
- **Performance**: Sub-300ms latency from physical fingerprint scan to live web dashboard update.

---

## 🛠️ REST API Specification

| Method | Endpoint | Description | Authentication |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Administrator login & JWT cookie issue | Public |
| `GET` | `/api/auth/me` | Check active admin session | Cookie Token |
| `GET` | `/api/employees` | List employees with biometric status | Cookie Token |
| `POST` | `/api/fingerprint/enroll` | Trigger web-guided fingerprint enrollment | Device Key / Cookie |
| `POST` | `/api/fingerprint/verify` | Record check-in/out from ESP32 terminal | Device Key |
| `GET` | `/api/dashboard/stats` | Global HR attendance statistics | Cookie Token |

---

## 🚀 Quick Start Guide

### 1. Clone the repository
```bash
git clone https://github.com/Mr-Dhia/Attendance-System.git
cd Attendance-System/application/plateforme
```

### 2. Install & Run
```bash
npm install
cp backend/.env.example backend/.env
npm run dev
```
* **Backend API**: `http://localhost:5000`
* **React Dashboard**: `http://localhost:5173`

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
