
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useImprovedAuth } from "@/contexts/ImprovedAuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Lock, Shield, User } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import ImprovedHCaptcha from "@/components/ImprovedHCaptcha";
import { authConfig } from "@/utils/authConfig";

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
  
  const { signIn, verifyMFA, isDevelopmentMode } = useImprovedAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCaptchaVerify = (token: string) => {
    console.log('✅ Captcha verified for sign in');
    setCaptchaToken(token);
  };

  const handleCaptchaError = (error: string) => {
    console.error('❌ Captcha error:', error);
    toast({
      title: "Security Verification Failed",
      description: "Please try the security verification again.",
      variant: "destructive",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken && !authConfig.isDevelopment) {
      toast({
        title: "Security Verification Required",
        description: "Please complete the security verification.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn(email, password, isAdmin, captchaToken || undefined);
      
      if (result.success) {
        if (result.requiresMFA) {
          setRequiresMFA(true);
          toast({
            title: "Verification Required",
            description: isDevelopmentMode 
              ? "Check the console for your MFA code (Development Mode)"
              : "We've sent a verification code to your email.",
          });
        } else {
          toast({
            title: "Success!",
            description: `Welcome back${isAdmin ? ", Admin" : ""}!`,
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
      console.error('Sign in error:', error);
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

    setIsMfaLoading(true);

    try {
      const result = await verifyMFA(email, mfaCode, password, captchaToken || undefined);
      
      if (result.success) {
        toast({
          title: "Success!",
          description: "Welcome back!",
        });
        navigate(result.isAdmin ? "/admin" : "/itsm");
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "Invalid verification code. Please try again.",
          variant: "destructive",
        });
        setMfaCode("");
      }
    } catch (error) {
      console.error('MFA verification error:', error);
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
  };

  if (requiresMFA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-semibold">Verification Required</CardTitle>
            <CardDescription>
              {isDevelopmentMode 
                ? "Check the browser console for your verification code"
                : "Enter the 6-digit code sent to your email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMFASubmit} className="space-y-6">
              <div className="flex justify-center">
                <InputOTP 
                  maxLength={6} 
                  value={mfaCode} 
                  onChange={(value) => setMfaCode(value)}
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
              
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isMfaLoading || mfaCode.length !== 6}
                >
                  {isMfaLoading ? "Verifying..." : "Verify Code"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your Authexa Support account
          </CardDescription>
          {isDevelopmentMode && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              Development Mode Active
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
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
              <Label htmlFor="admin" className="text-sm">
                Sign in as Administrator
              </Label>
            </div>

            <ImprovedHCaptcha 
              onVerify={handleCaptchaVerify}
              onError={handleCaptchaError}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || (!captchaToken && !authConfig.isDevelopment)}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-600 hover:underline font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignIn;
