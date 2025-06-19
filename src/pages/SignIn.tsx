import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CaptchaVerification from '@/components/CaptchaVerification';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
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
    
    if (result.success) {
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      
      // Redirect based on admin status
      if (result.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/itsm');
      }
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to sign in",
        variant: "destructive"
      });
    }
    setLoading(false);
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
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: `url('/lovable-uploads/50b753fc-5735-49ae-ad55-1cc4efdd1bc3.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10">
          <CaptchaVerification 
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

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url('/lovable-uploads/50b753fc-5735-49ae-ad55-1cc4efdd1bc3.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/50"></div>
      
      <Card className="w-full max-w-md relative z-10 bg-white/20 backdrop-blur-lg border border-white/30 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/30 backdrop-blur-sm rounded-full border border-white/40">
              <LogIn className="w-6 h-6 text-black" />
            </div>
          </div>
          <CardTitle className="text-2xl text-black font-bold">Welcome Back</CardTitle>
          <CardDescription className="text-gray-800 font-semibold">
            Sign in to your Mouritech Support account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Social Sign In Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              onClick={() => handleSocialSignIn('google')}
              disabled={socialLoading !== null}
              className="w-full bg-white/30 hover:bg-white/40 backdrop-blur-sm border border-white/40 text-black font-semibold"
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
              className="w-full bg-white/30 hover:bg-white/40 backdrop-blur-sm border border-white/40 text-black font-semibold"
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
              <span className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-gray-800 font-semibold">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black font-semibold">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="bg-white/30 backdrop-blur-sm border-gray-400 text-black placeholder:text-gray-700 font-medium focus:border-gray-600 focus:ring-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-black font-semibold">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="bg-white/30 backdrop-blur-sm border-gray-400 text-black placeholder:text-gray-700 font-medium focus:border-gray-600 focus:ring-gray-400"
              />
            </div>
            
            <Button type="submit" className="w-full bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm font-semibold text-white" disabled={loading}>
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
          
          <div className="mt-6 text-center text-sm text-gray-800 font-semibold">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-800 hover:underline font-bold">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignIn;
