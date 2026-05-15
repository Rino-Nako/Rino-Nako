
export async function* parseSSE(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const isDev = process.env.NODE_ENV !== 'production';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        const trimmed = line.replace(/\r$/, '').trim();
        if (!trimmed || trimmed.startsWith(':')) continue; // Skip empty lines and comments

        if (trimmed.startsWith('data:')) {
          const data = trimmed.slice(5).trimStart();
          if (data === '[DONE]') return;
          try {
            yield JSON.parse(data);
          } catch (e) {
            if (isDev) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
