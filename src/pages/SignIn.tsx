
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, User } from 'lucide-react';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface FormData {
  email?: string;
  password?: string;
}

const SignIn = () => {
  const navigate = useNavigate();
  const { signIn, verifyMFA } = useImprovedAuth();
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [signInMode, setSignInMode] = useState("user");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(true);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;

    setIsSubmitting(true);
    try {
      if (showMFA) {
        // Verify MFA code
        const result = await verifyMFA(formData.email, mfaCode, formData.password, captchaToken);
        if (result.success) {
          navigate('/itsm');
        } else {
          alert(`MFA Verification Failed: ${result.error}`);
        }
      } else {
        // Initial sign-in attempt
        const result = await signIn(formData.email, formData.password, false, captchaToken);
        if (result.requiresMFA) {
          setShowMFA(true);
          setShowCaptcha(false);
          alert('MFA code sent to your email. Please verify.');
        } else if (result.success) {
          navigate('/itsm');
        } else {
          alert(`Sign In Failed: ${result.error}`);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;

    setIsSubmitting(true);
    try {
      const result = await signIn(formData.email, formData.password, true, captchaToken);
      if (result.success && result.isAdmin) {
        navigate('/admin');
      } else {
        alert(`Admin Sign In Failed: ${result.error}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCaptchaVerified = (token: string | null) => {
    if (token) {
      setCaptchaToken(token);
      setShowCaptcha(false);
      console.log('✅ Captcha verified:', token);
    } else {
      setCaptchaToken(null);
      alert('Captcha verification failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-full border border-blue-500/30">
              <Shield className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl text-white font-bold">
              Welcome Back
            </CardTitle>
            <p className="text-slate-300 mt-2">
              Sign in to your account
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs value={signInMode} onValueChange={setSignInMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
              <TabsTrigger 
                value="user" 
                className="data-[state=active]:bg-slate-600/50 data-[state=active]:text-white"
              >
                <User className="w-4 h-4 mr-2" />
                User Login
              </TabsTrigger>
              <TabsTrigger 
                value="admin" 
                className="data-[state=active]:bg-slate-600/50 data-[state=active]:text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Login
              </TabsTrigger>
            </TabsList>

            <TabsContent value="user" className="space-y-4 mt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleEmailChange}
                    className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500/50"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500/50"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {showCaptcha && (
                  <div className="space-y-2">
                    <Label className="text-slate-200">Security Verification</Label>
                    <HCaptcha
                      sitekey="9a38cd1d-fa80-475f-a8eb-42f5b8f7a68e"
                      onVerify={handleCaptchaVerified}
                      theme="dark"
                    />
                  </div>
                )}

                {showMFA && (
                  <div className="space-y-2">
                    <Label htmlFor="mfaCode" className="text-slate-200">
                      Verification Code
                    </Label>
                    <Input
                      id="mfaCode"
                      type="text"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500/50"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      required
                    />
                    <p className="text-xs text-slate-400">
                      Check your email for the verification code
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {showMFA ? 'Verifying...' : 'Signing in...'}
                    </>
                  ) : (
                    showMFA ? 'Verify & Sign In' : 'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin" className="space-y-4 mt-6">
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail" className="text-slate-200">Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleEmailChange}
                    className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500/50"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword" className="text-slate-200">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500/50"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {showCaptcha && (
                  <div className="space-y-2">
                    <Label className="text-slate-200">Security Verification</Label>
                    <HCaptcha
                      sitekey="9a38cd1d-fa80-475f-a8eb-42f5b8f7a68e"
                      onVerify={handleCaptchaVerified}
                      theme="dark"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In as Admin'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="text-center space-y-4">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <Button
                variant="link"
                onClick={() => navigate('/signup')}
                className="text-blue-400 hover:text-blue-300 p-0 h-auto font-normal"
              >
                Sign up here
              </Button>
            </p>

            {captchaToken && (
              <div className="text-xs text-green-400 bg-green-400/10 rounded-lg p-2 border border-green-400/20">
                ✅ Security verification completed
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignIn;
