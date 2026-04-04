import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types';

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

const STORAGE_KEY = 'zhipu_chat_sessions';

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          // Select the most recent one or the first one
          setCurrentSessionId(parsed[0].id);
          return;
        }
      } catch (e) {
        console.error('Failed to parse chat sessions', e);
      }
    }
    // No sessions, create a default one
    createSession();
  }, []);

  // Save to local storage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const createSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== id);
      if (newSessions.length === 0) {
        // If all deleted, create a new one immediately
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: '新对话',
          messages: [],
          updatedAt: Date.now(),
        };
        return [newSession];
      }
      return newSessions;
    });
    
    // If we deleted the current session, switch to the first available one
    if (id === currentSessionId) {
      // We need to wait for state update, but here we can just predict
      // However, inside setSessions we can't side-effect.
      // Better to use a separate effect or handle it here with logic
      // But since state update is async, we do this:
      setSessions(prev => {
        const newSessions = prev.filter(s => s.id !== id);
        let nextSessions = newSessions;
        if (newSessions.length === 0) {
           const newSession: ChatSession = {
            id: Date.now().toString(),
            title: '新对话',
            messages: [],
            updatedAt: Date.now(),
          };
          nextSessions = [newSession];
        }
        
        // If current was deleted, switch to the first one of the new list
        if (id === currentSessionId) {
            setCurrentSessionId(nextSessions[0].id);
        }
        return nextSessions;
      });
    }
  }, [currentSessionId]);

  const switchSession = useCallback((id: string) => {
    setCurrentSessionId(id);
  }, []);

  const updateCurrentSessionMessages = useCallback((messagesOrUpdater: Message[] | ((prev: Message[]) => Message[])) => {
    setSessions(prev => {
      return prev.map(session => {
        if (session.id === currentSessionId) {
          const newMessages = typeof messagesOrUpdater === 'function' 
            ? messagesOrUpdater(session.messages)
            : messagesOrUpdater;
          
          // Generate a title if it's the first user message
          let newTitle = session.title;
          if (session.title === '新对话' && newMessages.length > 0) {
            const firstUserMsg = newMessages.find(m => m.role === 'user');
            if (firstUserMsg) {
              newTitle = firstUserMsg.content.slice(0, 20);
            }
          }

          return {
            ...session,
            messages: newMessages,
            title: newTitle,
            updatedAt: Date.now()
          };
        }
        return session;
      });
    });
  }, [currentSessionId]);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const currentMessages = currentSession?.messages || [];

  return {
    sessions,
    currentSessionId,
    currentMessages,
    createSession,
    deleteSession,
    switchSession,
    updateCurrentSessionMessages,
  };
}
