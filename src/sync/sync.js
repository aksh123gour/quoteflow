import Peer from 'peerjs';
import QRCode from 'qrcode-svg';
import { db, getActiveCompanyId } from '../db/index.js';

class SyncEngine {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.deviceId = this.getOrCreateDeviceId();
    this.status = 'offline';
    this.onStatusChange = null;
  }

  getOrCreateDeviceId() {
    let id = localStorage.getItem('quoteflow_device_id');
    if (!id) {
      id = 'QF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem('quoteflow_device_id', id);
    }
    return id;
  }

  init() {
    const input = document.getElementById('my-sync-code');
    if (input) input.value = this.deviceId;

    this.renderQrCode();
    this.setupPeer();
  }

  renderQrCode() {
    const container = document.getElementById('sync-qr-code');
    if (!container) return;
    try {
      const qr = new QRCode({
        content: this.deviceId,
        padding: 2,
        width: 120,
        height: 120,
        color: "#000000",
        background: "#ffffff",
        ecl: "M"
      });
      container.innerHTML = qr.svg();
    } catch (e) {
      container.innerText = this.deviceId;
    }
  }

  setupPeer() {
    try {
      this.peer = new Peer(this.deviceId, { debug: 1 });

      this.peer.on('open', (id) => {
        this.updateStatus('ready', 'Ready to connect');
      });

      this.peer.on('connection', (conn) => {
        this.conn = conn;
        this.setupConnectionHandlers();
      });

      this.peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          // If ID collision or reconnecting
          this.updateStatus('ready', 'Ready');
        } else {
          this.updateStatus('offline', 'Offline Mode');
        }
      });
    } catch (e) {
      this.updateStatus('offline', 'Offline Mode');
    }
  }

  connectToRemote(remoteId) {
    if (!remoteId) return;
    const cleanId = remoteId.trim().toUpperCase();
    this.updateStatus('connecting', 'Connecting...');
    this.conn = this.peer.connect(cleanId);
    this.setupConnectionHandlers();
  }

  setupConnectionHandlers() {
    if (!this.conn) return;

    this.conn.on('open', () => {
      this.updateStatus('connected', `Connected to ${this.conn.peer}`);
      this.sendSyncPayload();
    });

    this.conn.on('data', async (data) => {
      if (data && data.type === 'SYNC_PAYLOAD') {
        await this.handleRemotePayload(data.payload);
        this.updateStatus('connected', `Synced with ${this.conn.peer}`);
      }
    });

    this.conn.on('close', () => {
      this.updateStatus('ready', 'Disconnected');
    });

    this.conn.on('error', () => {
      this.updateStatus('offline', 'Connection Error');
    });
  }

  async sendSyncPayload() {
    if (!this.conn || !this.conn.open) return;
    const tables = [
      'companies', 'customers', 'products', 'quotations', 'quotation_items',
      'invoices', 'invoice_items', 'invoice_payments', 'delivery_challans',
      'delivery_challan_items', 'credit_debit_notes', 'credit_debit_note_items',
      'settings'
    ];
    const payload = {};
    for (const t of tables) {
      payload[t] = await db[t].toArray();
    }
    this.conn.send({ type: 'SYNC_PAYLOAD', payload, timestamp: Date.now() });
  }

  async handleRemotePayload(payload) {
    if (!payload) return;
    for (const [table, rows] of Object.entries(payload)) {
      if (db[table] && Array.isArray(rows)) {
        for (const row of rows) {
          await db[table].put(row);
        }
      }
    }
    // Refresh current view if renderer is active
    if (window.switchView && window.currentView) {
      window.switchView(window.currentView);
    }
  }

  updateStatus(status, text) {
    this.status = status;
    const dot = document.getElementById('sync-dot');
    const label = document.getElementById('sync-status-text');
    const msg = document.getElementById('sync-message');

    if (dot) {
      dot.className = 'sync-dot ' + status;
    }
    if (label) label.textContent = text;
    if (msg) msg.textContent = text;
  }
}

export const syncEngine = new SyncEngine();
