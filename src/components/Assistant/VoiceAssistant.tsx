
import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceAssistantProps {
  onVoiceResult?: (text: string) => void;
}

const VoiceAssistant = ({ onVoiceResult }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    setIsListening(true);
    setTranscript('');
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.start();

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const voiceText = event.results[current][0].transcript;
      setTranscript(voiceText);
      
      if (event.results[current].isFinal) {
        console.log("Recognized:", voiceText);
        onVoiceResult?.(voiceText);
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const stopListening = () => {
    setIsListening(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="relative">
        <div 
          className={`rounded-full w-24 h-24 border-4 flex items-center justify-center transition-all duration-300 ${
            isListening 
              ? 'border-blue-500 bg-blue-50 animate-pulse shadow-lg shadow-blue-200' 
              : 'border-gray-400 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          {isListening ? (
            <Mic className="w-8 h-8 text-blue-600" />
          ) : (
            <MicOff className="w-8 h-8 text-gray-600" />
          )}
        </div>
        
        {isListening && (
          <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping opacity-50"></div>
        )}
      </div>
      
      <div className="text-center">
        {isListening ? (
          <button 
            onClick={stopListening}
            className="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition-colors"
          >
            Stop Listening
          </button>
        ) : (
          <button 
            onClick={handleVoice}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Start Speaking
          </button>
        )}
      </div>
      
      {transcript && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg max-w-md text-center">
          <p className="text-sm text-gray-700">{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
