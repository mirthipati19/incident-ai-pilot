
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputInput>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    const result = await signUp(formData.email, formData.password, formData.name);
    
    if (result.success) {
      toast({
        title: "Account created!",
        description: `Welcome ${formData.name}! Your user ID is: ${result.userId}`,
      });
      navigate('/itsm');
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create account",
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
      {/* Enhanced overlay for better readability */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      <Card className="w-full max-w-md relative z-10 bg-white/20 backdrop-blur-lg border border-white/30 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/30 backdrop-blur-sm rounded-full border border-white/40">
              <UserPlus className="w-6 h-6 text-black" />
            </div>
          </div>
          <CardTitle className="text-2xl text-black font-bold">Create Account</CardTitle>
          <CardDescription className="text-gray-800 font-semibold">
            Join Mouritech Support and get your unique user ID
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
                <Mail className="mr-2 h-4 w-4" />
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
                <div className="mr-2 h-4 w-4 bg-white rounded-sm flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">M</span>
                </div>
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
              <Label htmlFor="name" className="text-black font-semibold">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="bg-white/30 backdrop-blur-sm border-gray-400 text-black placeholder:text-gray-700 font-medium focus:border-gray-600 focus:ring-gray-400"
              />
            </div>
            
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
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password (min. 6 characters)"
                className="bg-white/30 backdrop-blur-sm border-gray-400 text-black placeholder:text-gray-700 font-medium focus:border-gray-600 focus:ring-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-black font-semibold">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className="bg-white/30 backdrop-blur-sm border-gray-400 text-black placeholder:text-gray-700 font-medium focus:border-gray-600 focus:ring-gray-400"
              />
            </div>
            
            <Button type="submit" className="w-full bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm font-semibold text-white" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-800 font-semibold">
            Already have an account?{' '}
            <Link to="/signin" className="text-blue-800 hover:underline font-bold">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;
