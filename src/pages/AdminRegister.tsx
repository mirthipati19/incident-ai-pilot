
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Building2, Globe, Shield, Upload, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 12) errors.push('Password must be at least 12 characters long');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least 1 uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain at least 1 lowercase letter');
    if ((password.match(/\d/g) || []).length < 4) errors.push('Password must contain at least 4 numbers');
    if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain at least 1 special character');
    
    setPasswordValidation(errors);
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    if (password) {
      validatePassword(password);
    } else {
      setPasswordValidation([]);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'File Too Large',
          description: 'Logo file must be less than 5MB.',
          variant: 'destructive',
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload an image file.',
          variant: 'destructive',
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (organizationId: string) => {
    if (!logoFile) return null;

    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${organizationId}-logo.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('companylogos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Logo upload error:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('companylogos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
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
    console.log('🔐 Signing up admin user first...');

    // 1️⃣ Sign up the admin user (auth record only, triggers email confirmation)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.adminName,
          role: 'admin',
        },
        emailRedirectTo: `${window.location.origin}/admin/login`,
      },
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create admin user: ${authError?.message}`);
    }

    const adminUserId = authData.user.id;

    console.log('✅ Admin user created:', adminUserId);

    // 2️⃣ Now create the organization as this user (authenticated)
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: formData.organizationName,
        domain: formData.domain,
        created_by: adminUserId,
      })
      .select()
      .single();

    if (orgError) {
      // Cleanup auth user if org creation fails
      await supabase.auth.admin.deleteUser(adminUserId);
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    console.log('🏢 Organization created:', orgData);

    // 3️⃣ Upload logo if present
    let logoUrl = null;
    if (logoFile) {
      logoUrl = await uploadLogo(orgData.id);
      if (logoUrl) {
        await supabase
          .from('organizations')
          .update({ logo_url: logoUrl })
          .eq('id', orgData.id);
      }
    }

    // 4️⃣ Add record in admin_users table
    await supabase.from('admin_users').insert({
      user_id: adminUserId,
      role: 'admin',
      organization_id: orgData.id,
      permissions: ['view_tickets', 'manage_users', 'view_stats', 'full_admin'],
    });

    toast({
      title: 'Registration Successful!',
      description: `Your organization "${formData.organizationName}" and admin account have been created. Please check your email to verify your account.`,
    });

    navigate('/admin/login?registered=true');
  } catch (error: any) {
    console.error('🔥 Registration error:', error);
    toast({
      title: 'Registration Failed',
      description: error.message || 'Something went wrong.',
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
              {/* Organization Logo */}
              <div className="space-y-4">
                <Label className="text-white font-medium">Organization Logo (Optional)</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="bg-white/10 border-white/20 text-white file:bg-blue-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1"
                    />
                    <p className="text-xs text-blue-200 mt-1">Max 5MB, PNG/JPG/JPEG</p>
                  </div>
                </div>
              </div>

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
