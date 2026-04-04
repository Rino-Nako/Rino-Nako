import { SYSTEM_PROMPT } from '@/lib/prompts';
import {
  EXECUTOR_CAPABILITIES,
  EXECUTOR_PROMPT_TEMPLATES,
  PLANNER_PROMPT_TEMPLATES,
} from '@/lib/deep-collab/prompt-templates';

export type ModelConfig = {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p?: number;
  frequency_penalty?: number;
  response_format?: { type: 'json_object' };
  stop?: string[];
};

export const MODEL_CONFIGS: Record<'text_planner' | 'visual_planner' | 'executor', ModelConfig> = {
  text_planner: {
    model: '',
    temperature: 0.1,
    max_tokens: 1024,
    top_p: 0.1,
    frequency_penalty: 0.0,
    response_format: { type: 'json_object' },
  },
  visual_planner: {
    model: '',
    temperature: 0.2,
    max_tokens: 1024,
    top_p: 0.8,
    frequency_penalty: 0.0,
  },
  executor: {
    model: 'autoglm-phone',
    temperature: 0.0,
    max_tokens: 256,
    frequency_penalty: 1.1,
    stop: ['</answer>', '<|user|>', 'Observation:'],
  },
};

export { EXECUTOR_CAPABILITIES };

export const PLANNER_PROMPTS = PLANNER_PROMPT_TEMPLATES;

export const EXECUTOR_PROMPTS = {
  DEFAULT: SYSTEM_PROMPT,
  ...EXECUTOR_PROMPT_TEMPLATES,
} as const;

const stripCodeFences = (s: string) => {
  const t = s.trim();
  const fenced = t.match(/^```[a-zA-Z]*\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1].trim() : t;
};

export const fillTemplate = (
  template: string,
  vars: Record<string, string | number | boolean | null | undefined>
) => {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, String(v ?? ''));
  }
  return stripCodeFences(out);
};
