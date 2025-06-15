
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

const VAPI_API_KEY = "2474c624-2391-475a-a306-71d6c4642924";
const ASSISTANT_ID = "8352c787-40ac-44e6-b77e-b8a903b3f2d9";

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
