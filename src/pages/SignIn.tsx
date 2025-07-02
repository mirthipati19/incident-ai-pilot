
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, Shield, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ImprovedHCaptcha } from '@/components/ImprovedHCaptcha';
import { mfaService } from '@/services/mfaService';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [isMfaLoading, setIsMfaLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      toast({
        title: 'Registration Successful!',
        description: 'Please check your email to verify your account before signing in.',
      });
    }
  }, [searchParams, toast]);

  const refreshCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaKey(prev => prev + 1);
  };

  const resetForm = () => {
    setFormData({ email: '', password: '' });
    refreshCaptcha();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      toast({
        title: 'Captcha Required',
        description: 'Please complete the captcha verification.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Starting sign in process');
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
        options: {
          captchaToken: captchaToken
        }
      });

      if (authError) {
        console.error('🔐 Auth error:', authError);
        if (authError.message.includes('captcha')) {
          refreshCaptcha();
        } else {
          resetForm();
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user data returned');
      }

      console.log('🔐 Auth successful, sending MFA code');
      
      // Send MFA code
      const mfaResult = await mfaService.sendMFACode(formData.email);
      if (!mfaResult.success) {
        throw new Error(mfaResult.error || 'Failed to send MFA code');
      }

      console.log('🔐 MFA code sent, showing MFA form');
      setShowMFA(true);

      toast({
        title: 'MFA Code Sent',
        description: 'Please check your email for the verification code.',
      });

    } catch (error: any) {
      console.error('🔐 Sign in error:', error);
      toast({
        title: 'Sign In Failed',
        description: error.message || 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mfaCode.trim()) {
      toast({
        title: 'MFA Code Required',
        description: 'Please enter the verification code.',
        variant: 'destructive',
      });
      return;
    }

    setIsMfaLoading(true);

    try {
      console.log('🔐 Verifying MFA code');
      
      const result = await mfaService.verifyMFACode(formData.email, mfaCode);
      
      if (!result.success) {
        throw new Error(result.error || 'Invalid verification code');
      }

      console.log('🔐 MFA verified successfully, redirecting to dashboard');
      
      toast({
        title: 'Sign In Successful',
        description: 'Welcome back!',
      });

      navigate('/dashboard');

    } catch (error: any) {
      console.error('🔐 MFA verification error:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid verification code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/signin`
      });

      if (error) throw error;

      toast({
        title: 'Reset Email Sent',
        description: 'Please check your email for password reset instructions.',
      });

      setShowResetForm(false);
      setResetEmail('');

    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: 'Reset Failed',
        description: error.message || 'Failed to send reset email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  if (showMFA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative z-10 w-full max-w-md">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white shadow-2xl">
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Verify Your Identity</h1>
                  <p className="text-sm text-blue-200">Authexa ITSM</p>
                </div>
              </div>
              
              <CardTitle className="text-xl font-bold text-white">Enter Verification Code</CardTitle>
              <CardDescription className="text-blue-200">
                We've sent a 6-digit code to your email
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleMFAVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mfaCode" className="text-white font-medium">Verification Code</Label>
                  <Input
                    id="mfaCode"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg h-12"
                  disabled={isMfaLoading}
                >
                  {isMfaLoading ? "Verifying..." : "Verify & Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Button
                  variant="link"
                  onClick={() => setShowMFA(false)}
                  className="text-blue-200 hover:text-white"
                >
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showResetForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative z-10 w-full max-w-md">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white shadow-2xl">
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Reset Password</h1>
                  <p className="text-sm text-blue-200">Authexa ITSM</p>
                </div>
              </div>
              
              <CardTitle className="text-xl font-bold text-white">Forgot Your Password?</CardTitle>
              <CardDescription className="text-blue-200">
                Enter your email to receive reset instructions
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail" className="text-white font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg h-12"
                  disabled={isResetLoading}
                >
                  {isResetLoading ? "Sending..." : "Send Reset Instructions"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Button
                  variant="link"
                  onClick={() => setShowResetForm(false)}
                  className="text-blue-200 hover:text-white"
                >
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome Back</h1>
                <p className="text-sm text-blue-200">Authexa ITSM</p>
              </div>
            </div>
            
            <CardTitle className="text-xl font-bold text-white">Sign In to Your Account</CardTitle>
            <CardDescription className="text-blue-200">
              Enter your credentials to access the portal
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div></div>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowResetForm(true)}
                    className="text-blue-200 hover:text-white text-sm p-0"
                  >
                    Forgot Password?
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <ImprovedHCaptcha 
                      key={captchaKey}
                      onVerify={setCaptchaToken} 
                      onError={() => setCaptchaToken(null)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={refreshCaptcha}
                      className="text-blue-200 hover:text-white"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg h-12"
                disabled={isLoading || !captchaToken}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <div className="text-sm text-blue-200">
                Need an account?{" "}
                <Link to="/signup" className="text-white hover:text-blue-200 font-medium hover:underline">
                  Sign Up Here
                </Link>
              </div>
              <div className="text-sm text-blue-200 mt-2">
                Admin?{" "}
                <Link to="/admin/register" className="text-white hover:text-blue-200 font-medium hover:underline">
                  Register Organization
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
