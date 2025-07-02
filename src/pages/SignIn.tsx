
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useImprovedAuth } from "@/contexts/ImprovedAuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Lock, Shield, Bot, Zap, Users, BarChart3, RefreshCw } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import ImprovedHCaptcha from "@/components/ImprovedHCaptcha";
import { sendMFACode } from "@/services/mfaService";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [isMfaLoading, setIsMfaLoading] = useState(false);
  const [mfaCaptchaToken, setMfaCaptchaToken] = useState<string | null>(null);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const { signIn, verifyMFA } = useImprovedAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleMfaCaptchaVerify = (token: string) => {
    setMfaCaptchaToken(token);
  };

  const handleCaptchaError = (error: string) => {
    toast({
      title: "Security Verification Failed",
      description: "Please try the security verification again.",
      variant: "destructive",
    });
  };

  const handleResendMFA = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    try {
      const result = await sendMFACode(email);
      if (result.success) {
        toast({
          title: "Code Resent",
          description: "A new verification code has been sent to your email.",
        });
        
        // Reset OTP attempts and start cooldown
        setOtpAttempts(0);
        setMfaCode("");
        setResendCooldown(60);
        
        // Countdown timer
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast({
          title: "Resend Failed",
          description: result.error || "Failed to resend verification code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification code.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const result = await signIn(email, password, isAdmin, captchaToken);
      
      if (result.success) {
        if (result.requiresMFA) {
          setRequiresMFA(true);
          setCaptchaToken(null);
          setOtpAttempts(0);
          toast({
            title: "Verification Required",
            description: "We've sent a verification code to your email.",
          });
        } else {
          toast({
            title: "Welcome Back!",
            description: `Successfully signed in${isAdmin ? " as Administrator" : ""}.`,
          });
          navigate(isAdmin ? "/admin" : "/itsm");
        }
      } else {
        toast({
          title: "Sign In Failed",
          description: result.error || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mfaCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the complete 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    if (!mfaCaptchaToken) {
      toast({
        title: "Security Verification Required",
        description: "Please complete the security verification for MFA.",
        variant: "destructive",
      });
      return;
    }

    // Check attempt limit
    if (otpAttempts >= 3) {
      toast({
        title: "Too Many Attempts",
        description: "You have exceeded the maximum number of attempts. A new code will be sent.",
        variant: "destructive",
      });
      await handleResendMFA();
      return;
    }

    setIsMfaLoading(true);

    try {
      const result = await verifyMFA(email, mfaCode, password, mfaCaptchaToken);
      
      if (result.success) {
        toast({
          title: "Access Granted",
          description: "Welcome to your ITSM portal!",
        });
        navigate(result.isAdmin ? "/admin" : "/itsm");
      } else {
        const newAttempts = otpAttempts + 1;
        setOtpAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          toast({
            title: "Too Many Failed Attempts",
            description: "Maximum attempts exceeded. A new verification code will be sent.",
            variant: "destructive",
          });
          await handleResendMFA();
        } else {
          toast({
            title: "Verification Failed",
            description: `${result.error || "Invalid verification code."} Attempts remaining: ${3 - newAttempts}`,
            variant: "destructive",
          });
        }
        
        setMfaCode("");
        setMfaCaptchaToken(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMfaLoading(false);
    }
  };

  const resetForm = () => {
    setRequiresMFA(false);
    setMfaCode("");
    setCaptchaToken(null);
    setMfaCaptchaToken(null);
    setOtpAttempts(0);
    setResendCooldown(0);
  };

  if (requiresMFA) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Security Verification
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Enter the 6-digit code sent to your email
            </CardDescription>
            
            {/* Resend Option */}
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendMFA}
                disabled={isResending || resendCooldown > 0}
                className="text-sm"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  "Resend Code"
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMFASubmit} className="space-y-6">
              <div className="flex justify-center">
                <InputOTP 
                  maxLength={6} 
                  value={mfaCode} 
                  onChange={(value) => setMfaCode(value)}
                  className="gap-2"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {otpAttempts > 0 && (
                <div className="text-center text-sm text-orange-600">
                  Attempts remaining: {3 - otpAttempts}
                </div>
              )}

              <ImprovedHCaptcha 
                onVerify={handleMfaCaptchaVerify}
                onError={handleCaptchaError}
              />
              
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg"
                  disabled={isMfaLoading || mfaCode.length !== 6 || !mfaCaptchaToken}
                >
                  {isMfaLoading ? "Verifying..." : "Verify & Continue"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-2 hover:bg-gray-50"
                  onClick={resetForm}
                >
                  Back to Sign In
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center p-12 relative">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Authexa ITSM</h1>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              AI-Powered IT Service Management
            </h2>
            <p className="text-blue-200 text-lg mb-8">
              Transform your IT operations with intelligent automation and streamlined workflows
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-blue-100">
              <Zap className="w-5 h-5 text-blue-400" />
              <span>Intelligent Ticket Routing</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <Users className="w-5 h-5 text-purple-400" />
              <span>Team Collaboration</span>
            </div>
            <div className="flex items-center gap-3 text-blue-100">
              <BarChart3 className="w-5 h-5 text-green-400" />
              <span>Advanced Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="lg:hidden mb-6">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">Authexa ITSM</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Sign in to your ITSM portal
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="admin"
                  checked={isAdmin}
                  onCheckedChange={(checked) => setIsAdmin(checked as boolean)}
                />
                <Label htmlFor="admin" className="text-sm text-gray-600">
                  Sign in as Administrator
                </Label>
              </div>

              <ImprovedHCaptcha 
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

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                  Create one here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
