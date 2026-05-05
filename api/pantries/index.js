const crypto = require('crypto');
const { readDB, writeDB } = require('../db');
const { verifyToken } = require('../auth-middleware');

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  const db = await readDB();
  const userId = decoded.userId;

  // GET /api/pantries — return user's pantries
  if (req.method === 'GET') {
    const memberEntries = db.pantry_members.filter(m => m.userId === userId);
    const pantryIds = memberEntries.map(m => m.pantryId);
    const pantries = db.pantries
      .filter(p => pantryIds.includes(p.id))
      .map(p => {
        const members = db.pantry_members
          .filter(m => m.pantryId === p.id)
          .map(m => {
            const u = db.users.find(u => u.id === m.userId);
            return { userId: m.userId, name: u ? u.name : 'Unknown', joinedAt: m.joinedAt };
          });
        const itemCount = db.items.filter(i => i.pantryId === p.id).length;
        return { ...p, members, itemCount };
      });
    return res.status(200).json({ pantries });
  }

  // POST /api/pantries — create new pantry
  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Pantry name is required' });

    const pantry = {
      id: crypto.randomUUID(),
      name: name.trim(),
      ownerId: userId,
      inviteCode: generateInviteCode(),
      createdAt: new Date().toISOString(),
    };
    db.pantries.push(pantry);
    db.pantry_members.push({ pantryId: pantry.id, userId, joinedAt: new Date().toISOString() });
    await writeDB(db);

    const ownerUser = db.users.find(u => u.id === userId);
    return res.status(201).json({
      pantry: {
        ...pantry,
        members: [{ userId, name: ownerUser ? ownerUser.name : 'You', joinedAt: pantry.createdAt }],
        itemCount: 0,
      },
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
