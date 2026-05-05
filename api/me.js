const { readDB, writeDB } = require('./db');
const { verifyToken } = require('./auth-middleware');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  const db = await readDB();
  const user = db.users.find(u => u.id === decoded.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (req.method === 'GET') {
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt,
      },
    });
  }

  if (req.method === 'PUT') {
    const { name, age, gender, onboardingCompleted } = req.body;
    if (name !== undefined) user.name = name;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (onboardingCompleted !== undefined) user.onboardingCompleted = onboardingCompleted;
    await writeDB(db);
    return res.status(200).json({
      user: {
        id: user.id, name: user.name, email: user.email,
        age: user.age, gender: user.gender,
        onboardingCompleted: user.onboardingCompleted, createdAt: user.createdAt,
      },
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
