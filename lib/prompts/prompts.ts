import { SYSTEM_PROMPT_BODY as NORMAL_PROMPT_BODY, SYSTEM_PROMPT_RESTRICTED_APPS_APPENDIX as NORMAL_RESTRICTED_APPS_APPENDIX } from '@/lib/prompts/normal-prompts';
import { SYSTEM_PROMPT_BODY as INDEPENDENT_PROMPT_BODY, SYSTEM_PROMPT_RESTRICTED_APPS_APPENDIX as INDEPENDENT_RESTRICTED_APPS_APPENDIX } from '@/lib/prompts/independent-prompts';

const formatDateCn = (date: Date) => {
  const weekdayNames = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const weekday = weekdayNames[(date.getDay() + 6) % 7];
  return `${yyyy}年${mm}月${dd}日 ${weekday}`;
};

export type SystemPromptMode = 'normal' | 'independent';

const getPromptParts = (mode: SystemPromptMode) => {
  if (mode === 'independent') {
    return {
      body: INDEPENDENT_PROMPT_BODY,
      restrictedAppendix: INDEPENDENT_RESTRICTED_APPS_APPENDIX,
    };
  }

  return {
    body: NORMAL_PROMPT_BODY,
    restrictedAppendix: NORMAL_RESTRICTED_APPS_APPENDIX,
  };
};

export const getSystemPrompt = (restrictedAppsMode: boolean = true, mode: SystemPromptMode = 'normal') => {
  const formattedDate = formatDateCn(new Date());
  const { body, restrictedAppendix } = getPromptParts(mode);
  let prompt = `今天的日期是: ${formattedDate}${body}`;

  if (restrictedAppsMode) {
    prompt += restrictedAppendix;
  }

  prompt += `
`;
  return prompt;
};

export const SYSTEM_PROMPT = getSystemPrompt(true);

export const FEW_SHOT_EXAMPLES: unknown[] = [];
