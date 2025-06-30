
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Shield } from 'lucide-react';

interface MathCaptchaProps {
  onVerified: () => void;
  onError: (error: string) => void;
}

const MathCaptcha = ({ onVerified, onError }: MathCaptchaProps) => {
  const [challenge, setChallenge] = useState('');
  const [solution, setSolution] = useState('');
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const generateChallenge = () => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operators = ['+', '-', '×'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let result: number;
    let challengeText: string;
    
    switch (operator) {
      case '+':
        result = num1 + num2;
        challengeText = `${num1} + ${num2}`;
        break;
      case '-':
        const larger = Math.max(num1, num2);
        const smaller = Math.min(num1, num2);
        result = larger - smaller;
        challengeText = `${larger} - ${smaller}`;
        break;
      case '×':
        const smallNum1 = Math.floor(Math.random() * 10) + 1;
        const smallNum2 = Math.floor(Math.random() * 10) + 1;
        result = smallNum1 * smallNum2;
        challengeText = `${smallNum1} × ${smallNum2}`;
        break;
      default:
        result = num1 + num2;
        challengeText = `${num1} + ${num2}`;
    }
    
    setChallenge(challengeText);
    setSolution(result.toString());
    setUserInput('');
  };

  useEffect(() => {
    generateChallenge();
  }, []);

  const verifyCaptcha = () => {
    if (!userInput.trim()) {
      onError('Please enter your answer');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      if (userInput.trim() === solution) {
        onVerified();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          onError('Too many incorrect attempts. Please refresh and try again.');
          generateChallenge();
          setAttempts(0);
        } else {
          onError(`Incorrect answer. ${3 - newAttempts} attempts remaining.`);
          setUserInput('');
        }
      }
      setLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      verifyCaptcha();
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto bg-white/10 backdrop-blur-md border border-white/20">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2 text-white">
          <Shield className="w-5 h-5" />
          Security Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30">
            <span className="text-2xl font-mono font-bold text-white">{challenge} = ?</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Enter your answer"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/70"
            disabled={loading}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={verifyCaptcha} 
            disabled={loading} 
            className="flex-1 bg-blue-600/80 hover:bg-blue-700/80 text-white"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
          <Button
            variant="outline"
            onClick={generateChallenge}
            disabled={loading}
            size="icon"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-xs text-white/80 text-center">
          Solve the math problem to continue
        </p>
      </CardContent>
    </Card>
  );
};

export default MathCaptcha;
