
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Eye, EyeOff, Mail, Lock, Building2, Shield } from 'lucide-react';
import { Organization } from '@/services/newAdminAuthService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast as sonnerToast } from "sonner";

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

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

    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        toast({
          title: 'Login Successful',
          description: 'Welcome to the admin portal!',
        });
        navigate('/admin/portal');
      } else {
        toast({
          title: 'Login Failed',
          description: result.error || 'Invalid credentials. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      sonnerToast.error('Please enter your email address');
      return;
    }

    try {
      const response = await fetch('https://opwiwaysvdmkajmhhbzr.supabase.co/functions/v1/admin-auth-functions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wd2l3YXlzdmRta2FqbWhoYnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzAyODQsImV4cCI6MjA2NTY0NjI4NH0.U-eyRsfuwHtKq94BD-sYiDVjH2yg9b2fp33xeSPlmL0`
        },
        body: JSON.stringify({
          action: 'forgotPassword',
          email: resetEmail
        })
      });

      const result = await response.json();
      
      if (result.error) {
        sonnerToast.error(result.error.message);
      } else {
        sonnerToast.success('Password reset instructions sent to your email');
        setIsResetDialogOpen(false);
        setResetEmail('');
      }
    } catch (error) {
      sonnerToast.error('Failed to send reset instructions');
    }
  };

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

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg h-12"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In to Admin Portal"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" className="text-sm text-blue-200 hover:text-white">
                    Forgot your password?
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white text-black">
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                      Enter your email address and we'll send you instructions to reset your password.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="Enter your email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleForgotPassword} className="w-full">
                      Send Reset Instructions
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

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
