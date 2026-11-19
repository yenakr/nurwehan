// AI 호출 공통 모듈. 키와 모델은 환경변수로만 받는다(코드에 넣지 않는다).
// AI_API_KEY 필수, AI_PROVIDER = 'gemini'(기본) | 'openai' | 'anthropic', AI_MODEL 선택
export type ChatMsg = { role: 'user' | 'assistant'; content: string };

// 실패 원인은 서버 로그에만 남긴다(키는 응답에 없다)
async function fail(res: Response): Promise<null> {
  console.error('[ai] http', res.status, (await res.text().catch(() => '')).slice(0, 300));
  return null;
}

// 일시 과부하(503)·한도(429)면 잠깐 기다렸다 최대 2번 더 시도한다
async function withRetry(call: () => Promise<Response>): Promise<Response> {
  let res = await call();
  for (let i = 0; i < 2 && (res.status === 503 || res.status === 429); i++) {
    await new Promise(r => setTimeout(r, 1200 * (i + 1)));
    res = await call();
  }
  return res;
}

export const aiConfigured = () => !!process.env.AI_API_KEY;

export async function askModel(system: string, messages: ChatMsg[]): Promise<string | null> {
  const key = process.env.AI_API_KEY;
  if (!key) return null;
  const provider = process.env.AI_PROVIDER === 'openai' ? 'openai' : process.env.AI_PROVIDER === 'anthropic' ? 'anthropic' : 'gemini';
  try {
    if (provider === 'gemini') {
      const model = process.env.AI_MODEL || 'gemini-3.8-flash';
      const res = await withRetry(() => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          generationConfig: {
            maxOutputTokens: 1200,
          },
        }),
      }));
      if (!res.ok) return fail(res);
      const j = await res.json();
      const t = (j?.candidates?.[0]?.content?.parts || []).map((x: { text?: string }) => x.text || '').join('').trim();
      return t || null;
    }
    if (provider === 'openai') {
      const res = await withRetry(() => fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'gpt-4o-mini',
          max_completion_tokens: 1200,
          messages: [{ role: 'system', content: system }, ...messages],
        }),
      }));
      if (!res.ok) return fail(res);
      const j = await res.json();
      return j?.choices?.[0]?.message?.content?.trim() || null;
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'claude-haiku-5-5',
        max_tokens: 400,
        system,
        messages,
      }),
    });
    if (!res.ok) return fail(res);
    const j = await res.json();
    return j?.content?.[0]?.text?.trim() || null;
  } catch (e) {
    console.error('[ai] fetch error', e instanceof Error ? e.message : e);
    return null;
  }
}
