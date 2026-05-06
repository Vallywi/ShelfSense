const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { readDB, writeDB } = require('./db');
const { signToken } = require('./auth-middleware');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  // LOGIN
  if (action === 'login') {
    try {
      const { email, password } = req.body;
      const db = await readDB();
      const emailKey = email.toLowerCase().trim();
      const user = db.users.find(u => u.email.toLowerCase().trim() === emailKey);
      
      if (!user) return res.status(401).json({ error: 'User not found' });
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: 'Incorrect password' });

      const token = signToken({ userId: user.id, email: user.email });
      return res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, onboardingCompleted: user.onboardingCompleted } });
    } catch (e) {
      return res.status(500).json({ error: 'Login failed' });
    }
  }

  // REGISTER
  if (action === 'register') {
    try {
      const { name, email, password } = req.body;
      const db = await readDB();
      const emailKey = email.toLowerCase().trim();
      if (db.users.some(u => u.email.toLowerCase().trim() === emailKey)) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = { id: crypto.randomUUID(), name, email: emailKey, passwordHash, onboardingCompleted: false, createdAt: new Date().toISOString() };
      db.users.push(user);
      await writeDB(db);

      const token = signToken({ userId: user.id, email: user.email });
      return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, onboardingCompleted: false } });
    } catch (e) {
      return res.status(500).json({ error: 'Registration failed' });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
};
