import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { sign, verify } from 'hono/jwt'
import { CreateLinkSchema, LoginSchema } from 'shared'

type Bindings = {
  DATABASE: D1Database;
  KV_NAMESPACE: KVNamespace;
  JWT_SECRET: string;
  ADMIN_PASSWORD: string;
  BASE_URL: string;
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())
app.use('*', secureHeaders())

// Rate limiting using KV (simple implementation for URL creation)
const rateLimiter = async (c: any, next: any) => {
  const ip = c.req.header('CF-Connecting-IP') || '0.0.0.0';
  const key = `rate_limit:${ip}`;
  const currentCountStr = await c.env.KV_NAMESPACE.get(key);
  const currentCount = currentCountStr ? parseInt(currentCountStr) : 0;

  if (currentCount >= 10) {
    return c.json({ error: 'Too many requests. Limit 10 per minute.' }, 429);
  }

  await c.env.KV_NAMESPACE.put(key, (currentCount + 1).toString(), { expirationTtl: 60 });
  await next();
}

// Custom alias / short code generator
function generateShortCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Redirect Route
app.get('/:shortCode', async (c) => {
  const shortCode = c.req.param('shortCode');

  if (shortCode.startsWith('api')) return c.notFound(); // Skip API routes

  let cachedDataStr = await c.env.KV_NAMESPACE.get(`short:${shortCode}`);
  let originalUrl: string | null = null;
  let linkId: number | null = null;

  if (!cachedDataStr) {
    const stmt = c.env.DATABASE.prepare(
      'SELECT id, original_url, active FROM links WHERE short_code = ? OR custom_alias = ?'
    );
    const link = await stmt.bind(shortCode, shortCode).first<{ id: number, original_url: string, active: number }>();

    if (!link) {
      return c.text('URL not found', 404);
    }

    if (link.active === 0) {
      return c.text('URL disabled', 403);
    }

    originalUrl = link.original_url;
    linkId = link.id;

    await c.env.KV_NAMESPACE.put(`short:${shortCode}`, JSON.stringify({ originalUrl, linkId }), { expirationTtl: 3600 });
  } else {
    const data = JSON.parse(cachedDataStr);
    originalUrl = data.originalUrl;
    linkId = data.linkId;
  }

  if (linkId !== null && originalUrl !== null) {
    const cf = (c.req.raw as any).cf as any || {};
    const country = cf.country || null;
    const city = cf.city || null;
    const userAgent = c.req.header('User-Agent') || null;
    const referrer = c.req.header('Referer') || null;
    const ip = c.req.header('CF-Connecting-IP') || '0.0.0.0';

    const ipHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))
          .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));

    let browser = 'Unknown';
    if (userAgent?.includes('Chrome')) browser = 'Chrome';
    else if (userAgent?.includes('Firefox')) browser = 'Firefox';
    else if (userAgent?.includes('Safari')) browser = 'Safari';

    let os = 'Unknown';
    if (userAgent?.includes('Windows')) os = 'Windows';
    else if (userAgent?.includes('Mac')) os = 'MacOS';
    else if (userAgent?.includes('Linux')) os = 'Linux';
    else if (userAgent?.includes('Android')) os = 'Android';
    else if (userAgent?.includes('iOS')) os = 'iOS';

    const device = os === 'Android' || os === 'iOS' ? 'Mobile' : 'Desktop';

    const p1 = c.env.DATABASE.prepare(
      'UPDATE links SET clicks = clicks + 1 WHERE id = ?'
    ).bind(linkId).run();

    const p2 = c.env.DATABASE.prepare(
      `INSERT INTO analytics
       (link_id, country, city, browser, os, device, referrer, user_agent, ip_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(linkId, country, city, browser, os, device, referrer, userAgent, ipHash).run();

    c.executionCtx.waitUntil(Promise.all([p1, p2]).catch(console.error));
  }

  return c.redirect(originalUrl as string, 301);
});

// Auth middleware for admin routes
const authMiddleware = async (c: any, next: any) => {
  let token = c.req.header('Authorization')?.split(' ')[1];

  if (!token) {
    const cookieHeader = c.req.header('Cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\\s*)token=([^;]*)/);
      token = match ? match[1] : undefined;
    }
  }

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  try {
    await verify(token, c.env.JWT_SECRET, 'HS256');
    await next();
  } catch (e) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}

app.post('/api/login', async (c) => {
  const body = await c.req.json();
  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.format() }, 400);
  }

  if (parsed.data.password === c.env.ADMIN_PASSWORD) {
    const token = await sign({ role: 'admin', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, c.env.JWT_SECRET, 'HS256');
    return c.json({ token });
  }
  return c.json({ error: 'Invalid credentials' }, 401);
});


app.post('/api/shorten', rateLimiter, async (c) => {
  try {
    const body = await c.req.json();
    const parsed = CreateLinkSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { url, customAlias } = parsed.data;

    if (url.toLowerCase().startsWith('javascript:') || url.toLowerCase().startsWith('ftp:')) {
       return c.json({ error: 'Invalid URL protocol' }, 400);
    }

    let shortCode = customAlias || generateShortCode();

    try {
       const stmt = c.env.DATABASE.prepare(
         'INSERT INTO links (short_code, original_url, custom_alias) VALUES (?, ?, ?)'
       );
       const result = await stmt.bind(shortCode, url, customAlias || null).run();

       const baseUrl = c.env.BASE_URL;

       return c.json({
         id: result.meta.last_row_id,
         shortCode,
         shortUrl: `${baseUrl}/${shortCode}`
       });
    } catch (e: any) {
      // Handle unique constraint violations
      if (e.message?.includes('UNIQUE constraint failed')) {
         return c.json({ error: 'Alias or short code already exists' }, 409);
      }
      throw e;
    }

  } catch (e) {
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});


app.get('/api/links', authMiddleware, async (c) => {
  const stmt = c.env.DATABASE.prepare('SELECT * FROM links ORDER BY created_at DESC');
  const { results } = await stmt.all();
  return c.json({ links: results });
});


app.get('/api/analytics/:id', authMiddleware, async (c) => {
  const linkId = c.req.param('id');

  const linkStmt = c.env.DATABASE.prepare('SELECT * FROM links WHERE id = ?');
  const link = await linkStmt.bind(linkId).first();

  if (!link) {
    return c.json({ error: 'Link not found' }, 404);
  }

  const stmt = c.env.DATABASE.prepare('SELECT * FROM analytics WHERE link_id = ? ORDER BY timestamp DESC');
  const { results } = await stmt.all();

  return c.json({
    link,
    analytics: results
  });
});

app.put('/api/link/:id', authMiddleware, async (c) => {
  const linkId = c.req.param('id');
  const { original_url, active, custom_alias } = await c.req.json();

  const stmt = c.env.DATABASE.prepare(
    'UPDATE links SET original_url = coalesce(?, original_url), active = coalesce(?, active), custom_alias = coalesce(?, custom_alias) WHERE id = ? RETURNING *'
  );

  const result = await stmt.bind(original_url ?? null, active ?? null, custom_alias ?? null, linkId).first<{short_code: string}>();

  if (result) {
    // Invalidate Cache
    await c.env.KV_NAMESPACE.delete(`short:${result.short_code}`);
    if (custom_alias) {
       await c.env.KV_NAMESPACE.delete(`short:${custom_alias}`);
    }
  }

  return c.json({ success: true });
});

app.delete('/api/link/:id', authMiddleware, async (c) => {
  const linkId = c.req.param('id');

  const linkStmt = c.env.DATABASE.prepare('SELECT short_code, custom_alias FROM links WHERE id = ?');
  const link = await linkStmt.bind(linkId).first<{short_code: string, custom_alias: string | null}>();

  if (link) {
     const stmt = c.env.DATABASE.prepare('DELETE FROM links WHERE id = ?');
     await stmt.bind(linkId).run();

     await c.env.KV_NAMESPACE.delete(`short:${link.short_code}`);
     if (link.custom_alias) {
       await c.env.KV_NAMESPACE.delete(`short:${link.custom_alias}`);
     }
  }

  return c.json({ success: true });
});


export default app