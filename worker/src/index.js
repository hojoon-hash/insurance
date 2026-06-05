import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { calculateDetailedScore } from './diagnosis.js';

const app = new Hono();

// CORS: ALLOWED_ORIGINS(쉼표 구분) 환경변수가 있으면 그 도메인만 허용, 없으면 전체 허용.
app.use('*', cors({
  origin: (origin, c) => {
    const allowed = c.env.ALLOWED_ORIGINS;
    if (!allowed) return origin || '*';
    const list = allowed.split(',').map((s) => s.trim());
    return list.includes(origin) ? origin : '';
  },
}));

// ── 봇 차단: Turnstile 토큰 검증 ──────────────────────────────
// TURNSTILE_SECRET이 설정돼 있을 때만 강제한다(키 발급 전에는 폼이 막히지 않도록 통과).
const verifyTurnstile = async (secret, token, ip) => {
  if (!secret) return true; // 미설정 = 검증 생략(점진적 도입)
  if (!token) return false;
  try {
    const form = new URLSearchParams();
    form.append('secret', secret);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    return data.success === true;
  } catch (e) {
    console.error('⚠️ Turnstile 검증 오류:', e.message);
    return false;
  }
};

// ── 구글 시트 전송(지수 백오프 재시도) ───────────────────────
const sendToSheets = async (url, data) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.ok;
};

const sendToSheetsWithRetry = async (url, data, attempts = 3) => {
  for (let i = 0; i < attempts; i++) {
    try {
      if (await sendToSheets(url, data)) return true;
    } catch (e) {
      console.error(`⚠️ Sheets 전송 시도 ${i + 1} 실패:`, e.message);
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 500 * 2 ** i));
  }
  return false;
};

// 시트로 전송할 때 내부/검증용 필드는 제외한다.
const cleanForStore = (data) => {
  const { turnstileToken, company, ...rest } = data;
  return rest;
};

// KV에 leadId 기준으로 병합 저장(시트 upsert와 동일한 한 사람=한 레코드 원칙).
const upsertLeadKV = async (kv, leadId, incoming) => {
  const key = `lead:${leadId}`;
  let existing = {};
  try {
    const prev = await kv.get(key);
    if (prev) existing = JSON.parse(prev);
  } catch (e) { /* 손상 시 새로 시작 */ }
  const merged = { ...existing, ...incoming, leadId, updatedAt: new Date().toISOString() };
  if (!merged.createdAt) merged.createdAt = merged.updatedAt;
  await kv.put(key, JSON.stringify(merged));
  return merged;
};

// 시트로 보내고, 실패하면 pending 마커를 남겨 Cron이 나중에 재전송하도록 한다.
const syncToSheets = async (env, leadId, record) => {
  const url = env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) return;
  const ok = await sendToSheetsWithRetry(url, record);
  if (env.LEADS) {
    if (ok) await env.LEADS.delete(`pending:${leadId}`);
    else await env.LEADS.put(`pending:${leadId}`, new Date().toISOString());
  }
};

app.post('/api/diagnosis', async (c) => {
  try {
    const answers = await c.req.json();
    const result = calculateDetailedScore(answers);
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Diagnosis Error:', error);
    return c.json({ success: false, error: 'Failed to calculate diagnosis' }, 500);
  }
});

app.post('/api/lead', async (c) => {
  try {
    const body = await c.req.json();

    // 1) 허니팟: 숨김 필드(company)가 채워져 있으면 봇 → 성공한 척하고 버린다.
    if (body.company) {
      console.warn('🕳️ Honeypot 차단');
      return c.json({ success: true, message: '상담 신청이 완료되었습니다.' });
    }

    // 2) Turnstile 검증(시크릿 설정 시에만 강제)
    const ip = c.req.header('CF-Connecting-IP');
    const ok = await verifyTurnstile(c.env.TURNSTILE_SECRET, body.turnstileToken, ip);
    if (!ok) {
      return c.json({ success: false, error: '봇 검증에 실패했습니다. 다시 시도해주세요.' }, 403);
    }

    // 3) leadId 확보(없으면 생성)
    const leadId = body.leadId || crypto.randomUUID();
    const incoming = cleanForStore({ ...body, leadId });

    // 4) KV에 먼저 영구 저장(유실 방지) — 시트 전송 성공 여부와 무관하게 리드는 보존된다.
    let merged = incoming;
    if (c.env.LEADS) {
      merged = await upsertLeadKV(c.env.LEADS, leadId, incoming);
    }

    console.log('🎯 New Lead:', { leadId, name: merged.name, phone: merged.phone, stage: merged.stage });

    // 5) 시트 전송은 응답을 막지 않도록 waitUntil로 처리(재시도/실패 시 pending 마킹 포함)
    if (c.env.GOOGLE_SHEETS_WEBHOOK_URL) {
      c.executionCtx.waitUntil(syncToSheets(c.env, leadId, merged));
    }

    return c.json({ success: true, message: '상담 신청이 완료되었습니다.', leadId });
  } catch (error) {
    console.error('❌ Lead Capture Error:', error);
    return c.json({ success: false, error: 'Failed to save lead information' }, 500);
  }
});

app.get('/health', (c) => c.json({ status: 'OK', timestamp: new Date().toISOString() }));

// ── Cron: 시트 전송에 실패해 보존된 pending 리드를 재전송 ──────
const retryPendingLeads = async (env) => {
  if (!env.LEADS || !env.GOOGLE_SHEETS_WEBHOOK_URL) return;
  const { keys } = await env.LEADS.list({ prefix: 'pending:' });
  for (const { name } of keys) {
    const leadId = name.slice('pending:'.length);
    const raw = await env.LEADS.get(`lead:${leadId}`);
    if (!raw) {
      await env.LEADS.delete(name); // 본 레코드가 없으면 마커만 정리
      continue;
    }
    const ok = await sendToSheetsWithRetry(env.GOOGLE_SHEETS_WEBHOOK_URL, JSON.parse(raw), 2);
    if (ok) await env.LEADS.delete(name);
  }
};

export default {
  fetch: app.fetch,
  scheduled: async (event, env, ctx) => {
    ctx.waitUntil(retryPendingLeads(env));
  },
};
