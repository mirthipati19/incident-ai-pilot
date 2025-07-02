
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Download, Loader2, Volume2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyCmJo1OqeIK38FaoxlVKDsBc12UiNV4n7I');

// Extend window object for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

const ImprovedVoiceInstaller = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('Ready to help you install software');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition() as SpeechRecognitionInstance;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setStatus('🎤 Listening... Tell me what software you need to install');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript.trim());
          setTextInput(finalTranscript.trim());
          setStatus(`📝 I heard: "${finalTranscript.trim()}"`);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setStatus('❌ Voice recognition error. Please try again.');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcript) {
          setStatus('✅ Voice input captured. Ready to generate script.');
        } else {
          setStatus('Ready to help you install software');
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } else {
      setStatus('❌ Voice recognition not supported in this browser. Use text input instead.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const generateWithGemini = async (input: string): Promise<string> => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `Generate a Windows batch file (.bat) for installing software based on this request: "${input}"

Please create a comprehensive batch script that:
1. Uses winget (Windows Package Manager) when possible
2. Includes error handling and verification
3. Provides clear feedback to the user
4. Checks if winget is available
5. Handles installation failures gracefully
6. Uses proper package IDs from winget repository

Format the response as a complete .bat file with proper comments and error handling.

Software request: ${input}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();
      
      return generatedText;
    } catch (error) {
      console.error('Gemini AI generation failed:', error);
      throw error;
    }
  };

  const handleGenerate = async () => {
    const inputText = textInput.trim();
    if (!inputText) {
      setStatus('❌ Please provide software installation request');
      return;
    }

    setIsGenerating(true);
    setStatus('🤖 AI is generating your batch file...');

    try {
      const script = await generateWithGemini(inputText);
      setGeneratedScript(script);
      setStatus('✅ Batch file generated successfully! Click download to get it.');
    } catch (error) {
      console.error('Script generation failed:', error);
      setStatus('❌ Failed to generate script. Please try again.');
    }

    setIsGenerating(false);
  };

  const downloadBatchFile = () => {
    if (!generatedScript) return;

    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'software-installer.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('📥 Batch file downloaded successfully!');
  };

  const clearAll = () => {
    setTranscript('');
    setTextInput('');
    setGeneratedScript('');
    setStatus('Ready to help you install software');
  };

  return (
    <div className="w-full">
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 border-indigo-200">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold text-indigo-800 flex items-center justify-center gap-2">
            <Volume2 className="w-5 h-5" />
            Download and Install Software
          </CardTitle>
          <p className="text-indigo-600 text-sm mt-2">
            Generate Windows installation scripts using voice or text input
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Status Display */}
          <div className="bg-white/70 rounded-lg p-3 text-center">
            <p className="text-indigo-700 font-medium text-sm">{status}</p>
          </div>

          {/* Voice Input Section */}
          <div className="text-center space-y-3">
            <Button
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full text-white font-bold transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg'
                  : 'bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg'
              }`}
              disabled={isGenerating}
            >
              {isListening ? (
                <div className="flex flex-col items-center">
                  <MicOff className="w-5 h-5 mb-1" />
                  <span className="text-xs">Stop</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Mic className="w-5 h-5 mb-1" />
                  <span className="text-xs">Speak</span>
                </div>
              )}
            </Button>
          </div>

          {/* Text Input Section */}
          <div className="space-y-2">
            <label className="block text-indigo-700 font-medium text-sm">
              Or type your software installation request:
            </label>
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="e.g., Install Visual Studio Code, Chrome, and NodeJS"
              className="bg-white/80 border-indigo-200 focus:border-indigo-400 min-h-[60px] text-sm"
              disabled={isGenerating}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!textInput.trim() || isGenerating}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 text-sm font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                🤖 AI Generating Script...
              </>
            ) : (
              '🚀 Generate Batch Script'
            )}
          </Button>

          {/* Generated Script Display */}
          {generatedScript && (
            <div className="space-y-3">
              <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4" />
                  Generated Batch Script:
                </h3>
                <pre className="text-green-400 text-xs whitespace-pre-wrap">
                  {generatedScript}
                </pre>
              </div>
              
              <Button
                onClick={downloadBatchFile}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 text-sm font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                📥 Download .bat File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovedVoiceInstaller;
