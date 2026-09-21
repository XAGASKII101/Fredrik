# Fredrik Bot - Security & Anti-Ban Architecture

Fredrik is built with a security-first design that protects your WhatsApp account, bot users, and host infrastructure.

---

## 1. Anti-Ban Strategy & Safe Automation

WhatsApp enforces strict automated heuristics to detect aggressive spam and unauthorized bulk messaging. Fredrik implements conservative practices to ensure long-term stability:

- **Token Bucket Rate Limiting:** Restricts individual users to a maximum of 30 messages per minute. Exceeding triggers a temporary 5-minute automated cooldown.
- **Randomized Dispatch Delays:** Bulk operations (such as `.broadcast`) enforce staggered delays (~1.2s - 2.0s) between consecutive dispatches.
- **Polite Anti-Call System:** Incoming calls are rejected gracefully with a polite text notification rather than aggressive blocking.
- **Natural Socket Emulation:** Configures standard browser signatures and respects socket heartbeat pings without circumventing platform security protocols.

---

## 2. Secret Redaction & Log Safety

To prevent accidental leaks in shared logs, terminal transcripts, or container log aggregators:

- **Automated Pino Masking:** The logger automatically redacts sensitive paths, including:
  - `OPENROUTER_API_KEY`
  - `SESSION_ID`
  - Auth credentials (`creds.json`)
  - Bearer headers
- **No Echo of Sensitive Tokens:** Commands never print authentication tokens, API keys, or raw sessions to chat.

---

## 3. Role-Based Access Control (RBAC)

Fredrik divides capabilities into strict security tiers:

| Tier | Description | Scope |
| :--- | :--- | :--- |
| **Owner** | Bot host operator | System config, `.broadcast`, `.mode`, `.eval`, `.restart`, `.settings` |
| **Group Admin** | WhatsApp group administrator | Group moderation, `.kick`, `.add`, `.promote`, `.demote`, `.mute`, `.warn` |
| **Member** | Standard user | AI, stickers, media conversion, utilities, games |

- **Bot Admin Checks:** Moderation commands verify that Fredrik has admin privileges before attempting management actions.
- **Strict Evaluator Scoping:** The `.eval` command is strictly restricted to verified owner JIDs.

---

## 4. Input Sanitization & Anti-Crash Protection

- **No Arbitrary Math Evaluation:** The `.calc` command sanitizes inputs and restricts execution to mathematical symbols, preventing command injection.
- **Global Error Trapping:** Handlers for `uncaughtException` and `unhandledRejection` prevent process termination from unexpected network drops or corrupt payloads.
- **Atomic File Storage:** All JSON database operations use atomic write-and-rename patterns to prevent data corruption during power cuts or container restarts.
