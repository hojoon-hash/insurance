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

// 구글 시트(Apps Script 웹앱)로 리드 전달. 실패해도 사용자 응답은 막지 않음.
const forwardLeadToSheets = async (url, leadData) => {
  if (!url) return;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
    });
    if (!response.ok) {
      console.error(`⚠️ Google Sheets 전송 실패: HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('⚠️ Google Sheets 전송 오류:', error.message);
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
    const leadData = { ...body, timestamp: new Date().toISOString() };

    console.log('🎯 New Lead:', { name: leadData.name, phone: leadData.phone, score: leadData.score });

    await forwardLeadToSheets(c.env.GOOGLE_SHEETS_WEBHOOK_URL, leadData);

    return c.json({ success: true, message: '상담 신청이 완료되었습니다.' });
  } catch (error) {
    console.error('❌ Lead Capture Error:', error);
    return c.json({ success: false, error: 'Failed to save lead information' }, 500);
  }
});

app.get('/health', (c) => c.json({ status: 'OK', timestamp: new Date().toISOString() }));

export default app;
