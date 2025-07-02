
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Building2, Globe, Shield } from 'lucide-react';
import { newAdminAuthService } from '@/services/newAdminAuthService';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    organizationName: '',
    domain: '',
    adminName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<string[]>([]);

  const { toast } = useToast();
  const navigate = useNavigate();

  const validatePassword = async (password: string) => {
    const validation = await newAdminAuthService.validatePasswordStrength(password);
    if (!validation.valid && validation.message) {
      setPasswordValidation([validation.message]);
    } else {
      setPasswordValidation([]);
    }
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    if (password) {
      validatePassword(password);
    } else {
      setPasswordValidation([]);
    }
  };

  const validateForm = () => {
    if (!formData.organizationName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Organization name is required.',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.domain.trim() || !formData.domain.includes('.')) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid domain (e.g., company.com).',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.adminName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Admin name is required.',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.email.endsWith(`@${formData.domain}`)) {
      toast({
        title: 'Validation Error',
        description: 'Admin email must belong to the organization domain.',
        variant: 'destructive',
      });
      return false;
    }

    if (passwordValidation.length > 0) {
      toast({
        title: 'Password Policy Violation',
        description: passwordValidation[0],
        variant: 'destructive',
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Create organization
      const organization = await newAdminAuthService.createOrganization(
        formData.organizationName,
        formData.domain
      );

      // Register admin user
      await newAdminAuthService.registerAdminUser({
        email: formData.email,
        password: formData.password,
        name: formData.adminName,
        organizationId: organization.id
      });

      toast({
        title: 'Registration Successful!',
        description: 'Your organization and admin account have been created. You can now sign in.',
      });

      navigate('/admin/login');
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to create organization. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative z-10 w-full max-w-2xl">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Register Organization</h1>
                <p className="text-sm text-blue-200">Authexa ITSM Admin</p>
              </div>
            </div>
            
            <CardTitle className="text-xl font-bold text-white">Create Your Organization</CardTitle>
            <CardDescription className="text-blue-200">
              Set up your organization and admin account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organization Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationName" className="text-white font-medium">Organization Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="organizationName"
                      type="text"
                      placeholder="Your Company Name"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain" className="text-white font-medium">Organization Domain</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="domain"
                      type="text"
                      placeholder="company.com"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Admin User Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName" className="text-white font-medium">Admin Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="adminName"
                      type="text"
                      placeholder="Your full name"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 12 chars, 4 numbers, 1 special"
                      value={formData.password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
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
                  {passwordValidation.length > 0 && (
                    <p className="text-sm text-red-400">{passwordValidation[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 pr-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Policy Info */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-200 mb-2">Password Requirements:</h4>
                <ul className="text-xs text-blue-300 space-y-1">
                  <li>• Minimum 12 characters</li>
                  <li>• At least 1 uppercase letter</li>
                  <li>• At least 1 lowercase letter</li>
                  <li>• At least 4 numbers</li>
                  <li>• At least 1 special character</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg h-12"
                disabled={isLoading}
              >
                {isLoading ? "Creating Organization..." : "Create Organization & Admin Account"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <div className="text-sm text-blue-200">
                Already have an admin account?{" "}
                <Link to="/admin/login" className="text-white hover:text-blue-200 font-medium hover:underline">
                  Sign In Here
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminRegister;
