const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const CRED_FILE = path.join(DATA_DIR, 'credentials.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CRED_FILE)) fs.writeFileSync(CRED_FILE, JSON.stringify({}, null, 2));
}

function getSecret() {
  const secret = process.env.GATEWAY_KEYS_SECRET;
  if (!secret) throw new Error('GATEWAY_KEYS_SECRET is not set');
  return secret;
}

function encrypt(text, secret) {
  const key = crypto.createHash('sha256').update(String(secret)).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(text, 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(b64, secret) {
  const data = Buffer.from(b64, 'base64');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const encrypted = data.slice(28);
  const key = crypto.createHash('sha256').update(String(secret)).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

function readStore() {
  ensureDataFile();
  const raw = fs.readFileSync(CRED_FILE, 'utf8');
  try {
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

function writeStore(obj) {
  ensureDataFile();
  fs.writeFileSync(CRED_FILE, JSON.stringify(obj, null, 2));
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/credentials/:gatewayId', (req, res) => {
  try {
    const secret = getSecret();
    const store = readStore();
    const entry = store[req.params.gatewayId];
    if (!entry) return res.status(404).json({ error: 'Not found' });
    const decrypted = JSON.parse(decrypt(entry, secret));
    return res.json({ data: decrypted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

app.post('/credentials/:gatewayId', (req, res) => {
  try {
    const secret = getSecret();
    const payload = req.body || {};
    // Basic validation
    if (!payload.apiKey || !payload.secret) return res.status(400).json({ error: 'apiKey and secret required' });
    const plain = JSON.stringify({ apiKey: payload.apiKey, secret: payload.secret, webhook: payload.webhook || '' });
    const encrypted = encrypt(plain, secret);
    const store = readStore();
    store[req.params.gatewayId] = encrypted;
    writeStore(store);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

app.delete('/credentials/:gatewayId', (req, res) => {
  try {
    getSecret();
    const store = readStore();
    if (store[req.params.gatewayId]) delete store[req.params.gatewayId];
    writeStore(store);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err.message || err) });
  }
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Gateway-keys server listening on ${PORT}`));
