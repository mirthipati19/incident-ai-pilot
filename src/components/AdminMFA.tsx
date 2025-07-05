
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminMFAProps {
  email: string;
  onVerify: (token: string) => Promise<boolean>;
  onBack: () => void;
}

const AdminMFA: React.FC<AdminMFAProps> = ({ email, onVerify, onBack }) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast({
            title: 'Token Expired',
            description: 'Please request a new verification code.',
            variant: 'destructive',
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toast]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter the verification code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await onVerify(token);
      if (!success) {
        toast({
          title: 'Verification Failed',
          description: 'Invalid verification code. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during verification.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white shadow-2xl w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-xl font-bold text-white">Two-Factor Authentication</CardTitle>
        <p className="text-blue-200 text-sm">
          We've sent a verification code to {email}
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="token" className="text-white font-medium">
              Verification Code
            </Label>
            <Input
              id="token"
              type="text"
              placeholder="Enter 6-digit code"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 text-center text-lg tracking-widest"
              maxLength={6}
              required
            />
          </div>

          <div className="text-center text-sm text-blue-200">
            Code expires in: <span className="font-mono text-white">{formatTime(timeLeft)}</span>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg h-12"
            disabled={isLoading || timeLeft === 0}
          >
            {isLoading ? "Verifying..." : "Verify Code"}
          </Button>

          <Button
            type="button"
            onClick={onBack}
            variant="ghost"
            className="w-full text-white hover:bg-white/10 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminMFA;
