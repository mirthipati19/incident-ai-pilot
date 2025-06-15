
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatApiResponse {
  id: string;
  assistantId: string;
  messages: ChatMessage[];
  output: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  orgId?: string;
  sessionId?: string;
  name?: string;
}

interface ChatResponse {
  chatId: string;
  response: string;
  fullData: ChatApiResponse;
}

const VAPI_API_KEY = "559255b5-9cd5-45b2-849f-178f5ef304a4";
const ASSISTANT_ID = "5159a1df-deb8-4dad-aefc-a449bdc64d6e";

export async function sendChatMessage(
  message: string,
  previousChatId?: string
): Promise<ChatResponse> {
  const response = await fetch('https://api.vapi.ai/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assistantId: ASSISTANT_ID,
      input: message,
      ...(previousChatId && { previousChatId })
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const chat: ChatApiResponse = await response.json();
  return {
    chatId: chat.id,
    response: chat.output[0]?.content || 'No response received',
    fullData: chat
  };
}
