# 🚀 Deploying Fredrik to Render (Step-by-Step Guide)

Fredrik comes with a built-in **Web Pairing Portal** and **Dashboard** designed specifically for cloud deployments like **Render**.

You can pair your WhatsApp account directly in your web browser using either an **8-digit Pairing Code** (phone number) or by **scanning the Live QR Code**.

---

## ⚡ Option 1: 1-Click Render Blueprint (Recommended)

1. Push this repository to your **GitHub** or **GitLab** account.
2. Go to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** &rarr; **Blueprint**.
4. Connect your Fredrik repository. Render will automatically detect [`render.yaml`](file:///c:/Users/User/Desktop/Fredrik/render.yaml).
5. Click **Apply**. Render will automatically build and start the bot!

---

## 🛠️ Option 2: Manual Web Service Setup

If you prefer setting up the Web Service manually:

1. In Render, click **New +** &rarr; **Web Service**.
2. Select your repository.
3. Configure the settings:
   - **Name**: `fredrik-bot` (or your choice)
   - **Region**: Oregon, Frankfurt, or closest to you
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Under **Advanced Settings**:
   - **Health Check Path**: `/health`
5. Add the following **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `3000` (Render binds this automatically)
   - `BOT_NAME`: `Fredrik`
   - `PREFIX`: `.`
   - `MODE`: `public`
   - `OWNER_NUMBER`: `auto`
6. Click **Create Web Service**.

---

## 📱 How to Pair Your WhatsApp Account on Render

Once Render finishes the build, your web service will be active at:
`https://<your-service-name>.onrender.com`

1. Open your Render bot URL in your phone or computer browser: `https://<your-service-name>.onrender.com`
2. You will see the **Fredrik Web Pairing Portal**:

### Method A: Pair with Phone Number (Pairing Code)
1. On the **"Pair with Phone Number"** tab, type your WhatsApp phone number with international country code (e.g. `2348012345678` or `15551234567`) without spaces or `+`.
2. Click **Generate Pairing Code**.
3. An 8-digit code (e.g. `ABCD-1234`) will appear on screen with a **Copy** button.
4. On your phone:
   - Open **WhatsApp**.
   - Tap **Settings** (iOS) or **⋮ Menu** (Android) &gt; **Linked Devices** &gt; **Link a Device**.
   - Tap **"Link with phone number instead"** at the bottom.
   - Enter the 8-digit code.
5. In 3 seconds, your browser page will automatically change to **"Fredrik is Online & Ready"**!

### Method B: Pair via QR Code
1. Click the **"Scan QR Code"** tab on the web portal.
2. Open WhatsApp &gt; **Linked Devices** &gt; **Link a Device**.
3. Point your phone camera at the QR code on your screen to authorize.

---

## 💾 Keeping Session Persistent on Render

Render free-tier instances have an ephemeral disk. To make sure Fredrik stays logged in across rebuilds and redeployments:

1. In the Web Portal, once connected, look at the **💾 Render Cloud Session Backup** section.
2. Click **📋 Copy SESSION_ID**.
3. Go to your **Render Dashboard** &gt; your Fredrik service &gt; **Environment**.
4. Add or update the variable:
   - **Key**: `SESSION_ID`
   - **Value**: *(paste the copied string, e.g. `Fredrik~eyJjcmVkcyI6...`)*
5. Click **Save Changes**.

Now, even if Render restarts or redeploys your code, Fredrik will restore the session instantly without needing you to scan or pair again!

---

## ⏰ Keeping Render Free Tier Awake (24/7 Uptime)

Free Render instances spin down after 15 minutes of inactivity. To keep Fredrik online 24/7:

1. Sign up for a free monitor at [Cron-Job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com).
2. Create a new HTTP monitor pointing to:
   `https://<your-service-name>.onrender.com/health`
3. Set the interval to **every 10 minutes**.

Render will remain awake and responsive around the clock!
