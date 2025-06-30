
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, Shield, Home, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import MathCaptcha from '@/components/MathCaptcha';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [adminFormData, setAdminFormData] = useState({
    email: 'murari.mirthipati@authexa.me',
    password: 'Qwertyuiop@0987654321'
  });
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaEmail, setMfaEmail] = useState('');
  const [mfaPassword, setMfaPassword] = useState('');
  const { signIn, verifyMFA, completeMFALogin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useSessionTimeout(2); // 2 minutes timeout

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminFormData({
      ...adminFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaVerified) {
      setShowCaptcha(true);
      return;
    }
    
    setLoading(true);
    
    const result = await signIn(formData.email, formData.password);
    
    if (result.success && result.requiresMFA) {
      setMfaEmail(formData.email);
      setMfaPassword(formData.password);
      setShowMFA(true);
      toast({
        title: "MFA Required",
        description: "Please check your email for the verification code.",
      });
    } else if (result.success) {
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      navigate('/itsm');
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to sign in",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    
    try {
      const result = await signIn(adminFormData.email, adminFormData.password);
      
      if (result.success && result.requiresMFA) {
        setMfaEmail(adminFormData.email);
        setMfaPassword(adminFormData.password);
        setShowMFA(true);
        toast({
          title: "Admin MFA Required",
          description: "Please check your email for the verification code.",
        });
      } else {
        throw new Error('MFA setup failed');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast({
        title: "Admin Login Failed",
        description: "Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleMFAVerification = async () => {
    if (!mfaCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter the MFA code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const verifyResult = await verifyMFA(mfaEmail, mfaCode);
      
      if (verifyResult.success) {
        const loginResult = await completeMFALogin(mfaEmail, mfaPassword);
        
        if (loginResult.success) {
          toast({
            title: loginResult.isAdmin ? "Admin Access Granted" : "Welcome back!",
            description: "MFA verification successful.",
          });
          
          if (loginResult.isAdmin) {
            navigate('/admin', { replace: true });
          } else {
            navigate('/itsm');
          }
        } else {
          toast({
            title: "Login Failed",
            description: loginResult.error || "Failed to complete login",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "MFA Verification Failed",
          description: verifyResult.error || "Invalid MFA code",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "MFA verification failed",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'azure') => {
    setSocialLoading(provider);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/itsm`
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in with social provider",
        variant: "destructive"
      });
    } finally {
      setSocialLoading(null);
    }
  };

  const handleCaptchaVerified = () => {
    setCaptchaVerified(true);
    setShowCaptcha(false);
    toast({
      title: "Verified",
      description: "Security verification completed successfully.",
    });
  };

  const handleCaptchaError = (error: string) => {
    toast({
      title: "Verification Error",
      description: error,
      variant: "destructive"
    });
  };

  if (showCaptcha) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10">
          <MathCaptcha 
            onVerified={handleCaptchaVerified}
            onError={handleCaptchaError}
          />
          <div className="text-center mt-4">
            <Button 
              variant="ghost" 
              onClick={() => setShowCaptcha(false)}
              className="text-white hover:bg-white/20"
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showMFA) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="absolute inset-0 bg-black/40"></div>
        
        <Card className="w-full max-w-md relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-600/20 backdrop-blur-sm rounded-full border border-blue-400/30">
                <Mail className="w-6 h-6 text-blue-300" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white font-bold">Multi-Factor Authentication</CardTitle>
            <CardDescription className="text-gray-300 font-semibold">
              Enter the verification code sent to your email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mfaCode" className="text-white font-semibold">Verification Code</Label>
              <Input
                id="mfaCode"
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/50 font-medium focus:border-blue-400 focus:ring-blue-400/20"
                maxLength={6}
              />
            </div>
            
            <Button 
              onClick={handleMFAVerification} 
              className="w-full bg-blue-600/80 hover:bg-blue-700/80 backdrop-blur-sm font-semibold text-white" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>
            
            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowMFA(false);
                  setMfaCode('');
                  setMfaEmail('');
                  setMfaPassword('');
                }}
                className="text-white/80 hover:bg-white/10"
              >
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Home Button */}
      <div className="absolute top-4 left-4 z-20">
        <Link to="/">
          <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </Link>
      </div>
      
      <Card className="w-full max-w-md relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600/20 backdrop-blur-sm rounded-full border border-blue-400/30">
              <LogIn className="w-6 h-6 text-blue-300" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white font-bold">Welcome Back</CardTitle>
          <CardDescription className="text-gray-300 font-semibold">
            Sign in to your Authexa Support account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border border-white/20">
              <TabsTrigger value="user" className="data-[state=active]:bg-white/20 text-white data-[state=active]:text-white">User Login</TabsTrigger>
              <TabsTrigger value="admin" className="data-[state=active]:bg-white/20 text-white data-[state=active]:text-white">
                <Shield className="w-4 h-4 mr-2" />
                Admin Portal
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="user" className="space-y-4 mt-6">
              {/* Social Sign In Buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  onClick={() => handleSocialSignIn('google')}
                  disabled={socialLoading !== null}
                  className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold"
                  variant="outline"
                >
                  {socialLoading === 'google' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Continue with Google
                </Button>
                
                <Button
                  onClick={() => handleSocialSignIn('azure')}
                  disabled={socialLoading !== null}
                  className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold"
                  variant="outline"
                >
                  {socialLoading === 'azure' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#5059C9"
                        d="M9.5 10.5h3v3h-3v-3z"
                      />
                      <path
                        fill="#5059C9"
                        d="M14.5 10.5h3v3h-3v-3z"
                      />
                      <path
                        fill="#5059C9"
                        d="M9.5 5.5h3v3h-3v-3z"
                      />
                      <path
                        fill="#5059C9"
                        d="M14.5 15.5h3v3h-3v-3z"
                      />
                    </svg>
                  )}
                  Continue with Microsoft Teams
                </Button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-2 text-gray-300 font-semibold">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-semibold">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/50 font-medium focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-semibold">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/50 font-medium focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>
                
                <Button type="submit" className="w-full bg-blue-600/80 hover:bg-blue-700/80 backdrop-blur-sm font-semibold text-white" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="admin" className="space-y-4 mt-6">
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  <span className="text-red-300 font-semibold">Admin Access Only</span>
                </div>
                <p className="text-red-200 text-sm mt-1">
                  Admin credentials are pre-filled for security
                </p>
              </div>
              
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-white font-semibold">Admin Email</Label>
                  <Input
                    id="admin-email"
                    name="email"
                    type="email"
                    required
                    value={adminFormData.email}
                    onChange={handleAdminChange}
                    placeholder="Enter admin email"
                    className="bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/50 font-medium focus:border-blue-400 focus:ring-blue-400/20"
                    readOnly
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-white font-semibold">Super Password</Label>
                  <Input
                    id="admin-password"
                    name="password"
                    type="password"
                    required
                    value={adminFormData.password}
                    onChange={handleAdminChange}
                    placeholder="Enter super password"
                    className="bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/50 font-medium focus:border-blue-400 focus:ring-blue-400/20"
                    readOnly
                  />
                </div>
                
                <Button type="submit" className="w-full bg-red-600/80 hover:bg-red-700/80 backdrop-blur-sm font-semibold text-white" disabled={adminLoading}>
                  {adminLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accessing Admin Portal...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Access Admin Portal
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center text-sm text-gray-300 font-semibold">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-400 hover:underline font-bold">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignIn;
