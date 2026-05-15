import { ChatMessage } from "@/types/agent";

export class MessageBuilder {
  
  /**
   * 构建用户消息
   * 对应 create_user_message
   */
  static createUserMessage(text: string, base64Image?: string): ChatMessage {
    if (!base64Image) {
      return { role: 'user', content: text };
    }
    
    return {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${base64Image}` }
        },
        { type: 'text', text: text }
      ]
    };
  }

  /**
   * 🧹 上下文清洗策略 (关键优化)
   * 对应 remove_images_from_message
   * * 逻辑：为了节省 Token，只保留最后一张图片，之前的对话只保留纯文本。
   */
  static pruneHistory(history: ChatMessage[]): ChatMessage[] {
    return history.map((msg, index) => {
      // 如果不是最后一条消息，且包含图片，则移除图片
      if (index < history.length - 1 && Array.isArray(msg.content)) {
        const textContent = msg.content.find(c => c.type === 'text');
        return {
          role: msg.role,
          content: textContent ? textContent.text || "" : "" // 只保留文本
        } as ChatMessage;
      }
      return msg;
    });
  }
}
