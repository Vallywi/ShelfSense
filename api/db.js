const { kv } = require('@vercel/kv');
const fs = require('fs');

// Local persistence file for local development
const LOCAL_DB_PATH = '/tmp/shelfsense_v2_db.json';

const DEFAULT_DB = {
  users: [],
  pantries: [],
  pantry_members: [],
  items: [],
};

// Truly persistent DB module
async function readDB() {
  try {
    // Detect Vercel KV / Upstash Redis URL (support multiple prefixes)
    const kvUrl = process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL;
    
    if (kvUrl) {
      const data = await kv.get('shelfsense_db');
      if (data) return data;
    }

    // 2. Fallback to local file (for local dev)
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Persistent DB read error:', e);
  }

  return JSON.parse(JSON.stringify(DEFAULT_DB));
}

async function writeDB(db) {
  try {
    // Detect Vercel KV / Upstash Redis URL
    const kvUrl = process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL;

    if (kvUrl) {
      await kv.set('shelfsense_db', db);
    }

    // 2. Always backup to local file
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Persistent DB write error:', e);
  }
}

module.exports = { readDB, writeDB };
