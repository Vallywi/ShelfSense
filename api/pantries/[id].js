const { readDB, writeDB } = require('../db');
const { verifyToken } = require('../auth-middleware');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  const db = await readDB();
  const userId = decoded.userId;
  const pantry = db.pantries.find(p => p.id === id);
  if (!pantry) return res.status(404).json({ error: 'Pantry not found' });

  // Check membership
  const isMember = db.pantry_members.some(m => m.pantryId === id && m.userId === userId);
  if (!isMember) return res.status(403).json({ error: 'You are not a member of this pantry' });

  // GET — pantry detail with members + items
  if (req.method === 'GET') {
    const members = db.pantry_members
      .filter(m => m.pantryId === id)
      .map(m => {
        const u = db.users.find(u => u.id === m.userId);
        return { userId: m.userId, name: u ? u.name : 'Unknown', joinedAt: m.joinedAt };
      });
    const items = db.items
      .filter(i => i.pantryId === id)
      .map(i => {
        const creator = db.users.find(u => u.id === i.createdBy);
        return { ...i, createdByName: creator ? creator.name : 'Unknown' };
      });
    return res.status(200).json({ pantry: { ...pantry, members, items } });
  }

  // DELETE — owner only
  if (req.method === 'DELETE') {
    if (pantry.ownerId !== userId) return res.status(403).json({ error: 'Only the owner can delete this pantry' });

    db.pantries = db.pantries.filter(p => p.id !== id);
    db.pantry_members = db.pantry_members.filter(m => m.pantryId !== id);
    db.items = db.items.filter(i => i.pantryId !== id);
    await writeDB(db);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
