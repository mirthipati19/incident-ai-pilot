import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CaptchaVerification from '@/components/CaptchaVerification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [adminFormData, setAdminFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
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
    
    if (result.success) {
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
      console.log('Admin login attempt with email:', adminFormData.email);
      
      // Check if this is the correct admin credentials
      if (adminFormData.email !== 'murari.mirthipati@authexa.me' || adminFormData.password !== 'Qwertyuiop@0987654321') {
        throw new Error('Invalid admin credentials');
      }
      
      // Try to sign in first
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: adminFormData.email,
        password: adminFormData.password,
      });

      if (authError) {
        console.log('Admin auth error:', authError.message);
        
        // If user doesn't exist or email not confirmed, create/recreate admin account
        if (authError.message.includes('Invalid login credentials') || authError.message.includes('Email not confirmed')) {
          console.log('Creating/recreating admin account...');
          
          // First try to sign up (this will handle both new users and email confirmation)
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: adminFormData.email,
            password: adminFormData.password,
            options: {
              emailRedirectTo: `${window.location.origin}/admin`
            }
          });

          if (signUpError && !signUpError.message.includes('User already registered')) {
            throw new Error(signUpError.message);
          }

          // If user already exists but email not confirmed, we need to handle this
          if (signUpError?.message.includes('User already registered')) {
            // Try to resend confirmation
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: adminFormData.email,
              options: {
                emailRedirectTo: `${window.location.origin}/admin`
              }
            });

            if (resendError) {
              console.log('Resend error:', resendError.message);
            }

            toast({
              title: "Email Confirmation Required",
              description: "Please check your email and click the confirmation link to activate your admin account.",
              variant: "default"
            });
            setAdminLoading(false);
            return;
          }

          if (signUpData.user) {
            // Create admin profile if user was created
            const { error: profileError } = await supabase
              .from('users')
              .upsert({
                id: signUpData.user.id,
                user_id: '000001',
                name: 'Admin User',
                email: adminFormData.email,
                password_hash: 'handled_by_supabase'
              });

            if (profileError) {
              console.error('Profile creation error:', profileError);
            }

            // Create admin role
            const { error: adminError } = await supabase
              .from('admin_users')
              .upsert({
                user_id: signUpData.user.id,
                role: 'admin',
                permissions: ['view_tickets', 'manage_users', 'view_stats', 'admin_dashboard']
              });

            if (adminError) {
              console.error('Admin role creation error:', adminError);
            }

            toast({
              title: "Admin Account Created",
              description: "Please check your email and click the confirmation link to activate your admin account.",
              variant: "default"
            });
            setAdminLoading(false);
            return;
          }
        } else {
          throw new Error(authError.message);
        }
      } else {
        // Successfully signed in
        toast({
          title: "Admin Access Granted",
          description: "Welcome to the admin portal!",
        });
        
        console.log('Navigating to admin portal...');
        navigate('/admin', { replace: true });
      }
      
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast({
        title: "Admin Login Failed",
        description: error.message || "Invalid admin credentials or email not confirmed",
        variant: "destructive"
      });
    } finally {
      setAdminLoading(false);
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
          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/20 backdrop-blur-sm">
              <TabsTrigger value="user" className="data-[state=active]:bg-white/40">User Login</TabsTrigger>
              <TabsTrigger value="admin" className="data-[state=active]:bg-white/40">
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
            </TabsContent>
            
            <TabsContent value="admin" className="space-y-4 mt-6">
              <div className="bg-red-50/20 border border-red-200/30 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-semibold">Admin Access Only</span>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  Use super password: Qwertyuiop@0987654321 with admin email: murari.mirthipati@authexa.me
                </p>
              </div>
              
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-black font-semibold">Admin Email</Label>
                  <Input
                    id="admin-email"
                    name="email"
                    type="email"
                    required
                    value={adminFormData.email}
                    onChange={handleAdminChange}
                    placeholder="Enter admin email"
                    className="bg-white/30 backdrop-blur-sm border-gray-400 text-black placeholder:text-gray-700 font-medium focus:border-gray-600 focus:ring-gray-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-black font-semibold">Super Password</Label>
                  <Input
                    id="admin-password"
                    name="password"
                    type="password"
                    required
                    value={adminFormData.password}
                    onChange={handleAdminChange}
                    placeholder="Enter super password"
                    className="bg-white/30 backdrop-blur-sm border-gray-400 text-black placeholder:text-gray-700 font-medium focus:border-gray-600 focus:ring-gray-400"
                  />
                </div>
                
                <Button type="submit" className="w-full bg-red-600/90 hover:bg-red-700/90 backdrop-blur-sm font-semibold text-white" disabled={adminLoading}>
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
