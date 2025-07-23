import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSimpleAdminAuth } from '@/contexts/SimpleAdminAuthContext';

const SimpleAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  
  const { login, getOrganizationByEmail, isAuthenticated } = useSimpleAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/simple-admin-portal');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (email && email.includes('@')) {
        const org = await getOrganizationByEmail(email);
        setOrganization(org);
      } else {
        setOrganization(null);
      }
    };

    const timeoutId = setTimeout(fetchOrganization, 500);
    return () => clearTimeout(timeoutId);
  }, [email, getOrganizationByEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Successfully logged in!",
      });
      navigate('/simple-admin-portal');
    } else {
      toast({
        title: "Login Failed",
        description: result.error || "Invalid credentials",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Admin Portal</CardTitle>
          <p className="text-center text-muted-foreground">
            Access your organization's admin dashboard
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {organization && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border">
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">{organization.name}</p>
                  <p className="text-xs text-muted-foreground">{organization.domain}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In to Admin Portal"}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Need an admin account?{' '}
              <button
                onClick={() => navigate('/simple-admin-register')}
                className="text-blue-600 hover:underline"
              >
                Register Organization
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleAdminLogin;