import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Eye, EyeOff, Mail, Lock, Building2, Shield } from 'lucide-react';
import { Organization } from '@/services/newAdminAuthService';
import ImprovedHCaptcha, { ImprovedHCaptchaRef } from '@/components/ImprovedHCaptcha';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showMFA, setShowMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaCaptchaToken, setMfaCaptchaToken] = useState<string | null>(null);
  
  const captchaRef = useRef<ImprovedHCaptchaRef | null>(null);
  const mfaCaptchaRef = useRef<ImprovedHCaptchaRef | null>(null);

  const { login, getOrganizationByEmail, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/portal');
    }
  }, [isAuthenticated, navigate]);

  // Fetch organization when email changes
  useEffect(() => {
    const fetchOrganization = async () => {
      if (email.includes('@')) {
        try {
          const org = await getOrganizationByEmail(email);
          setOrganization(org);
        } catch (error) {
          setOrganization(null);
        }
      } else {
        setOrganization(null);
      }
    };

    const debounceTimer = setTimeout(fetchOrganization, 500);
    return () => clearTimeout(debounceTimer);
  }, [email, getOrganizationByEmail]);

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaError = (error: string) => {
    toast({
      title: "Security Verification Failed",
      description: "Please try the security verification again.",
      variant: "destructive",
    });
    setCaptchaToken(null);
  };

  const handleMfaCaptchaVerify = (token: string) => {
    setMfaCaptchaToken(token);
  };

  const handleMfaCaptchaError = (error: string) => {
    toast({
      title: "Security Verification Failed",
      description: "Please complete the security verification for MFA.",
      variant: "destructive",
    });
    setMfaCaptchaToken(null);
  };

  const resetCaptcha = () => {
    setCaptchaToken(null);
    if (captchaRef.current && captchaRef.current.resetCaptcha) {
      try {
        captchaRef.current.resetCaptcha();
      } catch (error) {
        console.warn('Could not reset captcha:', error);
      }
    }
  };

  const resetMfaCaptcha = () => {
    setMfaCaptchaToken(null);
    if (mfaCaptchaRef.current && mfaCaptchaRef.current.resetCaptcha) {
      try {
        mfaCaptchaRef.current.resetCaptcha();
      } catch (error) {
        console.warn('Could not reset MFA captcha:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      return;
    }

    if (!captchaToken) {
      toast({
        title: 'Security Verification Required',
        description: 'Please complete the security verification.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password, captchaToken);
      
      if (result.success) {
        if (result.requiresMFA) {
          setShowMFA(true);
          toast({
            title: "MFA Required",
            description: "Please check your email for the verification code.",
          });
        } else {
          toast({
            title: 'Login Successful',
            description: 'Welcome to the admin portal!',
          });
          navigate('/admin/portal');
        }
      } else {
        toast({
          title: 'Login Failed',
          description: result.error || 'Invalid credentials. Please try again.',
          variant: 'destructive',
        });
        resetCaptcha();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mfaCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter the verification code.",
        variant: "destructive",
      });
      return;
    }

    if (!mfaCaptchaToken) {
      toast({
        title: "Security Verification Required",
        description: "Please complete the security verification.",
        variant: "destructive",
      });
      return;
    }

    setMfaLoading(true);

    try {
      // Implement MFA verification logic here
      toast({
        title: 'Login Successful',
        description: 'Welcome to the admin portal!',
      });
      navigate('/admin/portal');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'MFA verification failed. Please try again.',
        variant: 'destructive',
      });
      setMfaCode("");
      resetMfaCaptcha();
    } finally {
      setMfaLoading(false);
    }
  };

  if (showMFA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white shadow-2xl w-full max-w-md">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src="/lovable-uploads/5913cddb-4ae5-4588-9031-3d2d2c07a571.png" alt="Authexa" className="w-12 h-12" />
              <div>
                <h1 className="text-2xl font-bold">Admin Portal</h1>
                <p className="text-sm text-blue-200">Authexa ITSM</p>
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-white">Multi-Factor Authentication</CardTitle>
            <CardDescription className="text-blue-200">
              Enter the verification code sent to your email
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleMFASubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="mfaCode" className="text-white font-medium">Verification Code</Label>
                <Input
                  id="mfaCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="text-center text-lg font-mono tracking-widest h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                  maxLength={6}
                  required
                />
              </div>

              <ImprovedHCaptcha 
                ref={mfaCaptchaRef}
                onVerify={handleMfaCaptchaVerify}
                onError={handleMfaCaptchaError}
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg h-12"
                disabled={mfaLoading || !mfaCaptchaToken}
              >
                {mfaLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => setShowMFA(false)}
                className="text-sm text-blue-200 hover:text-white font-medium"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src="/lovable-uploads/5913cddb-4ae5-4588-9031-3d2d2c07a571.png" alt="Authexa" className="w-12 h-12" />
              <div>
                <h1 className="text-2xl font-bold">Admin Portal</h1>
                <p className="text-sm text-blue-200">Authexa ITSM</p>
              </div>
            </div>
            
            {organization && (
              <div className="flex items-center justify-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                {organization.logo_url ? (
                  <img 
                    src={organization.logo_url} 
                    alt={organization.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-blue-400" />
                )}
                <div className="text-left">
                  <p className="font-semibold text-white">{organization.name}</p>
                  <p className="text-sm text-blue-200">{organization.domain}</p>
                </div>
              </div>
            )}
            
            <CardTitle className="text-xl font-bold text-white mt-4">Administrator Sign In</CardTitle>
            <CardDescription className="text-blue-200">
              Access your organization's admin dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@yourcompany.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
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
                    placeholder="Enter your admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <ImprovedHCaptcha 
                ref={captchaRef}
                onVerify={handleCaptchaVerify}
                onError={handleCaptchaError}
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg h-12"
                disabled={isLoading || !captchaToken}
              >
                {isLoading ? "Signing In..." : "Sign In to Admin Portal"}
              </Button>
            </form>

            <div className="mt-8 text-center space-y-4">
              <div className="text-sm text-blue-200">
                Not an admin?{" "}
                <Link to="/signin" className="text-white hover:text-blue-200 font-medium hover:underline">
                  Regular User Login
                </Link>
              </div>
              
              <div className="text-sm text-blue-200">
                Need an admin account?{" "}
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

export default AdminLogin;
