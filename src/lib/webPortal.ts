export function getWebPortalHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fredrik WhatsApp AI Bot | Web Portal</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: rgba(18, 24, 38, 0.85);
      --border: rgba(255, 255, 255, 0.08);
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --primary-glow: rgba(99, 102, 241, 0.35);
      --cyan: #06b6d4;
      --emerald: #10b981;
      --rose: #f43f5e;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, var(--bg) 65%);
      color: var(--text);
      font-family: var(--font);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 2.5rem 1rem;
      overflow-x: hidden;
    }

    .container {
      width: 100%;
      max-width: 680px;
      margin: 0 auto;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #a5b4fc;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 1rem;
    }

    .brand-badge span.pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--emerald);
      box-shadow: 0 0 10px var(--emerald);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .title {
      font-size: 2.4rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 1rem;
      line-height: 1.5;
    }

    /* Main Card */
    .card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 50px -10px var(--primary-glow);
      position: relative;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 0.5rem;
      background: rgba(0, 0, 0, 0.3);
      padding: 0.35rem;
      border-radius: 12px;
      margin-bottom: 1.75rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .tab-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.92rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .tab-btn:hover {
      color: var(--text);
    }

    .tab-btn.active {
      background: var(--primary);
      color: #ffffff;
      box-shadow: 0 4px 12px var(--primary-glow);
    }

    /* Tab Content Panels */
    .tab-panel {
      display: none;
    }

    .tab-panel.active {
      display: block;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Inputs & Buttons */
    .form-group {
      margin-bottom: 1.5rem;
    }

    .label {
      display: block;
      font-size: 0.88rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #cbd5e1;
    }

    .input-wrapper {
      position: relative;
      display: flex;
    }

    .phone-input {
      width: 100%;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 0.85rem 1rem;
      border-radius: 10px;
      font-size: 1.05rem;
      color: #ffffff;
      outline: none;
      transition: border-color 0.2s;
    }

    .phone-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }

    .btn {
      width: 100%;
      padding: 0.9rem 1.25rem;
      background: linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%);
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      box-shadow: 0 4px 14px var(--primary-glow);
      transition: all 0.2s ease;
    }

    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px var(--primary-glow);
      filter: brightness(1.1);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Code Display Card */
    .code-display-card {
      margin-top: 1.5rem;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 14px;
      padding: 1.5rem;
      text-align: center;
      animation: fadeIn 0.3s ease;
    }

    .code-title {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #a5b4fc;
      margin-bottom: 0.75rem;
    }

    .code-box {
      font-size: 2.2rem;
      font-weight: 800;
      letter-spacing: 0.15em;
      color: var(--cyan);
      font-family: monospace, Consolas, "Courier New";
      padding: 0.75rem;
      background: rgba(6, 182, 212, 0.08);
      border: 1px dashed rgba(6, 182, 212, 0.4);
      border-radius: 10px;
      margin-bottom: 1rem;
      display: inline-block;
      user-select: all;
    }

    .copy-btn {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: background 0.2s;
    }

    .copy-btn:hover {
      background: rgba(255, 255, 255, 0.16);
    }

    /* QR Code Display */
    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1rem 0;
    }

    .qr-wrapper {
      background: #ffffff;
      padding: 1rem;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      margin-bottom: 1.25rem;
      min-width: 250px;
      min-height: 250px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .qr-image {
      max-width: 240px;
      height: auto;
      display: block;
      border-radius: 8px;
    }

    .qr-spinner {
      color: #1e293b;
      font-size: 0.9rem;
      font-weight: 600;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    /* Step Guides */
    .guide-box {
      margin-top: 1.75rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 1.25rem;
      font-size: 0.88rem;
      color: #cbd5e1;
      text-align: left;
    }

    .guide-title {
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .guide-steps {
      list-style-position: inside;
      line-height: 1.8;
      padding-left: 0.25rem;
    }

    .guide-steps li {
      margin-bottom: 0.35rem;
    }

    /* Connected Dashboard View */
    .connected-card {
      display: none;
      text-align: center;
      animation: fadeIn 0.4s ease;
    }

    .connected-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      font-weight: 700;
      padding: 0.5rem 1.25rem;
      border-radius: 9999px;
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
      text-align: left;
    }

    @media (max-width: 500px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }

    .stat-item {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 1rem;
    }

    .stat-label {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 0.3rem;
    }

    .stat-value {
      font-size: 1.15rem;
      font-weight: 700;
      color: #ffffff;
    }

    /* Session Backup Box */
    .session-box {
      background: rgba(0, 0, 0, 0.45);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      text-align: left;
    }

    .session-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: #a5b4fc;
      margin-bottom: 0.4rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .session-string {
      font-family: monospace;
      font-size: 0.8rem;
      color: #94a3b8;
      background: rgba(0, 0, 0, 0.3);
      padding: 0.6rem;
      border-radius: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 0.75rem;
    }

    .session-tip {
      font-size: 0.8rem;
      color: #94a3b8;
      line-height: 1.4;
    }

    .btn-danger {
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: #fda4af;
      box-shadow: none;
    }

    .btn-danger:hover {
      background: rgba(244, 63, 94, 0.25);
      filter: none;
    }

    /* Status Toast */
    .toast {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #1e293b;
      color: #ffffff;
      padding: 0.75rem 1.5rem;
      border-radius: 9999px;
      font-size: 0.88rem;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 1000;
    }

    .toast.show {
      transform: translateX(-50%) translateY(0);
    }

    /* Footer */
    .footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.82rem;
      color: var(--text-muted);
    }
  </style>
</head>
<body>

  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="brand-badge">
        <span class="pulse-dot"></span>
        <span>Fredrik Multi-Device</span>
      </div>
      <h1 class="title">WhatsApp AI Bot</h1>
      <p class="subtitle">Link your personal WhatsApp account via Pairing Code or QR Code to activate Fredrik.</p>
    </div>

    <!-- Main Card -->
    <div class="card">
      
      <!-- Pairing Section (shown when disconnected) -->
      <div id="pairingSection">
        <!-- Tabs -->
        <div class="tabs">
          <button class="tab-btn active" id="tabPairBtn" onclick="switchTab('pair')">
            🔢 Pair with Phone Number
          </button>
          <button class="tab-btn" id="tabQrBtn" onclick="switchTab('qr')">
            📷 Scan QR Code
          </button>
        </div>

        <!-- Tab 1: Phone Number Pairing Code -->
        <div class="tab-panel active" id="pairPanel">
          <form id="pairForm" onsubmit="handleRequestPairCode(event)">
            <div class="form-group">
              <label class="label" for="phoneInput">WhatsApp Phone Number</label>
              <div class="input-wrapper">
                <input 
                  type="tel" 
                  id="phoneInput" 
                  class="phone-input" 
                  placeholder="e.g. 15551234567 or 2348012345678" 
                  required
                >
              </div>
              <p style="font-size: 0.78rem; color: #64748b; margin-top: 0.4rem;">
                Include your country code without '+' or spaces.
              </p>
            </div>

            <button type="submit" class="btn" id="submitPairBtn">
              <span>Generate Pairing Code</span>
              <span id="pairSpinner" style="display: none;">⏳</span>
            </button>
          </form>

          <!-- Generated Code Display -->
          <div class="code-display-card" id="codeDisplayCard" style="display: none;">
            <div class="code-title">Your 8-Digit WhatsApp Pairing Code</div>
            <div class="code-box" id="pairCodeDisplay">---- - ----</div>
            <br>
            <button class="copy-btn" onclick="copyCode()">
              📋 Copy Code
            </button>
          </div>

          <!-- Step Instructions -->
          <div class="guide-box">
            <div class="guide-title">📖 How to Link with Phone Number:</div>
            <ol class="guide-steps">
              <li>Open <strong>WhatsApp</strong> on your primary phone.</li>
              <li>Tap <strong>Settings</strong> (iOS) or <strong>⋮ Menu</strong> (Android) &gt; <strong>Linked Devices</strong>.</li>
              <li>Tap <strong>Link a Device</strong>.</li>
              <li>Tap <strong>"Link with phone number instead"</strong> at the bottom.</li>
              <li>Enter the 8-digit code displayed above.</li>
            </ol>
          </div>
        </div>

        <!-- Tab 2: Live QR Code -->
        <div class="tab-panel" id="qrPanel">
          <div class="qr-container">
            <div class="qr-wrapper">
              <img id="qrImage" class="qr-image" src="" alt="WhatsApp QR Code" style="display: none;">
              <div id="qrLoading" class="qr-spinner">
                <div style="font-size: 2rem;">⚡</div>
                <span>Waiting for WhatsApp QR Code...</span>
              </div>
            </div>

            <p style="font-size: 0.85rem; color: #94a3b8;">
              QR codes refresh automatically every ~20 seconds.
            </p>
          </div>

          <!-- Step Instructions -->
          <div class="guide-box">
            <div class="guide-title">📖 How to Link via QR Code:</div>
            <ol class="guide-steps">
              <li>Open <strong>WhatsApp</strong> on your primary phone.</li>
              <li>Tap <strong>Settings</strong> (iOS) or <strong>⋮ Menu</strong> (Android) &gt; <strong>Linked Devices</strong>.</li>
              <li>Tap <strong>Link a Device</strong>.</li>
              <li>Point your camera at this QR code to scan and authorize.</li>
            </ol>
          </div>
        </div>
      </div>

      <!-- Connected Dashboard View (shown when connected) -->
      <div id="connectedSection" class="connected-card">
        <div class="connected-badge">
          <span class="pulse-dot"></span>
          <span>Fredrik is Online & Ready</span>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">Linked WhatsApp Number</div>
            <div class="stat-value" id="botPhoneDisplay">+--</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Bot Identity</div>
            <div class="stat-value" id="botNameDisplay">Fredrik</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Server Uptime</div>
            <div class="stat-value" id="uptimeDisplay">0s</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Memory Usage</div>
            <div class="stat-value" id="ramDisplay">-- MB</div>
          </div>
        </div>

        <!-- Render Session Backup -->
        <div class="session-box">
          <div class="session-title">
            <span>💾 Render Cloud Session Backup</span>
            <button class="copy-btn" onclick="copySessionId()" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
              📋 Copy SESSION_ID
            </button>
          </div>
          <div class="session-string" id="sessionIdDisplay">Fredrik~...</div>
          <p class="session-tip">
            💡 <strong>Render Deploy Tip:</strong> Copy this string and set it as <code>SESSION_ID</code> in your Render Environment Variables. Fredrik will automatically reconnect even after rebuilds!
          </p>
        </div>

        <button class="btn btn-danger" onclick="handleLogout()">
          ⚠️ Unlink / Log Out WhatsApp Session
        </button>
      </div>

    </div>

    <!-- Footer -->
    <div class="footer">
      Powered by Baileys Multi-Device &bull; Built for Render &amp; Cloud Deployment
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast" class="toast">Code copied to clipboard!</div>

  <script>
    let isConnected = false;
    let pollInterval = null;
    let rawPairingCode = '';
    let rawSessionId = '';

    function switchTab(tab) {
      document.getElementById('tabPairBtn').classList.toggle('active', tab === 'pair');
      document.getElementById('tabQrBtn').classList.toggle('active', tab === 'qr');
      document.getElementById('pairPanel').classList.toggle('active', tab === 'pair');
      document.getElementById('qrPanel').classList.toggle('active', tab === 'qr');
    }

    function showToast(message) {
      const toast = document.getElementById('toast');
      toast.innerText = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function copyCode() {
      if (!rawPairingCode) return;
      navigator.clipboard.writeText(rawPairingCode.replace(/[^A-Za-z0-9]/g, '')).then(() => {
        showToast('Pairing code copied to clipboard!');
      });
    }

    function copySessionId() {
      if (!rawSessionId) return;
      navigator.clipboard.writeText(rawSessionId).then(() => {
        showToast('SESSION_ID copied for Render!');
      });
    }

    function formatUptime(seconds) {
      const d = Math.floor(seconds / (3600 * 24));
      const h = Math.floor((seconds % (3600 * 24)) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      if (d > 0) return \`\${d}d \${h}h \${m}m\`;
      if (h > 0) return \`\${h}h \${m}m \${s}s\`;
      return \`\${m}m \${s}s\`;
    }

    async function handleRequestPairCode(e) {
      e.preventDefault();
      const phoneInput = document.getElementById('phoneInput');
      const submitBtn = document.getElementById('submitPairBtn');
      const spinner = document.getElementById('pairSpinner');
      const number = phoneInput.value.trim();

      if (!number) return;

      submitBtn.disabled = true;
      spinner.style.display = 'inline';

      try {
        const res = await fetch('/api/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: number })
        });

        const data = await res.json();
        if (data.success && data.pairingCode) {
          rawPairingCode = data.pairingCode;
          document.getElementById('pairCodeDisplay').innerText = data.pairingCode;
          document.getElementById('codeDisplayCard').style.display = 'block';
          showToast('Pairing code generated! Enter it on WhatsApp.');
        } else {
          alert('Error: ' + (data.error || 'Failed to request pairing code'));
        }
      } catch (err) {
        alert('Network error requesting pairing code.');
      } finally {
        submitBtn.disabled = false;
        spinner.style.display = 'none';
      }
    }

    async function handleLogout() {
      if (!confirm('Are you sure you want to unlink and log out this WhatsApp account?')) return;
      try {
        await fetch('/api/logout', { method: 'POST' });
        showToast('Account unlinked. Refreshing socket...');
        setTimeout(() => location.reload(), 1500);
      } catch (err) {
        alert('Failed to log out.');
      }
    }

    async function pollStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();

        if (data.connected) {
          if (!isConnected) {
            isConnected = true;
            document.getElementById('pairingSection').style.display = 'none';
            document.getElementById('connectedSection').style.display = 'block';
          }
          document.getElementById('botPhoneDisplay').innerText = data.connectedNumber ? '+' + data.connectedNumber : 'Online';
          document.getElementById('botNameDisplay').innerText = data.botName || 'Fredrik';
          document.getElementById('uptimeDisplay').innerText = formatUptime(data.uptime || 0);
          document.getElementById('ramDisplay').innerText = data.ramUsage || '-- MB';

          if (data.sessionId) {
            rawSessionId = data.sessionId;
            document.getElementById('sessionIdDisplay').innerText = data.sessionId;
          }
        } else {
          if (isConnected) {
            isConnected = false;
            document.getElementById('pairingSection').style.display = 'block';
            document.getElementById('connectedSection').style.display = 'none';
          }

          // Update pairing code if active
          if (data.pairingCode) {
            rawPairingCode = data.pairingCode;
            document.getElementById('pairCodeDisplay').innerText = data.pairingCode;
            document.getElementById('codeDisplayCard').style.display = 'block';
          }

          // Update QR Code
          const qrImg = document.getElementById('qrImage');
          const qrLoading = document.getElementById('qrLoading');
          if (data.qrDataUrl) {
            qrImg.src = data.qrDataUrl;
            qrImg.style.display = 'block';
            qrLoading.style.display = 'none';
          } else {
            qrImg.style.display = 'none';
            qrLoading.style.display = 'flex';
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }

    // Start polling immediately and every 2.5 seconds
    pollStatus();
    pollInterval = setInterval(pollStatus, 2500);
  </script>
</body>
</html>`;
}
