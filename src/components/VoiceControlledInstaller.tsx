
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VoiceControlledInstaller = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const softwareDictionary: { [key: string]: string } = {
    "vs code": "Microsoft.VisualStudioCode",
    "visual studio code": "Microsoft.VisualStudioCode",
    "chrome": "Google.Chrome",
    "google chrome": "Google.Chrome",
    "firefox": "Mozilla.Firefox",
    "node.js": "OpenJS.NodeJS",
    "nodejs": "OpenJS.NodeJS",
    "python": "Python.Python.3.11",
    "git": "Git.Git",
    "notepad++": "Notepad++.Notepad++",
    "7zip": "7zip.7zip",
    "discord": "Discord.Discord",
    "spotify": "Spotify.Spotify",
    "vlc": "VideoLAN.VLC"
  };

  const generateBatScript = (wingetId: string, softwareName: string) => {
    return `@echo off
echo Installing ${softwareName}...

REM Check if winget is available
winget --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo winget not found. Please install the App Installer from Microsoft Store.
    pause
    exit /b
)

REM Validate Winget Package ID
winget search "${wingetId}" | findstr /C:"${wingetId}" >nul
IF ERRORLEVEL 1 (
    echo Installation is likely to fail because "${wingetId}" is not a valid Winget ID.
    pause
    exit /b
)

REM Install the software
echo Installing ${softwareName}...
start /wait winget install ${wingetId} -e --source winget --silent

IF ERRORLEVEL 0 (
    echo ${softwareName} installed successfully!
) ELSE (
    echo Installation failed. Please try again manually.
)

pause`;
  };

  const generateAIScript = async (userInput: string) => {
    // This would typically call an AI service like Gemini
    // For now, we'll create a generic script based on the input
    const softwareName = userInput.toLowerCase().replace(/install |download |get /gi, '').trim();
    
    return `@echo off
echo Attempting to install: ${softwareName}

REM Check if winget is available
winget --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo winget not found. Please install the App Installer from Microsoft Store.
    pause
    exit /b
)

REM Search for the software
echo Searching for ${softwareName}...
winget search "${softwareName}" --accept-source-agreements

echo.
echo Please review the search results above and run:
echo winget install [Package.ID] -e --source winget --silent
echo.
echo Replace [Package.ID] with the exact ID from the search results.

pause`;
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please use text input instead.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak your software installation request"
      });
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      setTranscript(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      toast({
        title: "Speech Recognition Error",
        description: event.error,
        variant: "destructive"
      });
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleGenerateScript = async () => {
    if (!transcript.trim()) {
      toast({
        title: "No Input",
        description: "Please provide software name via voice or text input",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const lowerInput = transcript.toLowerCase();
      let script = '';

      // Check local dictionary first
      const dictionaryMatch = Object.keys(softwareDictionary).find(key => 
        lowerInput.includes(key)
      );

      if (dictionaryMatch) {
        const wingetId = softwareDictionary[dictionaryMatch];
        script = generateBatScript(wingetId, dictionaryMatch);
      } else {
        // Use AI generation for unknown software
        script = await generateAIScript(transcript);
      }

      setGeneratedScript(script);
      toast({
        title: "Script Generated",
        description: "Batch script has been generated successfully"
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate installation script",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadScript = () => {
    if (!generatedScript) return;

    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'install_software.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Script Downloaded",
      description: "Run the .bat file as administrator to install the software"
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white font-bold">Voice-Controlled Software Installer</CardTitle>
          <CardDescription className="text-slate-300">
            Generate Windows batch files for software installation using voice or text input
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Input Controls */}
          <div className="flex flex-col items-center space-y-4">
            <Button
              onClick={handleVoiceInput}
              className={`w-40 h-40 rounded-full ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-semibold text-lg`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-8 h-8 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8 mr-2" />
                  Speak
                </>
              )}
            </Button>
            <p className="text-slate-400 text-sm text-center">
              Click to {isListening ? 'stop listening' : 'start voice input'}
            </p>
          </div>

          {/* Text Input Alternative */}
          <div className="space-y-2">
            <Label htmlFor="transcript" className="text-white font-medium">
              Software Installation Request
            </Label>
            <Input
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="e.g., 'Install Visual Studio Code' or 'Download Chrome'"
              className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400"
            />
          </div>

          {/* Generate Script Button */}
          <Button
            onClick={handleGenerateScript}
            disabled={isGenerating || !transcript.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Script...
              </>
            ) : (
              'Generate Installation Script'
            )}
          </Button>

          {/* Generated Script Display */}
          {generatedScript && (
            <div className="space-y-4">
              <Label className="text-white font-medium">Generated Batch Script:</Label>
              <Textarea
                value={generatedScript}
                readOnly
                className="h-64 bg-slate-900/50 border-slate-600/50 text-green-400 font-mono text-sm"
              />
              <Button
                onClick={handleDownloadScript}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
              >
                <Download className="w-4 h-4 mr-2" />
                Download .bat File
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700/30">
            <h4 className="text-white font-semibold mb-2">Instructions:</h4>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• Use voice input or type your software installation request</li>
              <li>• Supported software includes VS Code, Chrome, Firefox, Node.js, Python, and more</li>
              <li>• Download the generated .bat file and run it as administrator</li>
              <li>• Requires Windows Package Manager (winget) to be installed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceControlledInstaller;
