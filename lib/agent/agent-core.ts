import { SYSTEM_PROMPT } from '@/lib/prompts/prompts';

export type AgentActionType =
  | 'launch'
  | 'click'
  | 'double_click'
  | 'long_press'
  | 'swipe'
  | 'input'
  | 'home'
  | 'back'
  | 'wait'
  | 'finish'
  | 'take_over'
  | 'error';

export interface AgentAction {
  type: AgentActionType;
  params: unknown[];
  thought?: string;
  raw?: string;
}

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: any;
};

const extractTag = (text: string, tag: 'think' | 'answer') => {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = text.match(re);
  return m?.[1]?.trim();
};

const tryParseJsonAction = (text: string): AgentAction | null => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[0]);
    let type = typeof data.action === 'string' ? data.action.toLowerCase() : 'error';
    let params = Array.isArray(data.params) ? data.params : [];

    // Handle "Launch" with "target" object
    if (type === 'launch' && params.length === 0 && data.target?.package_name) {
      params = [data.target.package_name];
    }

    const thought = typeof data.thought === 'string' ? data.thought : undefined;
    return { type: type as AgentActionType, params, thought, raw: text };
  } catch {
    return null;
  }
};

const stripQuotes = (s: string) => {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
};

const parseDoOrFinish = (answerText: string, thought?: string): AgentAction => {
  const raw = answerText.trim();

  // Try to match finish(...) anywhere in the text
  const finishMatch = raw.match(/finish\s*\(([\s\S]*?)\)/i);
  if (finishMatch) {
    const args = finishMatch[1];
    const msgMatch = args.match(/message\s*=\s*("([\s\S]*?)"|'([\s\S]*?)')/i);
    const message = msgMatch ? (msgMatch[2] ?? msgMatch[3] ?? '') : '';
    return { type: 'finish', params: [message], thought, raw };
  }

  // Try to match do(...) anywhere in the text
  const doMatch = raw.match(/do\s*\(([\s\S]*?)\)/i);
  if (!doMatch) {
    return { type: 'error', params: [], thought, raw };
  }

  const args = doMatch[1];
  const actionMatch = args.match(/action\s*=\s*("([^"]+)"|'([^']+)')/i);
  const actionName = actionMatch ? (actionMatch[2] ?? actionMatch[3] ?? '') : '';

  const getPoint = (key: string): [number, number] | null => {
    const re = new RegExp(`${key}\\s*=\\s*\\[\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\]`, 'i');
    const m = args.match(re);
    if (!m) return null;
    return [Number(m[1]), Number(m[2])];
  };

  const getText = (): string => {
    const m = args.match(/text\s*=\s*("([\s\S]*?)"|'([\s\S]*?)')/i);
    return m ? (m[2] ?? m[3] ?? '') : '';
  };

  const getApp = (): string => {
    const m = args.match(/app\s*=\s*("([\s\S]*?)"|'([\s\S]*?)')/i);
    return m ? (m[2] ?? m[3] ?? '') : '';
  };

  const getDurationSeconds = (): number => {
    const m = args.match(/duration\s*=\s*("([^"]+)"|'([^']+)')/i);
    const s = m ? (m[2] ?? m[3] ?? '') : '';
    const num = Number(String(s).replace(/seconds?/i, '').trim());
    return Number.isFinite(num) ? num : 1;
  };

  const normalized = actionName.trim();

  if (normalized === 'Launch') return { type: 'launch', params: [getApp()], thought, raw };
  if (normalized === 'Tap') {
    const p = getPoint('element');
    return { type: 'click', params: p ? [p[0], p[1]] : [], thought, raw };
  }
  if (normalized === 'Double Tap') {
    const p = getPoint('element');
    return { type: 'double_click', params: p ? [p[0], p[1]] : [], thought, raw };
  }
  if (normalized === 'Long Press') {
    const p = getPoint('element');
    return { type: 'long_press', params: p ? [p[0], p[1]] : [], thought, raw };
  }
  if (normalized === 'Swipe') {
    const start = getPoint('start');
    const end = getPoint('end');
    return {
      type: 'swipe',
      params: start && end ? [start[0], start[1], end[0], end[1]] : [],
      thought,
      raw,
    };
  }
  if (normalized === 'Type' || normalized === 'Type_Name') return { type: 'input', params: [getText()], thought, raw };
  if (normalized === 'Back') return { type: 'back', params: [], thought, raw };
  if (normalized === 'Home') return { type: 'home', params: [], thought, raw };
  if (normalized === 'Wait') return { type: 'wait', params: [getDurationSeconds()], thought, raw };
  if (normalized === 'Take_over') return { type: 'take_over', params: [], thought, raw };

  return { type: 'error', params: [stripQuotes(actionName)], thought, raw };
};

export function parseAgentResponse(responseText: string): AgentAction {
  const json = tryParseJsonAction(responseText);
  if (json) return json;

  const thought = extractTag(responseText, 'think');
  const answer = extractTag(responseText, 'answer') ?? responseText;
  return parseDoOrFinish(answer, thought);
}

export function mapCoordinates(
  aiX: number,
  aiY: number,
  deviceWidth: number,
  deviceHeight: number,
  modelBaseSize: number = 1000
): { x: number; y: number } {
  const x = Math.round((aiX / modelBaseSize) * deviceWidth);
  const y = Math.round((aiY / modelBaseSize) * deviceHeight);
  const clampedX = Math.max(0, Math.min(deviceWidth - 1, x));
  const clampedY = Math.max(0, Math.min(deviceHeight - 1, y));
  return { x: clampedX, y: clampedY };
}

