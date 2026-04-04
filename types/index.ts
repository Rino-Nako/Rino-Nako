export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actionType?: string;
  step?: string;
  senderName?: string;
  senderAvatar?: string;
  model?: string;
  rawContent?: string;
  collab?: {
    plannerAction?: string;
    executorReply?: string;
    executorAction?: string;
    executorActionType?: string;
    executorName?: string;
    executorAvatar?: string;
    executorModel?: string;
  };
}
