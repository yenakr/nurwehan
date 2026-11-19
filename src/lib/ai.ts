// AI 호출 공통 모듈. 키와 모델은 환경변수로만 받는다(코드에 넣지 않는다).
// AI_API_KEY 필수, AI_PROVIDER = 'anthropic'(기본) | 'openai', AI_MODEL 선택
export type ChatMsg = { role: 'user' | 'assistant'; content: string };

export const aiConfigured = () => !!process.env.AI_API_KEY;

export async function askModel(system: string, messages: ChatMsg[]): Promise<string | null> {
  const key = process.env.AI_API_KEY;
  if (!key) return null;
  const provider = process.env.AI_PROVIDER === 'openai' ? 'openai' : 'anthropic';
  try {
    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'gpt-4o-mini',
          max_tokens: 400,
          messages: [{ role: 'system', content: system }, ...messages],
        }),
      });
      if (!res.ok) return null;
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
    if (!res.ok) return null;
    const j = await res.json();
    return j?.content?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}
