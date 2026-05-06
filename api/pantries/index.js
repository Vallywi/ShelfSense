const crypto = require('crypto');
const { readDB, writeDB } = require('../db');
const { verifyToken } = require('../auth-middleware');

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  const db = await readDB();
  const userId = decoded.userId;
  const { action } = req.query;

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

  // POST /api/pantries
  if (req.method === 'POST') {
    // JOIN
    if (action === 'join') {
      const { inviteCode } = req.body;
      if (!inviteCode) return res.status(400).json({ error: 'Invite code is required' });
      const code = inviteCode.trim().toUpperCase();
      const pantry = db.pantries.find(p => p.inviteCode === code);
      if (!pantry) return res.status(404).json({ error: 'Pantry not found' });
      if (db.pantry_members.some(m => m.pantryId === pantry.id && m.userId === userId)) {
        return res.status(409).json({ error: 'Already a member' });
      }
      db.pantry_members.push({ pantryId: pantry.id, userId, joinedAt: new Date().toISOString() });
      await writeDB(db);
      return res.status(200).json({ success: true, pantryId: pantry.id });
    }

    // CREATE
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Pantry name required' });
    const pantry = { id: crypto.randomUUID(), name: name.trim(), ownerId: userId, inviteCode: generateInviteCode(), createdAt: new Date().toISOString() };
    db.pantries.push(pantry);
    db.pantry_members.push({ pantryId: pantry.id, userId, joinedAt: new Date().toISOString() });
    await writeDB(db);
    return res.status(201).json({ pantry });
  }

  // DELETE /api/pantries?action=remove — Kick or Leave
  if (req.method === 'DELETE' && action === 'remove') {
    const { pantryId, memberId } = req.body;
    const targetUserId = memberId || userId;
    const pantry = db.pantries.find(p => p.id === pantryId);
    if (!pantry) return res.status(404).json({ error: 'Pantry not found' });

    const isOwner = pantry.ownerId === userId;
    const isSelf = targetUserId === userId;

    if (!isSelf && !isOwner) return res.status(403).json({ error: 'Forbidden' });
    if (isSelf && isOwner) return res.status(400).json({ error: 'Owners cannot leave' });

    db.pantry_members = db.pantry_members.filter(m => !(m.pantryId === pantryId && m.userId === targetUserId));
    await writeDB(db);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
