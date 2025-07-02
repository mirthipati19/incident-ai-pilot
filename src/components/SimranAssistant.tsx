
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, X, Minimize2, User } from 'lucide-react';

const SimranAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm Simran, your Authexa support assistant. I'm here to help you navigate our ITSM platform, troubleshoot issues, and guide you through any features you need assistance with. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: message,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getBotResponse(message),
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const getBotResponse = (userMessage: string) => {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('incident') || msg.includes('ticket')) {
      return "To create an incident, you can use either the Call Support or Chat Support options in the ITSM dashboard. Just describe your issue and I'll help create a ticket automatically. You can also view all your incidents in the 'My Incidents' tab.";
    } else if (msg.includes('install') || msg.includes('software')) {
      return "Our Voice-Controlled Software Installer is perfect for this! You can either speak your request or type it. I'll check our winget library first, and if the software isn't found there, I'll use AI to generate the installation script for you.";
    } else if (msg.includes('login') || msg.includes('sign in') || msg.includes('authentication')) {
      return "For login issues, make sure you've confirmed your email after registration. If you're still having trouble, try clearing your browser cache or use the 'Forgot Password' option. Admin credentials are: murari.mirthipati@authexa.me with password Authexa@2024!Admin";
    } else if (msg.includes('admin') || msg.includes('credentials')) {
      return "The admin credentials are:\nEmail: murari.mirthipati@authexa.me\nPassword: Authexa@2024!Admin\n\nPlease keep these secure and only use them for administrative purposes.";
    } else if (msg.includes('service catalog') || msg.includes('knowledge base')) {
      return "You can access the Service Catalog and Knowledge Base through the main navigation menu. These sections help you browse available services and find helpful articles for common issues.";
    } else if (msg.includes('help') || msg.includes('how')) {
      return "I'm here to help! I can assist with:\n• Creating and managing incidents\n• Using the software installer\n• Navigating the ITSM platform\n• Troubleshooting login issues\n• Understanding features\n\nWhat specific area would you like help with?";
    } else {
      return "I understand you're asking about: \"" + userMessage + "\". I can help you with incident management, software installation, platform navigation, and troubleshooting. Could you be more specific about what you need assistance with?";
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
        >
          <div className="flex flex-col items-center">
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Simran</span>
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-80 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-purple-500/30 shadow-2xl transition-all duration-300 ${isMinimized ? 'h-16' : 'h-96'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-purple-500/20">
          <CardTitle className="text-lg text-white flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <span>Simran Assistant</span>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">Online</span>
              </div>
            </div>
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-slate-400 hover:text-white hover:bg-purple-600/20"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white hover:bg-red-600/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-80">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-sm ${
                      msg.isBot
                        ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-slate-200 border border-purple-500/20'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-purple-500/20">
              <div className="flex space-x-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask Simran anything..."
                  className="bg-slate-700/50 border-purple-500/30 text-white placeholder-slate-400 focus:border-purple-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default SimranAssistant;
