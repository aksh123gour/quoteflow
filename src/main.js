import { seedDefaults } from './db/index.js';
import { buildWindowApi } from './api/index.js';
import { syncEngine } from './sync/sync.js';

// 1. Ensure window.api is initialized
window.api = buildWindowApi();

// 2. Seed database defaults & request Persistent Storage lock from OS
try {
  await seedDefaults();
} catch (err) {
  console.error('[QuoteFlow] seedDefaults failed:', err);
}

if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((isPersisted) => {
    console.log(`[QuoteFlow] Persistent Storage: ${isPersisted ? 'GRANTED (Protected from OS eviction)' : 'NOT GRANTED'}`);
  }).catch(() => {});
}

// 3. Setup Mobile Switcher & PWA Install Prompt
const switchMobileBtn = document.getElementById('switch-mobile-btn');
if (switchMobileBtn) {
  switchMobileBtn.addEventListener('click', () => {
    localStorage.setItem('quoteflow_mode_preference', 'mobile');
    window.location.href = '/mobile/';
  });
}

let deferredPrompt = null;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.classList.remove('hidden');
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      installBtn.classList.add('hidden');
    }
    deferredPrompt = null;
  });
}


// 4. Setup Sync Panel Modal UI
const syncBtn = document.getElementById('sync-btn');
const syncOverlay = document.getElementById('sync-panel-overlay');
const syncClose = document.getElementById('sync-panel-close');
const connectBtn = document.getElementById('connect-sync-btn');
const remoteCodeInput = document.getElementById('remote-sync-code');
const copyCodeBtn = document.getElementById('copy-sync-code-btn');
const backupBtn = document.getElementById('backup-btn');
const restoreBtn = document.getElementById('restore-btn');

if (syncBtn && syncOverlay) {
  syncBtn.addEventListener('click', () => {
    syncEngine.init();
    syncOverlay.classList.remove('hidden');
  });

  if (syncClose) {
    syncClose.addEventListener('click', () => syncOverlay.classList.add('hidden'));
  }

  if (connectBtn && remoteCodeInput) {
    connectBtn.addEventListener('click', () => {
      const code = remoteCodeInput.value.trim();
      if (code) syncEngine.connectToRemote(code);
    });
  }

  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', () => {
      const myCode = document.getElementById('my-sync-code')?.value;
      if (myCode) {
        navigator.clipboard.writeText(myCode);
        copyCodeBtn.textContent = 'Copied!';
        setTimeout(() => { copyCodeBtn.textContent = 'Copy'; }, 2000);
      }
    });
  }

  if (backupBtn) {
    backupBtn.addEventListener('click', async () => {
      await window.api.backup.create();
    });
  }

  if (restoreBtn) {
    restoreBtn.addEventListener('click', async () => {
      await window.api.backup.restore();
    });
  }
}

// 5. Load original renderer script AFTER window.api is ready
await import('./renderer.js');

