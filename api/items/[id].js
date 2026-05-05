const { readDB, writeDB } = require('../db');
const { verifyToken } = require('../auth-middleware');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  const db = await readDB();
  const userId = decoded.userId;

  const itemIndex = db.items.findIndex(i => i.id === id);
  if (itemIndex === -1) return res.status(404).json({ error: 'Item not found' });

  const item = db.items[itemIndex];

  // Verify user is a member of the item's pantry
  const isMember = db.pantry_members.some(m => m.pantryId === item.pantryId && m.userId === userId);
  if (!isMember) return res.status(403).json({ error: 'Not a member of this pantry' });

  // PUT — update item
  if (req.method === 'PUT') {
    const { name, category, quantity, expiryDate, status } = req.body;
    if (name !== undefined) db.items[itemIndex].name = name;
    if (category !== undefined) db.items[itemIndex].category = category;
    if (quantity !== undefined) db.items[itemIndex].quantity = quantity;
    if (expiryDate !== undefined) db.items[itemIndex].expiryDate = expiryDate;
    if (status !== undefined) db.items[itemIndex].status = status;
    await writeDB(db);
    return res.status(200).json({ item: db.items[itemIndex] });
  }

  // DELETE — remove item
  if (req.method === 'DELETE') {
    db.items.splice(itemIndex, 1);
    await writeDB(db);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
