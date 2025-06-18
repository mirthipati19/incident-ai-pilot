
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CaptchaVerificationProps {
  onVerified: (sessionId: string) => void;
  onError: (error: string) => void;
}

const CaptchaVerification = ({ onVerified, onError }: CaptchaVerificationProps) => {
  const [challenge, setChallenge] = useState('');
  const [solution, setSolution] = useState('');
  const [userInput, setUserInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let result;
    let challengeText;
    
    switch (operator) {
      case '+':
        result = num1 + num2;
        challengeText = `${num1} + ${num2}`;
        break;
      case '-':
        result = Math.max(num1, num2) - Math.min(num1, num2);
        challengeText = `${Math.max(num1, num2)} - ${Math.min(num1, num2)}`;
        break;
      case '*':
        result = num1 * num2;
        challengeText = `${num1} × ${num2}`;
        break;
      default:
        result = num1 + num2;
        challengeText = `${num1} + ${num2}`;
    }
    
    setChallenge(challengeText);
    setSolution(result.toString());
    setUserInput('');
    
    return { challengeText, solution: result.toString() };
  };

  const createCaptchaSession = async () => {
    const { challengeText, solution } = generateCaptcha();
    const newSessionId = Math.random().toString(36).substring(2, 15);
    
    try {
      const { error } = await supabase
        .from('captcha_verifications')
        .insert({
          session_id: newSessionId,
          challenge: challengeText,
          solution: solution
        });
      
      if (error) throw error;
      
      setSessionId(newSessionId);
    } catch (error) {
      console.error('Error creating captcha session:', error);
      onError('Failed to create captcha verification');
    }
  };

  useEffect(() => {
    createCaptchaSession();
  }, []);

  const verifyCaptcha = async () => {
    if (!userInput.trim()) {
      onError('Please enter your answer');
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('captcha_verifications')
        .select('solution, attempts, expires_at')
        .eq('session_id', sessionId)
        .single();
      
      if (error) throw error;
      
      if (new Date() > new Date(data.expires_at)) {
        onError('Captcha expired. Please try again.');
        createCaptchaSession();
        setLoading(false);
        return;
      }
      
      if (data.attempts >= 3) {
        onError('Too many attempts. Please try again.');
        createCaptchaSession();
        setLoading(false);
        return;
      }
      
      if (userInput.trim() === data.solution) {
        await supabase
          .from('captcha_verifications')
          .update({ verified: true })
          .eq('session_id', sessionId);
        
        onVerified(sessionId);
      } else {
        await supabase
          .from('captcha_verifications')
          .update({ attempts: data.attempts + 1 })
          .eq('session_id', sessionId);
        
        onError('Incorrect answer. Please try again.');
        setUserInput('');
      }
    } catch (error) {
      console.error('Error verifying captcha:', error);
      onError('Failed to verify captcha');
    }
    
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Security Verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="bg-gray-100 p-4 rounded-lg border-2 border-dashed border-gray-300">
            <span className="text-2xl font-mono font-bold">{challenge} = ?</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Enter your answer"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && verifyCaptcha()}
          />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={verifyCaptcha} disabled={loading} className="flex-1">
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
          <Button
            variant="outline"
            onClick={createCaptchaSession}
            disabled={loading}
            size="icon"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaptchaVerification;
