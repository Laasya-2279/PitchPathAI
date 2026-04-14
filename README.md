# 🏟️ PitchPath AI — Smart Stadium Navigation

> AR-powered navigation, voice AI assistant, and real-time crowd analytics for smart stadiums.
> Built for venues like Narendra Modi Stadium (132,000 capacity).

![PitchPath AI](https://img.shields.io/badge/PitchPath-AI-6366f1?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-010101?style=flat-square&logo=socketdotio)
![Three.js](https://img.shields.io/badge/Three.js-AR-000000?style=flat-square&logo=threedotjs)

---

## ✨ Features

- 🧭 **AR Navigation** — Camera-based directional arrows with Three.js overlay
- 🎤 **Voice Assistant** — Say "Take me to Block M" for hands-free navigation
- 🔥 **Live Heatmap** — Real-time crowd density across 18 stadium blocks
- ⚡ **Smart Routing** — Dijkstra's algorithm with crowd-aware path optimization
- 🌙 **Dark/Light Themes** — Sleek adaptive UI with glassmorphism design
- 📱 **Mobile-First** — Responsive design optimized for on-the-go use

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A modern browser (Chrome/Edge recommended for voice features)

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start the Backend

```bash
cd backend
npm start
```

The backend runs on `http://localhost:3001` with:
- REST API for routing, voice processing, and crowd data
- Socket.io for real-time crowd density updates (every 3 seconds)

### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend runs on `http://localhost:3000`.

### 4. Open in Browser

Navigate to `http://localhost:3000` and explore!

---

## 📱 Screens

| Screen | Description |
|--------|-------------|
| **Dashboard** | Hero section, quick actions, live crowd preview |
| **AR Navigation** | Camera feed with 3D directional arrows |
| **Voice Assistant** | Mic input, chat bubbles, intent parsing |
| **Crowd Heatmap** | Interactive SVG stadium with clickable zones |

---

## 🎬 Demo Flow

1. Open the app → tap **Voice AI**
2. Tap the mic → say **"Take me to Block M"**
3. System parses intent → calculates crowd-aware route
4. Opens AR view → shows directional arrows
5. AI speaks: *"Follow the path. Avoid Gate 2, it's crowded."*

---

## 🏗️ Architecture

```
Frontend (Next.js + Tailwind)    ←→    Backend (Express + Socket.io)
├── Dashboard                           ├── REST API (/api/route, /api/voice, /api/crowd)
├── AR Navigation (Three.js)            ├── Routing Engine (Dijkstra)
├── Voice Assistant (Web Speech API)    ├── Crowd Simulator
└── Crowd Heatmap (SVG)                └── Intent Parser
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| 3D/AR | Three.js with camera overlay |
| Voice | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| Backend | Node.js, Express |
| Real-time | Socket.io |
| Routing | Dijkstra's algorithm with crowd-weighted edges |

---

## 📂 Project Structure

```
PitchPath AI/
├── frontend/
│   ├── app/
│   │   ├── page.js          # Home Dashboard
│   │   ├── ar/page.js       # AR Navigation
│   │   ├── voice/page.js    # Voice Assistant
│   │   └── heatmap/page.js  # Crowd Heatmap
│   ├── components/           # Reusable UI components
│   ├── hooks/                # Custom React hooks
│   └── services/             # API + Socket.io clients
├── backend/
│   ├── server.js             # Express + Socket.io entry
│   ├── routes/               # REST API endpoints
│   ├── services/             # Business logic
│   └── data/                 # Stadium graph model
└── README.md
```

---

## 🧠 Smart Routing

The routing engine uses **Dijkstra's algorithm** with crowd-aware edge weighting:

```
weight = distance × (1 + crowdDensity²)
```

- Low density (< 30%): minimal route penalty
- High density (> 70%): routes automatically avoid these zones
- Returns step-by-step instructions with crowd warnings

---

## 🎤 Voice Commands

| Command | Action |
|---------|--------|
| "Take me to Block M" | Navigate to Block M |
| "Nearest washroom" | Find closest washroom |
| "Is Gate 2 crowded?" | Query crowd status |
| "Find food court" | Navigate to nearest food court |
| "Help" | Show available commands |

---

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Backend server port |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | Backend API URL |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:3001` | Socket.io URL |

---

## 📄 License

Built for hackathon demonstration purposes.
