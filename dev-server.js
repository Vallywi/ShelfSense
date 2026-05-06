// Lightweight dev server that emulates Vercel's serverless API routing.
// Loads every api/**/*.js file and mounts it at the matching URL path,
// so the same backend code that runs on Vercel runs locally too.
//
// Usage:  node dev-server.js   (or `npm run api`)
// The frontend (npm run web) will call http://localhost:3000/api/...

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Auto-load .env if present (Node 20.12+)
try {
  if (fs.existsSync(path.join(__dirname, '.env')) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(path.join(__dirname, '.env'));
    console.log('🔑 Loaded .env');
  }
} catch (e) {
  console.warn('Could not load .env:', e.message);
}

const API_DIR = path.join(__dirname, 'api');
const PORT = process.env.PORT || 3000;

// ── Build route map by walking api/ ─────────────────────────────────
function buildRoutes() {
  const routes = [];
  function walk(dir, prefix) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, `${prefix}/${entry.name}`);
      } else if (entry.name.endsWith('.js')) {
        const base = entry.name.replace(/\.js$/, '');
        let routePath;
        let paramName = null;
        if (base === 'index') {
          routePath = prefix;
        } else if (base.startsWith('[') && base.endsWith(']')) {
          paramName = base.slice(1, -1);
          routePath = `${prefix}/__PARAM__`;
        } else {
          routePath = `${prefix}/${base}`;
        }
        try {
          const handler = require(fullPath);
          routes.push({ routePath, paramName, handler, fullPath });
        } catch (e) {
          console.error(`Failed to load ${fullPath}:`, e.message);
        }
      }
    }
  }
  walk(API_DIR, '/api');
  return routes;
}

function matchRoute(routes, pathname) {
  // Exact match first (static routes win over dynamic ones)
  for (const r of routes) {
    if (!r.paramName && r.routePath === pathname) {
      return { handler: r.handler, params: {} };
    }
  }
  // Dynamic match (e.g. /api/items/__PARAM__ matches /api/items/abc123)
  for (const r of routes) {
    if (r.paramName) {
      const prefix = r.routePath.replace('/__PARAM__', '');
      if (pathname.startsWith(prefix + '/')) {
        const rest = pathname.slice(prefix.length + 1);
        if (rest && !rest.includes('/')) {
          return { handler: r.handler, params: { [r.paramName]: rest } };
        }
      }
    }
  }
  return null;
}

// ── Vercel-compatible response wrapper ──────────────────────────────
function wrapRes(res) {
  let statusCode = 200;
  const w = {
    status(code) { statusCode = code; return w; },
    json(obj) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
      }
      res.end(JSON.stringify(obj));
      return w;
    },
    setHeader(k, v) { res.setHeader(k, v); return w; },
    end(body) {
      if (!res.headersSent) res.writeHead(statusCode);
      res.end(body);
      return w;
    },
    send(body) {
      if (!res.headersSent) res.writeHead(statusCode);
      res.end(typeof body === 'string' ? body : JSON.stringify(body));
      return w;
    },
  };
  return w;
}

// ── Build server ────────────────────────────────────────────────────
const routes = buildRoutes();

console.log('\n🟢 Loaded API routes:');
for (const r of routes) {
  const display = r.paramName ? r.routePath.replace('__PARAM__', `:${r.paramName}`) : r.routePath;
  console.log(`   ${display.padEnd(28)} → ${path.relative(__dirname, r.fullPath)}`);
}

const server = http.createServer(async (req, res) => {
  // Permissive CORS for dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (!pathname.startsWith('/api')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not an API route. Frontend is on http://localhost:8081' }));
    return;
  }

  const match = matchRoute(routes, pathname);
  if (!match) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Route not found: ${pathname}` }));
    return;
  }

  // Read body
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', async () => {
    let parsedBody = {};
    if (body) {
      try { parsedBody = JSON.parse(body); }
      catch { parsedBody = body; }
    }

    const vercelReq = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: { ...parsed.query, ...match.params },
      body: parsedBody,
    };

    const vercelRes = wrapRes(res);

    try {
      await match.handler(vercelReq, vercelRes);
    } catch (err) {
      console.error(`✗ ${req.method} ${pathname} →`, err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error: ' + err.message }));
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ ShelfSense API server running on http://localhost:${PORT}`);
  console.log(`   Now run "npm run web" in another terminal to start the frontend.\n`);
});
