<div align="center">

# 🤖 Fredrik — WhatsApp Multi-Device AI Bot

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Baileys](https://img.shields.io/badge/WhatsApp-Baileys%20v6.7-25D366.svg)](https://github.com/WhiskeySockets/Baileys)
[![AI](https://img.shields.io/badge/AI-OpenRouter%20%2F%20GPT--4o-purple.svg)](https://openrouter.ai/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*A clean, fast, and production-ready WhatsApp automation bot built with TypeScript and Baileys. Designed for personal productivity, media processing, AI chat, group moderation, and automated protection.*

</div>

---

## ✨ Key Features

- **🧠 OpenRouter AI Intelligence:**
  - Multi-turn conversation memory (per-user and per-group context buffer).
  - High-performance models (defaults to `openai/gpt-4o`).
  - Vision analysis: analyze photos and answer visual questions with `.vision`.
  - Smart tools: text summarization (`.summarize`), code helper (`.code`), and translation (`.translate`).
- **🎬 Fast Sticker & Media Engine:**
  - **Image → Sticker:** Reply to any photo with `.s` or `.sticker` to create a sticker with custom metadata.
  - **Video/GIF → Animated Sticker:** Reply to any video/GIF with `.s` or `.sticker` to create an animated sticker.
  - **Sticker → Image:** Convert static stickers back into images with `.toimg`.
  - **Sticker → Video:** Convert animated stickers into MP4 videos with `.tovideo`.
  - **Voice & Audio:** High-fidelity Text-to-Speech (`.tts`) and direct media downloader (`.download`).
  - **OCR:** Read and extract text from images with `.ocr`.
- **🛡️ Built-in Protection & Moderation:**
  - **Anti-Link:** Detect and delete group invite links, warning violators automatically.
  - **Anti-Delete:** Intercept deleted messages and send notifications with deleted content.
  - **Anti-Call:** Automatically decline incoming voice/video calls with a polite response.
  - **Anti-Spam:** Dynamic sliding-window rate limiting to prevent spam and platform bans.
  - **View-Once Bypass:** Retrieve and save View-Once photos and videos with `.vv`.
- **👥 Group Administration:**
  - Fast member management: `.kick`, `.add`, `.promote`, `.demote`, `.mute`, `.unmute`.
  - Announcements: `.tagall` / `.hidetag` to notify all participants.
  - Warning system: `.warn` and `.unwarn` with automated 3-strike removal.
- **⏰ Productivity & Utilities:**
  - Background reminders (`.remind 15m Call dentist`) with cron scheduler.
  - Personal to-do checklist (`.todo add ...`, `.todo list`).
  - Safe math calculator (`.calc`), weather forecasts (`.weather`), and QR code generator (`.qr`).
- **👑 Full Owner Controls:**
  - Broadcast to all groups (`.broadcast`).
  - Switch operating mode on the fly: `.mode public`, `.mode private`, `.mode group`, `.mode inbox`.
  - System diagnostics (`.ping`, `.uptime`, `.stats`, `.settings`).

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** or **pnpm**
- **ffmpeg** (for video and audio conversions)

### 2. Installation
```bash
git clone <repository-url>
cd Fredrik
npm install
```

### 3. Configuration
Copy `.env.example` to `.env` and fill in your settings:
```bash
cp .env.example .env
```

```env
# Credentials & Identity
BOT_NAME=Fredrik
PREFIX=.
OWNER_NUMBER=auto
MODE=public

# Pairing Code (optional - if provided, bot generates an 8-digit pairing code)
PAIRING_CODE_NUMBER=2348012345678

# OpenRouter AI
OPENROUTER_API_KEY=your-openrouter-key-here
OPENROUTER_MODEL=openai/gpt-4o

# Features
ANTI_LINK=true
ANTI_DELETE=true
ANTI_CALL=true
ANTI_SPAM=true
```

### 4. Build & Start
```bash
# Build TypeScript
npm run build

# Start bot
npm start
```

---

## 📱 Pairing Options & Web Portal

Fredrik provides three simple, flexible pairing mechanisms:

1. **🌐 Interactive Web Portal (Recommended for Render & Cloud):**
   Open your browser at `http://localhost:3000` (or your Render URL `https://your-bot.onrender.com`).
   - Enter your phone number to get an instant **8-digit pairing code** with a 1-click copy button.
   - Or switch to the **Live QR Code** tab to scan directly with your phone's camera.
   - View real-time bot statistics and export your `SESSION_ID` for cloud persistence.
2. **8-Digit Terminal Pairing Code:**
   Set `PAIRING_CODE_NUMBER` in `.env` to your phone number with country code (e.g. `2348012345678`). Fredrik displays an 8-digit pairing code in your terminal. Enter it in WhatsApp (*Linked Devices > Link with Phone Number*).
3. **Terminal QR Code:**
   Launch the bot without a pairing number to view the QR code in the terminal.

---

## ☁️ Deploy to Render in 3 Minutes

Deploying Fredrik to Render is 100% turnkey:

1. Push this repository to your GitHub/GitLab.
2. In [Render Dashboard](https://dashboard.render.com/), select **New +** &rarr; **Blueprint** and select your repo (uses [`render.yaml`](file:///c:/Users/User/Desktop/Fredrik/render.yaml)).
3. Open your Render app URL (`https://your-app.onrender.com`), enter your phone number on the web portal to link your WhatsApp account, and you're live!

See the comprehensive [Render Deployment Guide](docs/RENDER_DEPLOY.md) for session persistence tips and 24/7 uptime setup.

---

## 🐳 Docker Deployment

Run Fredrik with Docker:

```bash
docker build -t fredrik-bot .
docker run -p 3000:3000 -v $(pwd)/session:/app/session fredrik-bot
```

---

## 📚 Documentation

- [Complete Command Reference](docs/COMMANDS.md)
- [Render Cloud Deployment Guide](docs/RENDER_DEPLOY.md)
- [Cloud & VPS Deployment Guide](docs/DEPLOYMENT.md)
- [Security & Anti-Ban Architecture](docs/SECURITY.md)

---

## 📄 License
Released under the [MIT License](LICENSE).
