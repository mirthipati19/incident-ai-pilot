
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Building2, 
  LogOut,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import { newAdminAuthService } from '@/services/newAdminAuthService';

const NewAdminPortal = () => {
  const { adminUser, organization, logout } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: ''
  });
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSignOut = async () => {
    await logout();
    navigate('/admin/login');
    toast({
      title: "Signed out",
      description: "You have been signed out successfully."
    });
  };

  const validateUserEmail = (email: string) => {
    if (!organization?.domain) return false;
    return email.endsWith(`@${organization.domain}`);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserData.name.trim() || !newUserData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    if (!validateUserEmail(newUserData.email)) {
      toast({
        title: "Email Domain Error",
        description: `Email must belong to your organization domain: @${organization?.domain}`,
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await newAdminAuthService.createUserAndSendCredentials({
        email: newUserData.email,
        name: newUserData.name,
        organizationId: organization!.id,
        createdBy: adminUser!.id
      });

      setGeneratedCredentials({
        email: result.user.email,
        password: result.tempPassword
      });

      toast({
        title: "User Created Successfully",
        description: `User ${result.user.name} has been created. Please share the credentials securely.`
      });

      // Reset form
      setNewUserData({ name: '', email: '' });
      setShowCreateUserForm(false);
    } catch (error: any) {
      toast({
        title: "User Creation Failed",
        description: error.message || "Failed to create user. Please try again.",
        variant: "destructive"
      });
    }
  };

  const copyCredentials = () => {
    if (generatedCredentials) {
      const credentialsText = `Login Credentials for ${generatedCredentials.email}:\n\nEmail: ${generatedCredentials.email}\nPassword: ${generatedCredentials.password}\n\nPlease change your password after first login.`;
      navigator.clipboard.writeText(credentialsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to Clipboard",
        description: "User credentials have been copied to clipboard."
      });
    }
  };

  if (!adminUser || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Loading admin portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {organization.logo_url ? (
                <img 
                  src={organization.logo_url} 
                  alt={organization.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-white/20"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-white">{organization.name}</h1>
                <p className="text-blue-200">Authexa Service Portal Admin - {organization.domain}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{adminUser.name}</p>
                <p className="text-xs text-blue-200">{adminUser.email}</p>
                <Badge variant="secondary" className="mt-1">
                  <Shield className="w-3 h-3 mr-1" />
                  {adminUser.role}
                </Badge>
              </div>
              <Button 
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button 
                onClick={() => setShowCreateUserForm(true)}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create New User
              </Button>

              {showCreateUserForm && (
                <form onSubmit={handleCreateUser} className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="space-y-2">
                    <Label htmlFor="userName" className="text-white">Full Name</Label>
                    <Input
                      id="userName"
                      type="text"
                      placeholder="Enter user's full name"
                      value={newUserData.name}
                      onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="userEmail" className="text-white">Email Address</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      placeholder={`user@${organization.domain}`}
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                    <p className="text-xs text-blue-300">
                      Must use your organization domain: @{organization.domain}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                      Create User
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => setShowCreateUserForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Generated Credentials */}
          {generatedCredentials && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Generated User Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-200 mb-3">⚠️ Share these credentials securely</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-300">Email</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={generatedCredentials.email}
                          readOnly
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-gray-300">Temporary Password</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="relative flex-1">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={generatedCredentials.password}
                            readOnly
                            className="bg-white/5 border-white/10 text-white pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={copyCredentials}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Copy Credentials"}
                  </Button>
                </div>

                <Button 
                  onClick={() => setGeneratedCredentials(null)}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  Clear Credentials
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Organization Info */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-300">Organization Name</Label>
                <p className="text-white font-medium">{organization.name}</p>
              </div>
              
              <div>
                <Label className="text-sm text-gray-300">Domain</Label>
                <p className="text-white font-medium">{organization.domain}</p>
              </div>
              
              <div>
                <Label className="text-sm text-gray-300">Status</Label>
                <Badge variant={organization.is_active ? "default" : "destructive"} className="ml-2">
                  {organization.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div>
                <Label className="text-sm text-gray-300">Created</Label>
                <p className="text-white font-medium">
                  {new Date(organization.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewAdminPortal;
