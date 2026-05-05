const crypto = require('crypto');
const { readDB, writeDB } = require('../db');
const { verifyToken } = require('../auth-middleware');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  const db = await readDB();
  const userId = decoded.userId;

  // GET /api/items?pantryId=xxx — items in a pantry
  if (req.method === 'GET') {
    const { pantryId } = req.query;

    // If pantryId specified, return items for that pantry
    if (pantryId) {
      const isMember = db.pantry_members.some(m => m.pantryId === pantryId && m.userId === userId);
      if (!isMember) return res.status(403).json({ error: 'Not a member of this pantry' });

      const items = db.items
        .filter(i => i.pantryId === pantryId)
        .map(i => {
          const creator = db.users.find(u => u.id === i.createdBy);
          return { ...i, createdByName: creator ? creator.name : 'Unknown' };
        });
      return res.status(200).json({ items });
    }

    // No pantryId — return ALL items from all user's pantries
    const memberPantryIds = db.pantry_members
      .filter(m => m.userId === userId)
      .map(m => m.pantryId);
    const items = db.items
      .filter(i => memberPantryIds.includes(i.pantryId))
      .map(i => {
        const creator = db.users.find(u => u.id === i.createdBy);
        return { ...i, createdByName: creator ? creator.name : 'Unknown' };
      });
    return res.status(200).json({ items });
  }

  // POST /api/items — add item
  if (req.method === 'POST') {
    const { pantryId, name, category, quantity, expiryDate, status, imageUrl } = req.body;
    if (!name) return res.status(400).json({ error: 'Item name is required' });

    // If pantryId provided, verify membership
    let targetPantryId = pantryId;
    if (targetPantryId) {
      const isMember = db.pantry_members.some(m => m.pantryId === targetPantryId && m.userId === userId);
      if (!isMember) return res.status(403).json({ error: 'Not a member of this pantry' });
    } else {
      // Auto-assign to user's first pantry, or create a default one
      const memberEntry = db.pantry_members.find(m => m.userId === userId);
      if (memberEntry) {
        targetPantryId = memberEntry.pantryId;
      } else {
        // Create a default pantry
        const defaultPantry = {
          id: crypto.randomUUID(),
          name: 'My Pantry',
          ownerId: userId,
          inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          createdAt: new Date().toISOString(),
        };
        db.pantries.push(defaultPantry);
        db.pantry_members.push({ pantryId: defaultPantry.id, userId, joinedAt: defaultPantry.createdAt });
        targetPantryId = defaultPantry.id;
      }
    }

    const item = {
      id: crypto.randomUUID(),
      pantryId: targetPantryId,
      name: name.trim(),
      category: category || 'Others',
      quantity: quantity || '1',
      expiryDate: expiryDate || null,
      status: status || 'safe',
      imageUrl: imageUrl || null,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };
    db.items.push(item);
    await writeDB(db);

    const creator = db.users.find(u => u.id === userId);
    return res.status(201).json({ item: { ...item, createdByName: creator ? creator.name : 'You' } });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
