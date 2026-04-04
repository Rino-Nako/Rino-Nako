import { NextRequest, NextResponse } from 'next/server';

type OpenAIContentPart =
  | { type: 'text'; text?: string }
  | { type: 'image_url'; image_url?: { url?: string } };

type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | OpenAIContentPart[];
};

const parseBearerToken = (authHeader: string) => authHeader.replace(/^Bearer\s+/i, '').trim();

const extractDataUrl = (url?: string) => {
  if (!url) return null;
  const match = url.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
};

const contentToText = (content: string | OpenAIContentPart[]) => {
  if (typeof content === 'string') return content;
  return content
    .map((part) => (part.type === 'text' ? part.text || '' : ''))
    .filter(Boolean)
    .join('');
};

const buildClaudePayload = (body: any) => {
  const messages: OpenAIMessage[] = Array.isArray(body?.messages) ? body.messages : [];
  const systemText = messages
    .filter((msg) => msg.role === 'system')
    .map((msg) => contentToText(msg.content))
    .filter(Boolean)
    .join('\n');

  const claudeMessages = messages
    .filter((msg) => msg.role !== 'system')
    .map((msg) => {
      const contentBlocks: any[] = [];
      if (typeof msg.content === 'string') {
        contentBlocks.push({ type: 'text', text: msg.content });
      } else {
        for (const part of msg.content) {
          if (part.type === 'text') {
            contentBlocks.push({ type: 'text', text: part.text || '' });
          } else if (part.type === 'image_url') {
            const parsed = extractDataUrl(part.image_url?.url);
            if (parsed) {
              contentBlocks.push({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: parsed.mimeType,
                  data: parsed.data,
                },
              });
            }
          }
        }
      }
      return {
        role: msg.role,
        content: contentBlocks.length ? contentBlocks : [{ type: 'text', text: '' }],
      };
    });

  const payload: any = {
    model: body?.model,
    max_tokens: body?.max_tokens ?? 1024,
    messages: claudeMessages,
  };
  if (systemText) payload.system = systemText;
  if (body?.temperature !== undefined) payload.temperature = body.temperature;
  if (body?.top_p !== undefined) payload.top_p = body.top_p;
  if (Array.isArray(body?.stop) && body.stop.length) payload.stop_sequences = body.stop;
  return payload;
};

const buildGeminiPayload = (body: any) => {
  const messages: OpenAIMessage[] = Array.isArray(body?.messages) ? body.messages : [];
  const systemText = messages
    .filter((msg) => msg.role === 'system')
    .map((msg) => contentToText(msg.content))
    .filter(Boolean)
    .join('\n');

  const contents = messages
    .filter((msg) => msg.role !== 'system')
    .map((msg) => {
      const parts: any[] = [];
      if (typeof msg.content === 'string') {
        parts.push({ text: msg.content });
      } else {
        for (const part of msg.content) {
          if (part.type === 'text') {
            parts.push({ text: part.text || '' });
          } else if (part.type === 'image_url') {
            const parsed = extractDataUrl(part.image_url?.url);
            if (parsed) {
              parts.push({
                inline_data: {
                  mime_type: parsed.mimeType,
                  data: parsed.data,
                },
              });
            }
          }
        }
      }
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: parts.length ? parts : [{ text: '' }],
      };
    });

  const generationConfig: any = {};
  if (body?.temperature !== undefined) generationConfig.temperature = body.temperature;
  if (body?.top_p !== undefined) generationConfig.topP = body.top_p;
  if (body?.max_tokens !== undefined) generationConfig.maxOutputTokens = body.max_tokens;
  if (Array.isArray(body?.stop) && body.stop.length) generationConfig.stopSequences = body.stop;

  const payload: any = { contents };
  if (systemText) {
    payload.system_instruction = { parts: [{ text: systemText }] };
  }
  if (Object.keys(generationConfig).length) {
    payload.generationConfig = generationConfig;
  }
  return payload;
};

const wrapOpenAIResponse = (content: string) => ({
  choices: [{ message: { content } }],
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('Authorization');
    const apiProvider = req.headers.get('X-Api-Provider') || 'zhipu';
    const baseUrl = req.headers.get('X-Base-Url');
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.log('[API] Received request. Auth header present:', !!authHeader);
      console.log('[API] Provider:', apiProvider);
    }

    if (!authHeader) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    if (apiProvider === 'claude') {
      const apiKey = parseBearerToken(authHeader);
      const payload = buildClaudePayload(body);
      const targetUrl = 'https://api.anthropic.com/v1/messages';
      const upstreamResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });

      const text = await upstreamResponse.text();
      if (!upstreamResponse.ok) {
        console.error('[API] Upstream error:', text);
        return new NextResponse(text, {
          status: upstreamResponse.status,
          headers: { 'Content-Type': upstreamResponse.headers.get('content-type') ?? 'application/json' },
        });
      }
      const data = JSON.parse(text);
      const content = Array.isArray(data?.content)
        ? data.content.map((part: any) => (part?.type === 'text' ? part.text : '')).filter(Boolean).join('')
        : '';
      return NextResponse.json(wrapOpenAIResponse(content));
    }

    if (apiProvider === 'gemini') {
      const apiKey = parseBearerToken(authHeader);
      const model = body?.model || 'gemini-3-flash-preview';
      const payload = buildGeminiPayload(body);
      const base = baseUrl ? baseUrl.replace(/\/+$/, '') : 'https://generativelanguage.googleapis.com/v1beta';
      const targetUrl = `${base}/models/${encodeURIComponent(model)}:generateContent`;
      const upstreamResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(payload),
      });
      const text = await upstreamResponse.text();
      if (!upstreamResponse.ok) {
        console.error('[API] Upstream error:', text);
        return new NextResponse(text, {
          status: upstreamResponse.status,
          headers: { 'Content-Type': upstreamResponse.headers.get('content-type') ?? 'application/json' },
        });
      }
      const data = JSON.parse(text);
      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      const content = Array.isArray(parts)
        ? parts.map((part: any) => part?.text || '').filter(Boolean).join('')
        : '';
      return NextResponse.json(wrapOpenAIResponse(content));
    }

    let targetUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

    if (apiProvider === 'openai' || apiProvider === 'zhipu') {
      if (baseUrl) {
        targetUrl = baseUrl.replace(/\/+$/, '') + '/chat/completions';
      } else if (apiProvider === 'openai') {
        targetUrl = 'https://api.openai.com/v1/chat/completions';
      }
    }

    const upstreamResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });
    if (isDev) {
      console.log('[API] Forwarding to:', targetUrl);
      console.log('[API] Upstream response status:', upstreamResponse.status);
    }

    if (body.stream) {
      return new NextResponse(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const contentType = upstreamResponse.headers.get('content-type') ?? 'application/json';
    const text = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      console.error('[API] Upstream error:', text);
    }

    return new NextResponse(text, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (e) {
    console.error('[API] Proxy error:', e);
    return NextResponse.json({ error: 'Proxy Error' }, { status: 500 });
  }
}
