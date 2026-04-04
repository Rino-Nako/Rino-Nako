// 对应 Python 的 ModelResponse
export interface AgentResponse {
  thinking: string;      // 思考过程
  action: string;        // 具体的动作指令 (如 do(action=click...))
  rawContent: string;    // 原始完整响应
  usage?: {              // 性能指标 (可选)
    totalTime: number;
    firstTokenTime?: number;
  };
}

// 对应 OpenAI 的 Message 格式
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text' | 'image_url', text?: string, image_url?: { url: string } }>;
}
