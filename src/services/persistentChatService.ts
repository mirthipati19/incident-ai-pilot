
interface ChatMessage {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

class PersistentChatService {
  private static instance: PersistentChatService;
  private messages: ChatMessage[] = [];
  private subscribers: ((messages: ChatMessage[]) => void)[] = [];

  private constructor() {
    // Load messages from localStorage
    this.loadMessages();
  }

  static getInstance(): PersistentChatService {
    if (!PersistentChatService.instance) {
      PersistentChatService.instance = new PersistentChatService();
    }
    return PersistentChatService.instance;
  }

  private loadMessages(): void {
    try {
      const stored = localStorage.getItem('authexa_chat_messages');
      if (stored) {
        this.messages = JSON.parse(stored).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } else {
        // Initialize with welcome message
        this.messages = [{
          id: 1,
          text: "Hello! I'm your Authexa support assistant. How can I help you today?",
          isBot: true,
          timestamp: new Date()
        }];
        this.saveMessages();
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
      this.messages = [{
        id: 1,
        text: "Hello! I'm your Authexa support assistant. How can I help you today?",
        isBot: true,
        timestamp: new Date()
      }];
    }
  }

  private saveMessages(): void {
    try {
      localStorage.setItem('authexa_chat_messages', JSON.stringify(this.messages));
    } catch (error) {
      console.error('Error saving chat messages:', error);
    }
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  addMessage(text: string, isBot: boolean = false): void {
    const newMessage: ChatMessage = {
      id: Date.now(),
      text,
      isBot,
      timestamp: new Date()
    };

    this.messages.push(newMessage);
    this.saveMessages();
    this.notifySubscribers();
  }

  subscribe(callback: (messages: ChatMessage[]) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback([...this.messages]));
  }

  clearMessages(): void {
    this.messages = [{
      id: Date.now(),
      text: "Hello! I'm your Authexa support assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }];
    this.saveMessages();
    this.notifySubscribers();
  }
}

export const persistentChatService = PersistentChatService.getInstance();
export type { ChatMessage };
