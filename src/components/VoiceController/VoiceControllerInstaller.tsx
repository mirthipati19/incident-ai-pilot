
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Mic, MicOff, Download, Loader2, Volume2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyBH8S_Q6-kbTasYTsCuRTDaM4ShvD5TiD4');

// Software dataset for fuzzy matching
const WINGET_LIBRARY = {
  "visual studio professional": "winget install Microsoft.VisualStudio.2022.Professional",
  "visual studio community": "winget install Microsoft.VisualStudio.2022.Community",
  "vs code": "winget install Microsoft.VisualStudioCode",
  "android studio": "winget install Google.AndroidStudio",
  "intellij idea community": "winget install JetBrains.IntelliJIDEA.Community",
  "intellij idea ultimate": "winget install JetBrains.IntelliJIDEA.Ultimate",
  "pycharm community": "winget install JetBrains.PyCharm.Community",
  "pycharm professional": "winget install JetBrains.PyCharm.Professional",
  "netbeans": "winget install Apache.NetBeans",
  "postman": "winget install Postman.Postman",
  "xamp": "winget install Bitnami.XAMPP",
  "git": "winget install Git.Git",
  "github desktop": "winget install GitHub.GitHubDesktop",
  "node.js lts": "winget install OpenJS.NodeJS.LTS",
  "python": "winget install Python.Python.3",
  "docker desktop": "winget install Docker.DockerDesktop",
  "chrome": "winget install Google.Chrome",
  "firefox": "winget install Mozilla.Firefox",
  "brave": "winget install Brave.Brave",
  "opera": "winget install Opera.Opera",
  "edge": "winget install Microsoft.Edge",
  "notepad++": "winget install Notepad++.Notepad++",
  "sublime text": "winget install SublimeHQ.SublimeText.4",
  "atom": "winget install GitHub.Atom",
  "vscode insiders": "winget install Microsoft.VisualStudioCode.Insiders",
  "vlc": "winget install VideoLAN.VLC",
  "spotify": "winget install Spotify.Spotify",
  "obs studio": "winget install OBSProject.OBSStudio",
  "audacity": "winget install Audacity.Audacity",
  "potplayer": "winget install Kakao.PotPlayer",
  "7zip": "winget install 7zip.7zip",
  "winrar": "winget install RARLab.WinRAR",
  "everything search": "winget install Voidtools.Everything",
  "powertoys": "winget install Microsoft.PowerToys",
  "discord": "winget install Discord.Discord",
  "zoom": "winget install Zoom.Zoom",
  "skype": "winget install Microsoft.Skype",
  "telegram": "winget install Telegram.TelegramDesktop",
  "microsoft teams": "winget install Microsoft.Teams",
  "dropbox": "winget install Dropbox.Dropbox",
  "onedrive": "winget install Microsoft.OneDrive",
  "google drive": "winget install Google.Drive",
  "sharex": "winget install ShareX.ShareX",
  "gimp": "winget install GIMP.GIMP",
  "paint.net": "winget install dotPDNLLC.paintdotnet",
  "krita": "winget install Krita.Krita",
  "bitwarden": "winget install Bitwarden.Bitwarden",
  "malwarebytes": "winget install Malwarebytes.Malwarebytes",
  "avast antivirus": "winget install Avast.AvastFreeAntivirus",
  "fiddler": "winget install Progress.Fiddler",
  "wireshark": "winget install WiresharkFoundation.Wireshark",
  "ccleaner": "winget install Piriform.CCleaner",
  "rufus": "winget install Rufus.Rufus",
  "virtualbox": "winget install Oracle.VirtualBox",
  "vmware workstation player": "winget install VMware.WorkstationPlayer",
  "eclipse ide for java developers": "winget install --id EclipseFoundation.EclipseIDEforJavaDevelopers",
  "eclipse theia ide": "winget install --id EclipseFoundation.TheiaIDE",
  "eclipse theia blueprint": "winget install --id EclipseFoundation.TheiaBlueprint",
  "eclipse mosquitto": "winget install --id EclipseFoundation.Mosquitto",
  "eclipse sumo": "winget install --id EclipseFoundation.SUMO",
  "eclipse clp 7.0": "winget install --id Coninfer.ECLiPSeCLP.7.0",
  "eclipse clp 7.1": "winget install --id Coninfer.ECLiPSeCLP.7.1",
  "temurin jdk 8": "winget install --id EclipseAdoptium.Temurin.8.JDK",
  "temurin jdk 11": "winget install --id EclipseAdoptium.Temurin.11.JDK",
  "temurin jdk 17": "winget install --id EclipseAdoptium.Temurin.17.JDK",
  "temurin jdk 21": "winget install --id EclipseAdoptium.Temurin.21.JDK",
  "temurin jdk 22": "winget install --id EclipseAdoptium.Temurin.22.JDK",
  "temurin jdk 23": "winget install --id EclipseAdoptium.Temurin.23.JDK",
  "temurin jdk 24": "winget install --id EclipseAdoptium.Temurin.24.JDK"
};

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

interface VoiceControllerInstallerProps {
  onClose: () => void;
}

const VoiceControllerInstaller: React.FC<VoiceControllerInstallerProps> = ({ onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('Tell me which software you want me to install');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Fuzzy matching function
  const fuzzyMatch = (input: string, target: string): number => {
    const inputLower = input.toLowerCase();
    const targetLower = target.toLowerCase();
    
    // Exact match gets highest score
    if (inputLower === targetLower) return 1;
    
    // Check if input is contained in target
    if (targetLower.includes(inputLower)) return 0.8;
    
    // Check if target is contained in input
    if (inputLower.includes(targetLower)) return 0.7;
    
    // Check word matches
    const inputWords = inputLower.split(' ');
    const targetWords = targetLower.split(' ');
    let matchCount = 0;
    
    inputWords.forEach(inputWord => {
      targetWords.forEach(targetWord => {
        if (inputWord === targetWord || inputWord.includes(targetWord) || targetWord.includes(inputWord)) {
          matchCount++;
        }
      });
    });
    
    return matchCount > 0 ? matchCount / Math.max(inputWords.length, targetWords.length) : 0;
  };

  // Find best match in winget library
  const findBestMatch = (input: string): { command: string; confidence: number; software: string } | null => {
    let bestMatch = null;
    let bestScore = 0;
    let bestSoftware = '';

    Object.entries(WINGET_LIBRARY).forEach(([software, command]) => {
      const score = fuzzyMatch(input, software);
      if (score > bestScore && score > 0.3) { // Minimum threshold
        bestScore = score;
        bestMatch = command;
        bestSoftware = software;
      }
    });

    return bestMatch ? { command: bestMatch, confidence: bestScore, software: bestSoftware } : null;
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
        setStatus('🎤 Listening... Tell me which software you want to install');
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
        setStatus('❌ Voice recognition error. Please try again or use text input.');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcript) {
          setStatus('✅ Voice input captured. Click generate to create installation script.');
        } else {
          setStatus('Tell me which software you want me to install');
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } else {
      setStatus('❌ Voice recognition not supported. Please use text input instead.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const generateWithLibraryFirst = async (input: string): Promise<string> => {
    console.log('🔍 Searching for software:', input);
    
    // First try fuzzy matching with our library
    const match = findBestMatch(input);
    
    if (match && match.confidence > 0.5) {
      console.log(`✅ Found match: ${match.software} (confidence: ${match.confidence})`);
      setStatus(`✅ Found ${match.software} in library. Generating installation script...`);
      
      return `@echo off
echo Installing ${match.software}...
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

echo Installing ${match.software}...
${match.command} -e --source winget --silent

IF ERRORLEVEL 0 (
    echo.
    echo SUCCESS: ${match.software} has been installed successfully!
) ELSE (
    echo.
    echo ERROR: Installation failed. Please check the package name and try again.
    echo You can search for the correct package with: winget search "${match.software}"
)

echo.
pause`;
    }
    
    // If no good match found, use Gemini AI
    console.log('⚠️ No match found in library, using Gemini AI...');
    setStatus('🤖 No exact match found. Using AI to generate installation script...');
    
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
      
      console.log('✅ Gemini AI generated script successfully');
      return generatedText;
    } catch (error) {
      console.error('❌ Gemini AI generation failed:', error);
      throw new Error('Failed to generate installation script. Please try again.');
    }
  };

  const handleGenerate = async () => {
    const inputText = textInput.trim();
    if (!inputText) {
      setStatus('❌ Please tell me which software you want to install');
      return;
    }

    setIsGenerating(true);
    setStatus('🔍 Searching for your software...');

    try {
      const script = await generateWithLibraryFirst(inputText);
      setGeneratedScript(script);
      setStatus('✅ Installation script generated successfully! Click download to get it.');
    } catch (error) {
      console.error('Script generation failed:', error);
      setStatus('❌ Failed to generate script. Please try again or be more specific.');
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
    setStatus('📥 Installation script downloaded! Run as administrator for best results.');
  };

  const clearAll = () => {
    setTranscript('');
    setTextInput('');
    setGeneratedScript('');
    setStatus('Tell me which software you want me to install');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 border-indigo-200 text-indigo-900 w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Volume2 className="h-6 w-6 text-indigo-700" />
              Download and Install Software
            </h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-indigo-600 text-center mb-4 text-sm">
            Generate Windows installation scripts using voice or text input
          </p>

          {/* Status Display */}
          <div className="bg-white/70 rounded-lg p-3 text-center mb-4">
            <p className="text-indigo-700 font-medium text-sm">{status}</p>
          </div>

          {/* Voice Input Section */}
          <div className="text-center space-y-3 mb-4">
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
          <div className="space-y-2 mb-4">
            <label className="block text-indigo-700 font-medium text-sm">
              Or type which software you want to install:
            </label>
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="e.g., VS Code, Chrome, Python, or any software name"
              className="bg-white/80 border-indigo-200 focus:border-indigo-400 min-h-[60px] text-sm"
              disabled={isGenerating}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!textInput.trim() || isGenerating}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 text-sm font-semibold mb-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                🚀 Generating Installation Script...
              </>
            ) : (
              '🚀 Generate Installation Script'
            )}
          </Button>

          {/* Clear Button */}
          {(textInput || generatedScript) && (
            <Button
              onClick={clearAll}
              variant="outline"
              className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 mb-4"
              disabled={isGenerating}
            >
              🗑️ Clear All
            </Button>
          )}

          {/* Generated Script Display */}
          {generatedScript && (
            <div className="space-y-3">
              <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4" />
                  Generated Installation Script:
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
                📥 Download Installation Script
              </Button>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-700 text-xs">
                  💡 <strong>Tips:</strong> Run the downloaded .bat file as administrator for best results. 
                  Make sure Windows Package Manager (winget) is installed on your system.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceControllerInstaller;
