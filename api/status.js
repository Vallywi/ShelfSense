const { readDB } = require('./db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const isPersistent = !!process.env.KV_REST_API_URL;
  const db = await readDB();
  
  return res.status(200).json({
    status: 'online',
    database: isPersistent ? 'PERSISTENT (Cloud)' : 'TEMPORARY (Local Memory)',
    stats: {
      users: db.users.length,
      pantries: db.pantries.length,
      items: db.items.length
    },
    env: {
      has_kv_url: !!process.env.KV_REST_API_URL,
      has_kv_token: !!process.env.KV_REST_API_TOKEN
    }
  });
};
