import { useState, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useImprovedAuth } from "@/contexts/ImprovedAuthContext";
import { Eye, EyeOff, Mail, Lock, Bot, Shield, Zap, Users, BarChart3, CheckCircle, ArrowLeft } from "lucide-react";
import ImprovedHCaptcha from "@/components/ImprovedHCaptcha";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showMFA, setShowMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const captchaRef = useRef<{ resetCaptcha: () => void } | null>(null);

  const { signIn, verifyMFA } = useImprovedAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleCaptchaVerify = (token: string) => {
    console.log('✅ Captcha verified with token:', token);
    setCaptchaToken(token);
  };

  const handleCaptchaError = (error: string) => {
    console.error('❌ Captcha error:', error);
    toast({
      title: "Security Verification Failed",
      description: "Please try the security verification again.",
      variant: "destructive",
    });
    setCaptchaToken(null);
  };

  const refreshCaptchaAndFields = () => {
    // Clear form fields
    setEmail("");
    setPassword("");
    
    // Reset captcha token
    setCaptchaToken(null);
    
    // Reset the captcha component if ref is available
    if (captchaRef.current && captchaRef.current.resetCaptcha) {
      try {
        captchaRef.current.resetCaptcha();
      } catch (error) {
        console.warn('Could not reset captcha:', error);
      }
    }
  };

  const resetCaptchaOnly = () => {
    // Reset captcha token
    setCaptchaToken(null);
    
    // Reset the captcha component if ref is available
    if (captchaRef.current && captchaRef.current.resetCaptcha) {
      try {
        captchaRef.current.resetCaptcha();
      } catch (error) {
        console.warn('Could not reset captcha:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    if (!captchaToken) {
      toast({
        title: "Security Verification Required",
        description: "Please complete the security verification.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn(email, password, false, captchaToken);
      
      if (result.success) {
        if (result.requiresMFA) {
          setShowMFA(true);
          toast({
            title: "MFA Required",
            description: "Please check your email for the verification code.",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have been successfully signed in.",
          });
          navigate("/dashboard");
        }
      } else {
        toast({
          title: "Sign In Failed",
          description: result.error || "Invalid email or password. Please try again.",
          variant: "destructive",
        });
        refreshCaptchaAndFields();
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      refreshCaptchaAndFields();
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

    // For MFA, we need a fresh captcha token if the previous one was used
    if (!captchaToken) {
      toast({
        title: "Security Verification Required",
        description: "Please complete the security verification again.",
        variant: "destructive",
      });
      resetCaptchaOnly();
      return;
    }

    setMfaLoading(true);

    try {
      const result = await verifyMFA(email, mfaCode, password, captchaToken);
      
      if (result.success) {
        toast({
          title: "Welcome back!",
          description: "You have been successfully signed in.",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "Invalid verification code. Please try again.",
          variant: "destructive",
        });
        setMfaCode("");
        // Reset captcha for retry
        resetCaptchaOnly();
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setMfaCode("");
      resetCaptchaOnly();
    } finally {
      setMfaLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    setShowMFA(false);
    setMfaCode("");
    resetCaptchaOnly();
  };

  if (showMFA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">Verify Your Identity</span>
            </div>
            <CardTitle className="text-xl font-bold text-gray-800">Authexa Service Portal</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Enter Verification Code
            </CardDescription>
            <p className="text-sm text-gray-500 mt-2">
              We've sent a 6-digit code to your email
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMFASubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="mfaCode" className="text-gray-700 font-medium">Verification Code</Label>
                <Input
                  id="mfaCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="text-center text-lg font-mono tracking-widest h-12 border-2 focus:border-blue-500"
                  maxLength={6}
                  required
                />
              </div>

              <ImprovedHCaptcha 
                ref={captchaRef}
                onVerify={handleCaptchaVerify}
                onError={handleCaptchaError}
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg h-12"
                disabled={mfaLoading || !captchaToken}
              >
                {mfaLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={handleBackToSignIn}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      {/* Left Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="lg:hidden mb-6">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">Authexa Service Portal</span>
              </div>
            </div>
            
            {searchParams.get('registered') && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Registration successful! Please verify your email.</span>
                </div>
              </div>
            )}
            
            <CardTitle className="text-2xl font-bold text-gray-800">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Sign in to your service portal account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-2 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-2 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
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
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-8 text-center space-y-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                  Sign up here
                </Link>
              </p>
              
              <p className="text-sm text-gray-600">
                Are you an admin?{" "}
                <Link to="/admin/login" className="text-purple-600 hover:text-purple-700 font-medium hover:underline">
                  Admin Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Features */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center p-12 relative">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Authexa Service Portal</h1>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Welcome Back
            </h2>
            <p className="text-blue-200 text-lg mb-8">
              Access your personalized IT service management dashboard
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4 text-left">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Quick Resolution</h3>
                <p className="text-blue-200 text-sm">Get your IT issues resolved faster than ever</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 text-left">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Team Support</h3>
                <p className="text-blue-200 text-sm">Connect with your IT support team instantly</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 text-left">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Track Progress</h3>
                <p className="text-blue-200 text-sm">Monitor your requests and service history</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
