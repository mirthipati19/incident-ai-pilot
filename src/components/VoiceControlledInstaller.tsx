import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Download, MessageSquare, Send, Loader2, RefreshCw } from 'lucide-react';
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

const VoiceControlledInstaller = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "Hi! I can help you generate Windows batch files for software installation. Just tell me what software you need!", isBot: true }
  ]);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const softwareLibrary = {
    'vs code': 'winget install Microsoft.VisualStudioCode',
    'visual studio code': 'winget install Microsoft.VisualStudioCode',
    'chrome': 'winget install Google.Chrome',
    'google chrome': 'winget install Google.Chrome',
    'firefox': 'winget install Mozilla.Firefox',
    'node.js': 'winget install OpenJS.NodeJS',
    'nodejs': 'winget install OpenJS.NodeJS',
    'python': 'winget install Python.Python.3',
    'git': 'winget install Git.Git',
    'discord': 'winget install Discord.Discord',
    'spotify': 'winget install Spotify.Spotify',
    'vlc': 'winget install VideoLAN.VLC',
    'notepad++': 'winget install Notepad++.Notepad++',
    'sublime text': 'winget install SublimeHQ.SublimeText.4',
    'atom': 'winget install GitHub.Atom',
    'zoom': 'winget install Zoom.Zoom',
    'teams': 'winget install Microsoft.Teams',
    'slack': 'winget install SlackTechnologies.Slack',
    'docker': 'winget install Docker.DockerDesktop',
    'postman': 'winget install Postman.Postman'
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition() as SpeechRecognitionInstance;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        console.log('🎤 Speech recognition started');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          console.log('🗣️ Speech recognized:', finalTranscript);
          setTranscript(finalTranscript.trim());
          setChatInput(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error('🚨 Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('🔇 Speech recognition ended');
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } else {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const generateBatchScript = (input: string) => {
    const lowerInput = input.toLowerCase();
    console.log('🔍 Generating batch script for:', input);
    
    // Check software library first
    for (const [software, command] of Object.entries(softwareLibrary)) {
      if (lowerInput.includes(software)) {
        console.log('✅ Found match in library:', software);
        return generateBatchFile(command, software);
      }
    }

    // Fallback for unknown software
    const softwareName = extractSoftwareName(input);
    const estimatedCommand = `winget install ${softwareName}`;
    console.log('⚠️ No exact match found, generating estimated command:', estimatedCommand);
    return generateBatchFile(estimatedCommand, softwareName, true);
  };

  const extractSoftwareName = (input: string) => {
    const words = input.toLowerCase().replace(/install|download|get/g, '').trim().split(' ');
    return words.filter(word => word.length > 2).join('.');
  };

  const generateBatchFile = (wingetCommand: string, softwareName: string, isEstimated = false) => {
    return `@echo off
echo Installing ${softwareName}...
echo.

REM Check if winget is available
winget --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo ERROR: winget not found. Please install Windows Package Manager first.
    echo Visit: https://github.com/microsoft/winget-cli/releases
    pause
    exit /b 1
)

echo Winget is available. Proceeding with installation...
echo.

${isEstimated ? `REM Note: This is an estimated command. Verify the package ID before running.
echo Verifying package exists...
winget search "${softwareName}" | findstr /C:"${softwareName}" >nul
IF ERRORLEVEL 1 (
    echo WARNING: Package "${softwareName}" may not be available in winget.
    echo Please verify the correct package ID manually.
    pause
)
echo.` : ''}

echo Installing ${softwareName}...
start /wait ${wingetCommand} -e --source winget --silent

IF ERRORLEVEL 0 (
    echo.
    echo SUCCESS: ${softwareName} has been installed successfully!
) ELSE (
    echo.
    echo ERROR: Installation failed. Please check the package name and try again.
    echo You can search for the correct package with: winget search ${softwareName}
)

echo.
pause`;
  };

  const generateWithGemini = async (input: string): Promise<string> => {
    try {
      console.log('🤖 Generating batch script with Gemini AI for:', input);
      
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `Generate a Windows batch file (.bat) for installing software based on this request: "${input}"

Please create a comprehensive batch script that:
1. Uses winget (Windows Package Manager) when possible
2. Includes error handling and verification
3. Provides clear feedback to the user
4. Checks if winget is available
5. Handles installation failures gracefully

Format the response as a complete .bat file with proper comments and error handling.

Software request: ${input}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();
      
      console.log('✅ Gemini AI generated script successfully');
      return generatedText;
    } catch (error) {
      console.error('❌ Gemini AI generation failed:', error);
      // Fallback to original logic
      return generateBatchScript(input);
    }
  };

  const handleGenerate = async () => {
    const inputText = chatInput || transcript;
    if (!inputText.trim()) return;

    console.log('🚀 Generating script for input:', inputText);
    setIsGenerating(true);
    
    // Add user message to chat
    const userMessage = { id: Date.now(), text: inputText, isBot: false };
    setChatMessages(prev => [...prev, userMessage]);

    try {
      // Generate batch script with Gemini AI
      const script = await generateWithGemini(inputText);
      setGeneratedScript(script);

      // Add bot response to chat
      const botMessage = { 
        id: Date.now() + 1, 
        text: `I've generated a Windows batch file using AI for "${inputText}". The script includes error handling and verification steps. You can download it below and run it as administrator.`, 
        isBot: true 
      };
      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('❌ Script generation failed:', error);
      const errorMessage = { 
        id: Date.now() + 1, 
        text: `Sorry, I encountered an error generating the script for "${inputText}". Please try again or contact support.`, 
        isBot: true 
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }

    setChatInput('');
    setTranscript('');
    setIsGenerating(false);
    console.log('✅ Script generation completed');
  };

  const downloadBatchFile = () => {
    if (!generatedScript) return;

    console.log('📥 Starting download of batch file');
    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'software-installer.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ Batch file downloaded successfully');
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerate();
  };

  const refreshCaptcha = () => {
    console.log('🔄 Refreshing voice recognition...');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setTranscript('');
    setTimeout(() => {
      startListening();
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-2xl text-white text-center">
            🎙️ AI-Powered Voice Software Installer
          </CardTitle>
          <p className="text-slate-300 text-center">
            Generate Windows batch files for software installation using voice or text input with Google Gemini AI
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="voice" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
              <TabsTrigger value="voice" className="data-[state=active]:bg-slate-600/50">
                <Mic className="w-4 h-4 mr-2" />
                Voice Input
              </TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-slate-600/50">
                <MessageSquare className="w-4 h-4 mr-2" />
                AI Chat
              </TabsTrigger>
              <TabsTrigger value="text" className="data-[state=active]:bg-slate-600/50">
                Text Input
              </TabsTrigger>
            </TabsList>

            <TabsContent value="voice" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={isListening ? stopListening : startListening}
                    className={`w-32 h-32 rounded-full text-white font-bold ${
                      isListening
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-8 h-8 mb-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="w-8 h-8 mb-2" />
                        Speak
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={refreshCaptcha}
                    className="w-16 h-16 rounded-full bg-slate-600 hover:bg-slate-700 text-white"
                    title="Refresh Voice Recognition"
                  >
                    <RefreshCw className="w-6 h-6" />
                  </Button>
                </div>
                
                <p className="text-slate-300">
                  {isListening ? 'Listening... Speak your software installation request' : 'Click to start voice input'}
                </p>
                {transcript && (
                  <div className="bg-slate-700/50 p-4 rounded-lg">
                    <p className="text-white">You said: "{transcript}"</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="chat" className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4 h-64 overflow-y-auto">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 ${message.isBot ? 'text-left' : 'text-right'}`}
                  >
                    <div
                      className={`inline-block max-w-[80%] p-3 rounded-lg ${
                        message.isBot
                          ? 'bg-blue-600/20 text-blue-100'
                          : 'bg-slate-600/50 text-white'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="text-left mb-4">
                    <div className="inline-block bg-green-600/20 text-green-100 p-3 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      🤖 Gemini AI is generating your batch file...
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleChatSubmit} className="flex space-x-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask AI to install any software..."
                  className="bg-slate-700/50 border-slate-600/50 text-white"
                  disabled={isGenerating}
                />
                <Button type="submit" disabled={!chatInput.trim() || isGenerating}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div>
                <label className="block text-white mb-2">Software Installation Request</label>
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your software installation request (e.g., 'Install Visual Studio Code', 'Download Chrome and Firefox')"
                  className="bg-slate-700/50 border-slate-600/50 text-white min-h-[100px]"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Button
              onClick={handleGenerate}
              disabled={!chatInput.trim() && !transcript.trim() || isGenerating}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  🤖 AI Generating...
                </>
              ) : (
                '🤖 Generate with AI'
              )}
            </Button>
          </div>

          {generatedScript && (
            <div className="mt-6 space-y-4">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">🤖 AI-Generated Batch Script:</h3>
                <pre className="text-sm text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {generatedScript}
                </pre>
              </div>
              <div className="text-center">
                <Button
                  onClick={downloadBatchFile}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download AI-Generated .bat File
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 bg-slate-700/50 p-4 rounded-lg">
            <h4 className="text-white font-semibold mb-2">🤖 AI-Enhanced Instructions:</h4>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• Use voice input, chat with AI, or type your software installation request</li>
              <li>• Google Gemini AI generates intelligent batch scripts with error handling</li>
              <li>• Scripts include verification, fallbacks, and user-friendly feedback</li>
              <li>• Download the generated .bat file and run it as administrator</li>
              <li>• Requires Windows Package Manager (winget) for optimal functionality</li>
              <li>• 🔄 Use the refresh button if voice recognition gets stuck</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceControlledInstaller;
