# Fredrik Bot - Deployment Guide

This guide details how to deploy Fredrik to popular cloud hosting platforms, Docker containers, and Virtual Private Servers (VPS).

---

## 1. Quick Local / VPS Deployment

### Prerequisites
- Node.js >= 18.x
- Git
- ffmpeg installed on system (`sudo apt install ffmpeg` on Ubuntu/Debian)

### Steps
1. Clone the repository and navigate into the folder:
   ```bash
   git clone <repo-url>
   cd Fredrik
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env`:
   ```bash
   cp .env.example .env
   # Edit .env and supply your OPENROUTER_API_KEY and phone number for pairing
   ```
4. Build TypeScript:
   ```bash
   npm run build
   ```
5. Start Fredrik:
   ```bash
   npm start
   ```
   If pairing code is enabled, an 8-character pairing code will appear in your console. Enter it in **WhatsApp > Linked Devices > Link with Phone Number**.

---

## 2. Docker & Docker Compose Deployment

### Using Docker Compose
```bash
# Start in background
docker compose up -d --build

# View real-time logs (to get QR or pairing code)
docker compose logs -f
```

The `./session` and `./data` folders are mounted as host volumes to keep your authentication and settings safe across restarts.

---

## 3. Cloud Platform Deployment (Railway, Render, Koyeb, Heroku)

### Connecting Without Terminal Interaction
When deploying to cloud platforms where you cannot interactively scan a QR code:
1. Run Fredrik locally once to authenticate.
2. In your local folder, your credentials will be generated in `session/creds.json`.
3. Export the credentials as a base64 string:
   - On Linux/macOS:
     ```bash
     echo "Fredrik~$(cat session/creds.json | base64 -w 0)"
     ```
   - On Windows (PowerShell):
     ```powershell
     "Fredrik~" + [Convert]::ToBase64String([IO.File]::ReadAllBytes("session/creds.json"))
     ```
4. Set the resulting string as the `SESSION_ID` environment variable in your cloud platform dashboard.
5. Fredrik will boot up connected immediately without prompting for QR or pairing code!

### Platform-Specific Configurations

#### Railway
- Create a new project from GitHub repository.
- Add environment variables (`SESSION_ID`, `OPENROUTER_API_KEY`, `PORT=3000`).
- Railway will automatically detect the `Dockerfile` and start the container.
- Use the built-in Health Check: path `/health` on port `3000`.

#### Render
- Create a new **Web Service** or **Background Worker**.
- Environment: **Docker**.
- Add environment variables.
- Health Check path: `/health`.

#### Koyeb
- Deploy from GitHub repo using Dockerfile builder.
- Add environment variables.
- Set health check HTTP port to `3000` with path `/health`.
