/**
 * 解析模型响应，分离 Thinking, Plan 和 Action
 * 移植自 client.py 中的 ModelClient._parse_response
 */
export function parseModelResponse(content: string): { thinking: string, plan?: string, action: string } {
  let plan: string | undefined;
  let cleanContent = content;

  // Extract <plan>...</plan>
  const planMatch = content.match(/<plan>([\s\S]*?)<\/plan>/);
  if (planMatch) {
    plan = planMatch[1].trim();
    // We remove the plan from content to avoid interfering with thinking/action extraction
    // But we need to keep the relative order of thinking and action if possible.
    // However, usually plan is between thinking and answer.
    cleanContent = content.replace(planMatch[0], '').trim();
  }

  // 规则 1: 检查 finish(message=... (使用正则以支持空格、大小写及中文括号)
  const finishRegex = /finish\s*[(\uff08]\s*message\s*=/i;
  const finishMatch = cleanContent.match(finishRegex);
  
  if (finishMatch && finishMatch.index !== undefined) {
    return {
      thinking: cleanContent.substring(0, finishMatch.index).trim(),
      plan,
      action: cleanContent.substring(finishMatch.index).trim()
    };
  }

  // 规则 2: 检查 do(action=... (使用正则以支持空格、大小写及中文括号)
  const doRegex = /do\s*[(\uff08]\s*action\s*=/i;
  const doMatch = cleanContent.match(doRegex);
  
  if (doMatch && doMatch.index !== undefined) {
    return {
      thinking: cleanContent.substring(0, doMatch.index).trim(),
      plan,
      action: cleanContent.substring(doMatch.index).trim()
    };
  }

  // 规则 3: 兼容旧版 XML 标签 <answer>
  if (cleanContent.includes("<answer>")) {
    const parts = cleanContent.split("<answer>", 2);
    const thinking = parts[0]
      .replace("<think>", "")
      .replace("</think>", "")
      .trim();
    const action = parts[1]
      .replace("</answer>", "")
      .trim();
    return { thinking, plan, action };
  }

  // 规则 4: 没找到标记，默认全部当做 action (或者 raw)
  return {
    thinking: "",
    plan,
    action: cleanContent
  };
}
