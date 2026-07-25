/**
 * 本地直播服务（真实直播间接入用）
 *
 * 用法：
 *   cd app && npm run build && node scripts/live-relay.mjs
 *   或 npm run live（先构建再启动）
 *
 * 能力：
 *   1. 静态托管 app/dist（OBS 浏览器源指向 http://localhost:7210/live/）
 *   2. POST /api/gift  接收礼物事件 { id, nickname, giftName, diamond }
 *      → 实时推送给所有打开的直播页（SSE）并追加写入 data/live-YYYYMMDD.jsonl
 *   3. GET  /api/events SSE 事件流（直播页自动连接）
 *   4. GET  /api/health 健康检查
 *
 * 说明：全部本地运行，不上传任何数据；jsonl 落盘用于每场直播后的复盘优化。
 */
import { createServer } from 'node:http';
import { readFile, mkdir, appendFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const DATA_DIR = path.resolve(__dirname, '../data');
const PORT = Number(process.env.LIVE_PORT || 7210);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8',
};

/** @type {Set<import('node:http').ServerResponse>} */
const sseClients = new Set();

function broadcastGift(gift) {
  const frame = `event: gift\ndata: ${JSON.stringify(gift)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(frame);
    } catch {
      sseClients.delete(res);
    }
  }
}

async function persistGift(gift) {
  await mkdir(DATA_DIR, { recursive: true });
  const day = new Date().toISOString().slice(0, 10);
  await appendFile(path.join(DATA_DIR, `live-${day}.jsonl`), JSON.stringify(gift) + '\n', 'utf-8');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 64 * 1024) req.destroy();
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  // CORS：允许油猴脚本从 live.douyin.com 域名 POST
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true, sse: sseClients.size }));
    return;
  }

  if (url.pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(': connected\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  if (url.pathname === '/api/gift' && req.method === 'POST') {
    try {
      const body = JSON.parse(await readBody(req));
      const gift = {
        id: String(body.id ?? `ext-${Date.now()}`),
        nickname: String(body.nickname ?? '神秘人').slice(0, 24),
        giftName: String(body.giftName ?? '礼物').slice(0, 24),
        diamond: Math.max(0, Number(body.diamond) || 0),
        at: Date.now(),
        source: String(body.source ?? 'external').slice(0, 32),
      };
      broadcastGift(gift);
      await persistGift(gift);
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: false, error: String(e) }));
    }
    return;
  }

  if (url.pathname === '/api/debug' && req.method === 'POST') {
    // 调试样本落盘：油猴脚本捕获的原始 DOM 片段，供本地分析（不上传任何数据）
    try {
      const raw = await readBody(req);
      await mkdir(DATA_DIR, { recursive: true });
      const day = new Date().toISOString().slice(0, 10);
      const entry = JSON.stringify({ at: Date.now(), ...JSON.parse(raw || '{}') });
      await appendFile(path.join(DATA_DIR, `debug-${day}.jsonl`), entry + '\n', 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: false, error: String(e) }));
    }
    return;
  }

  // 静态文件（SPA 兜底到对应目录的 index.html）
  let filePath = path.join(DIST, decodeURIComponent(url.pathname));
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const st = await stat(filePath);
    if (st.isDirectory()) filePath = path.join(filePath, 'index.html');
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404).end('not found');
  }
});

server.listen(PORT, () => {
  console.log(`[live-relay] 直播互动台: http://localhost:${PORT}/live/`);
  console.log(`[live-relay] 礼物事件接收: POST http://localhost:${PORT}/api/gift`);
  console.log(`[live-relay] 数据落盘目录: ${DATA_DIR}`);
});
