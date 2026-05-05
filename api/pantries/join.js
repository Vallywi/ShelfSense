const { readDB, writeDB } = require('../db');
const { verifyToken } = require('../auth-middleware');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ error: 'Invite code is required' });

  const db = await readDB();
  const userId = decoded.userId;
  const code = inviteCode.trim().toUpperCase();

  const pantry = db.pantries.find(p => p.inviteCode === code);
  if (!pantry) return res.status(404).json({ error: 'Pantry not found. Check the invite code.' });

  const alreadyMember = db.pantry_members.find(m => m.pantryId === pantry.id && m.userId === userId);
  if (alreadyMember) return res.status(409).json({ error: 'You are already a member of this pantry' });

  db.pantry_members.push({ pantryId: pantry.id, userId, joinedAt: new Date().toISOString() });
  await writeDB(db);

  const members = db.pantry_members
    .filter(m => m.pantryId === pantry.id)
    .map(m => {
      const u = db.users.find(u => u.id === m.userId);
      return { userId: m.userId, name: u ? u.name : 'Unknown', joinedAt: m.joinedAt };
    });
  const itemCount = db.items.filter(i => i.pantryId === pantry.id).length;

  return res.status(200).json({ pantry: { ...pantry, members, itemCount } });
};
