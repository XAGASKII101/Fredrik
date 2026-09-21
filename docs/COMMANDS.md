# Fredrik Bot - Command Reference

Fredrik features a focused, modular command system with aliases, cooldowns, and role-based permissions.

Default prefix is `.`.

---

## 🧠 AI & Assistance

| Command | Aliases | Description | Example |
| :--- | :--- | :--- | :--- |
| `.ai <prompt>` | `.ask`, `.chat`, `.gpt` | Chat with OpenRouter AI (GPT-4o) with conversation memory | `.ai Explain how HTTPS works` |
| `.vision [prompt]` | `.see`, `.analyze` | Analyze an image using AI vision (send or reply to image) | Reply to image with `.vision What car is this?` |
| `.summarize` | `.summary`, `.sum` | Summarize long text (reply or supply text) | `.summarize <long article>` |
| `.translate <lang> <text>` | `.tr` | Translate text into any target language | `.translate French Good morning` |
| `.code <prompt>` | `.dev`, `.coder` | Generate or explain code snippets | `.code Write an Express rate limiter middleware` |
| `.clearmemory` | `.forget`, `.resetai` | Reset conversational context history for this chat | `.clearmemory` |

---

## 🎬 Media & Stickers

| Command | Aliases | Description | Example |
| :--- | :--- | :--- | :--- |
| `.sticker` | `.s`, `.stick` | Convert replied image or video into a WhatsApp sticker | Reply to image or video with `.s` |
| `.toimg` | `.photo`, `.image` | Convert a static sticker back into an image | Reply to sticker with `.toimg` |
| `.tovideo` | `.togif`, `.tomp4` | Convert an animated sticker back into video | Reply to sticker with `.tovideo` |
| `.tts <text>` | `.say`, `.voice` | Convert text into a WhatsApp voice note | `.tts Hello from Fredrik` |
| `.ocr` | `.readimg` | Extract text from image using OCR | Reply to image with `.ocr` |
| `.download <url>` | `.dl`, `.get` | Download direct media URL (audio, video, image) | `.download https://example.com/audio.mp3` |
| `.getpp [@user]` | `.pfp`, `.avatar` | Download full-resolution profile picture of user or group | `.getpp @user` or `.getpp` |

---

## 👥 Group Administration

| Command | Aliases | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `.kick @user` | - | Remove a member from the group | Group Admin + Bot Admin |
| `.add <number>` | - | Add a user by phone number | Group Admin + Bot Admin |
| `.promote @user` | - | Promote a member to group administrator | Group Admin + Bot Admin |
| `.demote @admin` | - | Demote an admin to normal member | Group Admin + Bot Admin |
| `.tagall [msg]` | `.everyone`, `.hidetag` | Mention every member in the group | Group Admin |
| `.groupinfo` | `.ginfo` | Display member count, admins, and description | Members |
| `.link` | `.grouplink` | Retrieve group invite link | Bot Admin |
| `.mute` | `.close` | Restrict chat so only admins can send messages | Group Admin + Bot Admin |
| `.unmute` | `.open` | Open chat for all group members | Group Admin + Bot Admin |
| `.warn @user` | - | Issue a formal warning (3 warnings = kick) | Group Admin |
| `.unwarn @user` | - | Reset warnings for a user | Group Admin |

---

## 🛡️ Moderation & Protection

| Command | Aliases | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `.antilink <on/off>` | - | Auto-delete group invite links and warn poster | Group Admin |
| `.antidelete <on/off>` | - | Announce when messages are deleted for everyone | Group Admin |
| `.antispam <on/off>` | - | Enforce message rate limits in the group | Group Admin |
| `.anticall <on/off>` | - | Automatically reject incoming WhatsApp calls | Owner Only |
| `.vv` | `.retrieve`, `.viewonce` | Bypass and retrieve View-Once media | All Users |

---

## ⏰ Productivity & Utilities

| Command | Aliases | Description | Example |
| :--- | :--- | :--- | :--- |
| `.remind <time> <text>` | `.reminder`, `.alarm` | Set a reminder (supports `10s`, `15m`, `2h`, `1d`) | `.remind 30m Team standup meeting` |
| `.todo [add/clear/list]` | `.todos` | Manage personal task checklist | `.todo add Review pull request` |
| `.calc <expr>` | `.math`, `.calculate` | Perform safe mathematical calculation | `.calc (120 * 4) / 5` |
| `.weather <city>` | - | Real-time weather forecast and condition | `.weather Berlin` |
| `.qr <content>` | - | Generate a scannable QR code image | `.qr https://google.com` |

---

## 📸 Status & Stories

| Command | Aliases | Description | Permissions | Example |
| :--- | :--- | :--- | :--- | :--- |
| `.poststatus <text>` | `.story`, `.updatestatus` | Post text or replied photo/video directly to WhatsApp Status | Owner Only | `.poststatus Good morning everyone!` or reply to image |
| `.statusreact <emoji>` | `.reactstatus`, `.sreact` | Configure custom emoji to automatically react to incoming status stories | Owner Only | `.statusreact 💚` |
| `.autostatus <on/off>` | `.morningstatus` | Toggle daily automated morning status updates at 07:30 AM | Owner Only | `.autostatus on` |
| `.setstatustext <quote>` | - | Set custom status message template | Owner Only | `.setstatustext Start your day with focus` |

---

## 🎮 Games & Entertainment

| Command | Description | Example |
| :--- | :--- | :--- |
| `.truth` | Random truth question | `.truth` |
| `.dare` | Random dare challenge | `.dare` |
| `.8ball <question>` | Ask the mystic 8-ball | `.8ball Will tomorrow be productive?` |
| `.joke` | Random programmer/general joke | `.joke` |
| `.quote` | Inspiring famous quote | `.quote` |

---

## 👑 Owner & System

| Command | Aliases | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `.broadcast <msg>` | `.bc` | Broadcast message to all joined groups | Owner Only |
| `.mode <mode>` | - | Change mode (`public`, `private`, `group`, `inbox`) | Owner Only |
| `.setprefix <prefix>` | - | Change default command prefix | Owner Only |
| `.settings` | - | View and review bot configurations | Owner Only |
| `.eval <code>` | - | Run runtime JavaScript evaluation | Owner Only |
| `.restart` | - | Gracefully reboot bot process | Owner Only |

---

## ℹ️ Information & Stats

| Command | Aliases | Description |
| :--- | :--- | :--- |
| `.menu` | `.help`, `.commands` | Show interactive categorized command menu |
| `.ping` | `.p`, `.speed` | Measure response latency and roundtrip time |
| `.uptime` | - | Show bot operational uptime |
| `.stats` | `.system` | Show RAM, CPU, OS, and process statistics |
