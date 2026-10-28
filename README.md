<div align="center">

  <img src="frontend/public/logo.svg" alt="Soundwave Logo" width="96" height="96" />

  # SOUNDWAVE

  <!-- Animated Real-Time Typewriter -->
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=19&pause=1200&color=34D399&center=true&vCenter=true&width=620&lines=Next-Gen+Full-Stack+Soundwave+Experience;10-Band+Hardware+Web+Audio+API+Equalizer;Sub-Millisecond+Synchronized+Karaoke+Lyrics;Enterprise-Hardened+Security+%26+Rate+Limiting" alt="Typing SVG" />

  <br />
  <br />

  [![GitHub Stars](https://img.shields.io/github/stars/JANAGIRAM-KUMAR/MusicManager?style=for-the-badge&color=ffd700&logo=github)](https://github.com/JANAGIRAM-KUMAR/MusicManager/stargazers)
  [![GitHub Forks](https://img.shields.io/github/forks/JANAGIRAM-KUMAR/MusicManager?style=for-the-badge&color=60a5fa&logo=git)](https://github.com/JANAGIRAM-KUMAR/MusicManager/network/members)
  [![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](LICENSE)

  <br />

  <p align="center">
    <b>Soundwave</b> is a modern, high-performance music streaming platform and browser audio workstation. Built with <b>React 19</b>, <b>TypeScript 5.9</b>, <b>Tailwind CSS v4</b>, <b>Node.js (Express 5)</b>, <b>MongoDB</b>, and the <b>Web Audio API</b>. Featuring real-time line-synced karaoke lyrics, a 10-band studio graphic equalizer, 3D spatial reverb, automated audio duration detection, and enterprise-hardened defensive security.
  </p>

  <p align="center">
    <a href="#-highlights">Highlights</a> &nbsp;•&nbsp;
    <a href="#-key-features">Key Features</a> &nbsp;•&nbsp;
    <a href="#-studio-grade-audio-engine">Audio DSP Engine</a> &nbsp;•&nbsp;
    <a href="#-synchronized-lyrics-engine">Synced Lyrics</a> &nbsp;•&nbsp;
    <a href="#-enterprise-grade-security">Security Hardening</a> &nbsp;•&nbsp;
    <a href="#-tech-stack">Tech Stack</a> &nbsp;•&nbsp;
    <a href="#-quick-start">Quick Start</a> &nbsp;•&nbsp;
    <a href="#-api-reference">API Reference</a>
  </p>

</div>

<br />

---

## 🌟 Highlights

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🎛️ Studio-Grade Audio DSP</h3>
      <p>Custom <b>Web Audio API</b> signal graph featuring a <b>10-band graphic equalizer</b> (32Hz–16kHz), <b>real-time bass boost</b>, <b>convolution room reverb</b>, and <b>stereo spatializer</b> with sub-millisecond audio response.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🎤 Synced LRC Karaoke Lyrics</h3>
      <p>Real-time line-by-line synchronized lyric highlighting, instrumental solo breakdown detection, and smooth auto-scrolling with instant fallback to plain text lyrics.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🛡️ Enterprise-Grade Security</h3>
      <p>Defends against DoS, brute-force attacks, XSS, and NoSQL injection using sliding-window rate limiters, strict CORS whitelist validation, quarantine-safe upload validation, and nosniff/COOP/CORP security headers.</p>
    </td>
    <td width="50%" valign="top">
      <h3>⚡ Modern Responsive UI</h3>
      <p>Glassmorphic dark aesthetic styled with <b>Tailwind CSS v4</b> and <b>Radix UI</b> headless primitives. Features responsive split desktop panels, mobile bottom sheet player, and keyboard navigation.</p>
    </td>
  </tr>
</table>

<br />

---

## 📸 Key Features

- **🎧 High-Fidelity Audio Streaming**: Cloudinary CDN edge delivery with automatic bitrate negotiation, prefetching, and progressive audio buffering.
- **🎼 Full Library & Playlist Engine**:
  - Custom user playlists with drag-and-drop song reordering.
  - Heart/Like collection with instantaneous optimistic UI updates.
  - Smart queue management with Repeat (Off / All / Track) and Shuffle modes.
  - Deduplicated Recently Played audit trail.
- **🎚️ Interactive Audio FX Studio**:
  - **10-Band Peaking EQ**: 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz with dynamic decibel sliders.
  - **Audio Presets**: Bass Boost, Vocal Enhancer, Treble Booster, Electronic, Rock, Acoustic, Flat.
  - **Spatializer**: Dynamic stereo panning and room convolution reverb.
- **👑 Full Admin Workstation**:
  - Automatic audio duration calculation via Cloudinary header probes and binary WAV inspection (no manual input required).
  - Multi-album release tagging (associate tracks with singles, albums, or compilations).
  - Real-time user management, playlist governance, and telemetry dashboard (total plays, likes, active users).
- **🔐 Hybrid Authentication System**:
  - Google One-Tap & OAuth 2.0 integration.
  - Native Email & Password auth with bcrypt salt hashing.
  - HTTP-only `SameSite=Lax` secure session cookies + Bearer token dual authorization.

<br />

---

## 🎛️ Studio-Grade Audio Engine

Soundwave bypasses standard HTML5 audio limitations by constructing a **dedicated Web Audio API signal processing graph**:

```mermaid
graph LR
    AudioEl[("HTML5 Audio Source")] --> MediaNode["MediaElementSourceNode"]
    MediaNode --> PreAmp["Preamp Gain (+/-12dB)"]
    PreAmp --> EQBank["10-Band BiquadFilterPeaking Bank"]
    EQBank --> BassFilter["LowShelf Bass Booster (60Hz)"]
    BassFilter --> Convolver["Convolver Reverb Node"]
    BassFilter --> DryGain["Dry Gain Signal"]
    Convolver --> WetGain["Wet Reverb Signal"]
    DryGain --> Mixer["Mixer Gain Node"]
    WetGain --> Mixer
    Mixer --> Panner["StereoPannerNode"]
    Panner --> MasterGain["Master Volume Node"]
    MasterGain --> Destination["AudioContext.destination (Speakers / Headphones)"]

    classDef audio fill:#09090b,stroke:#34d399,stroke-width:2px,color:#fff;
    class AudioEl,MediaNode,PreAmp,EQBank,BassFilter,Convolver,DryGain,WetGain,Mixer,Panner,MasterGain,Destination audio;
```

<br />

---

## 🎤 Synchronized Lyrics Engine

Powered by LRCLIB integration with client-side synchronization:

- **Active Timestamp Interpolation**: Synchronizes within `~25ms` of current playhead position.
- **Instrumental Interludes**: Automatically detects non-vocal sections and renders rhythmic visual indicators.
- **Click-to-Seek**: Click any lyric line to jump the song playhead directly to that timestamp.
- **Smooth Auto-Scroll**: Maintains the active line centered in the viewport with user-scroll override detection.

<br />

---

## 🛡️ Enterprise-Grade Security

Soundwave includes production-grade defensive security measures designed to mitigate web application vulnerabilities:

| Security Layer | Implementation | Threat Mitigated |
|---|---|---|
| **Rate Limiting** | Sliding-window in-memory rate limiters (`authRateLimiter`, `apiRateLimiter`, `uploadRateLimiter`) | Brute-force credential attacks, account enumeration, DoS flooding |
| **CORS Policy** | Explicit origin whitelist verification with rejection of unauthorized origins | Cross-Origin Data Theft, CSRF, Malicious iframe/script hijacking |
| **HTTP Security Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Cross-Origin-Opener-Policy: same-origin-allow-popups`, `Permissions-Policy` | Clickjacking, MIME sniffing, Window opener leaks, drive-by camera/mic access |
| **NoSQL Hardening** | Strict 24-character hex MongoDB ObjectId route validator | CastError query crashes, unhandled server 500 dumps, NoSQL injection |
| **Upload Quarantine** | Extension/MIME whitelist (`mp3/wav/flac` audio, `jpg/png/webp` images; SVG blocked) + immediate `fs.unlink` cleanup | Remote Code Execution (RCE), Stored XSS, disk space exhaustion |
| **PII Redaction** | Public projections on `/api/users` (`.select("_id fullName imageUrl")`) | Leakage of user email addresses and OAuth profile identifiers |
| **Payload Defense** | `1mb` JSON & URL-encoded body limits + 100-char search query capping | Large body buffer DoS, Regex Denial of Service (ReDoS) |

<br />

---

## 🏗️ Architecture

```
SOUNDWAVE
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route controllers (Auth, Song, Album, Playlist, Admin, Browse, Lyrics)
│   │   ├── lib/              # Database connection, Cloudinary client, JWT sessions
│   │   ├── middleware/       # Auth guards, security headers, rate limiters, ObjectId validators
│   │   ├── models/           # Mongoose schemas (User, Song, Album, Playlist, Like, PlayHistory)
│   │   ├── routes/           # Express REST endpoints
│   │   └── server.js         # Server entry point, cron jobs, static file serving
│   ├── Dockerfile            # Containerized backend build
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components (AudioFXDialog, LyricsViewer, Topbar)
│   │   ├── layout/           # MainLayout, AudioPlayer, MobileNav, ResizablePanels
│   │   ├── pages/            # Home, Album, Playlist, Search/Browse, Admin, 404
│   │   ├── stores/           # Zustand stores (usePlayerStore, useAuthStore, useMusicStore, etc.)
│   │   ├── types/            # TypeScript interfaces and state models
│   │   └── lib/              # Axios instance, Web Audio Engine (AudioEngine.ts), LRC Parser
│   ├── Dockerfile            # Containerized frontend build
│   └── package.json
│
├── docker-compose.yml        # Multi-container orchestration
└── Makefile                  # Developer workflow automation
```

<br />

---

## 💻 Tech Stack

<div align="center">

### Frontend
[![React](https://img.shields.io/badge/React_19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite_7.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand_5.0-443E38?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
[![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=for-the-badge&logo=radix-ui&logoColor=white)](https://www.radix-ui.com/)
[![Lucide](https://img.shields.io/badge/Lucide_Icons-F56565?style=for-the-badge)](https://lucide.dev/)

### Audio & Backend
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-Hardware_DSP-34d399?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![LRCLIB](https://img.shields.io/badge/LRCLIB-Synced_Lyrics-purple?style=for-the-badge)](https://lrclib.net/)
[![Node.js](https://img.shields.io/badge/Node.js_20_LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express_5.2-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose_9.0-880000?style=for-the-badge)](https://mongoosejs.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary_CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

<br />

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- **MongoDB**: Local instance or free [MongoDB Atlas URI](https://www.mongodb.com/cloud/atlas)
- **Cloudinary Account**: Free tier for audio/image storage ([Cloudinary](https://cloudinary.com))

---

### 1. Clone Repository

```bash
git clone https://github.com/JANAGIRAM-KUMAR/MusicManager.git
cd MusicManager
```

---

### 2. Configure Environment Variables

Create `.env` inside `backend/`:

```env
PORT=6001
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string

# Authentication & Sessions
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
ADMIN_EMAIL=your_email@example.com
ADMIN_EMAILS=your_email@example.com,coadmin@example.com
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

# Cloudinary Storage
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

# Client CORS
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

---

### 3. Install & Run (Development)

Using the root workspace:

```bash
# 1. Install all dependencies
npm run build

# 2. Start the Backend API (http://localhost:6001)
cd backend
npm run dev

# 3. In another terminal, start the Frontend Vite Dev Server (http://localhost:3000)
cd frontend
npm run dev
```

Visit **`http://localhost:3000`** in your browser!

---

### 4. Running with Docker Compose

If you have Docker installed, you can launch the entire stack with a single command:

```bash
# Using Makefile
make dev

# Or directly with Docker Compose
docker-compose up --build
```

---

### 5. Running Tests

```bash
# Run unit and store tests in the frontend
cd frontend
npm test
```

<br />

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|:---:|:---|
| <kbd>Space</kbd> | Toggle Play / Pause |
| <kbd>→</kbd> | Seek forward 5 seconds |
| <kbd>←</kbd> | Seek backward 5 seconds |
| <kbd>↑</kbd> | Increase volume (+5%) |
| <kbd>↓</kbd> | Decrease volume (-5%) |
| <kbd>M</kbd> | Toggle Mute |
| <kbd>L</kbd> | Open / Close Lyrics View |
| <kbd>E</kbd> | Open / Close Audio FX Equalizer |

<br />

---

## 📡 API Reference

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/register` | `POST` | Public | Register new account (Rate limited: 15/15m) |
| `/api/auth/login` | `POST` | Public | Email/Password login |
| `/api/auth/google` | `POST` | Public | Verify Google OAuth credential token |
| `/api/auth/me` | `GET` | Optional | Get current session user and admin status |
| `/api/auth/logout` | `POST` | User | Terminate session & clear cookies |
| `/api/songs` | `GET` | Admin | Retrieve all songs in library |
| `/api/songs/featured` | `GET` | Public | Get featured curated songs |
| `/api/songs/trending` | `GET` | Public | Get trending tracks |
| `/api/songs/:songId` | `GET` | Public | Get song details by validated ObjectId |
| `/api/albums` | `GET` | Public | List all published albums |
| `/api/albums/:albumId` | `GET` | Public | Get album tracks and release details |
| `/api/playlists` | `GET` | User | Get current user's personal playlists |
| `/api/playlists` | `POST` | User | Create custom playlist |
| `/api/playlists/:id/songs`| `POST` | User | Append track to playlist |
| `/api/likes/:songId` | `POST` | User | Toggle like / favorite status |
| `/api/lyrics` | `GET` | Public | Fetch synchronized LRC & plain lyrics |
| `/api/browse?q={query}` | `GET` | Public | Search across songs, artists, and albums |
| `/api/admin/songs` | `POST` | Admin | Upload track & cover with automated duration probe |
| `/api/admin/albums` | `POST` | Admin | Create new album release |
| `/api/admin/users` | `GET` | Admin | Manage user accounts & view listener metrics |
| `/api/health` | `GET` | Public | Server uptime and health probe |

<br />

---

## 🤝 Contributing

Contributions are always welcome! If you'd like to improve Soundwave:

1. **Fork the Project** (`https://github.com/JANAGIRAM-KUMAR/MusicManager/fork`)
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'feat: add AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

<br />

---

## ⭐️ Show Your Support

If you found this project helpful or inspiring, please consider giving it a **Star** on GitHub! It helps more developers discover the project and keeps us motivated to add more features.

[![Stargazers repo roster for @JANAGIRAM-KUMAR/MusicManager](https://reporoster.com/stars/JANAGIRAM-KUMAR/MusicManager)](https://github.com/JANAGIRAM-KUMAR/MusicManager/stargazers)

<br />

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

<br />

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/JANAGIRAM-KUMAR">JANAGIRAM-KUMAR</a></sub>
</div>
