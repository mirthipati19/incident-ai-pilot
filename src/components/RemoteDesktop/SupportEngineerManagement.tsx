import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Shield, ShieldCheck, ShieldX } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { remoteDesktopService, SupportEngineer } from '@/services/remoteDesktopService';
import { supabase } from '@/integrations/supabase/client';

export const SupportEngineerManagement = () => {
  const { toast } = useToast();
  const [supportEngineers, setSupportEngineers] = useState<SupportEngineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingUser, setAddingUser] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<SupportEngineer['role']>('support_engineer');

  useEffect(() => {
    loadSupportEngineers();
  }, []);

  const loadSupportEngineers = async () => {
    setLoading(true);
    const { data, error } = await remoteDesktopService.getSupportEngineers();
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load support engineers",
        variant: "destructive",
      });
    } else {
      setSupportEngineers(data || []);
    }
    setLoading(false);
  };

  const addSupportEngineer = async () => {
    if (!userEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user email",
        variant: "destructive",
      });
      return;
    }

    setAddingUser(true);

    try {
      // First, find the user by email
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail.trim())
        .single();

      if (userError || !users) {
        toast({
          title: "Error",
          description: "User not found with this email",
          variant: "destructive",
        });
        setAddingUser(false);
        return;
      }

      // Add as support engineer
      const { data, error } = await remoteDesktopService.addSupportEngineer(users.id, selectedRole);

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to add support engineer",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Support engineer added successfully",
        });
        setUserEmail('');
        loadSupportEngineers();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }

    setAddingUser(false);
  };

  const removeSupportEngineer = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${userEmail} as a support engineer?`)) {
      return;
    }

    const { error } = await remoteDesktopService.removeSupportEngineer(userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove support engineer",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Support engineer removed successfully",
      });
      loadSupportEngineers();
    }
  };

  const toggleEngineerStatus = async (engineer: SupportEngineer) => {
    const { error } = await remoteDesktopService.updateSupportEngineer(engineer.id, {
      is_active: !engineer.is_active
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update support engineer status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Support engineer ${engineer.is_active ? 'deactivated' : 'activated'}`,
      });
      loadSupportEngineers();
    }
  };

  const getRoleIcon = (role: SupportEngineer['role']) => {
    switch (role) {
      case 'admin_support':
        return <ShieldCheck className="w-4 h-4" />;
      case 'senior_support':
        return <Shield className="w-4 h-4" />;
      default:
        return <ShieldX className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: SupportEngineer['role']) => {
    switch (role) {
      case 'admin_support':
        return 'destructive';
      case 'senior_support':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading support engineers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Support Engineer
          </CardTitle>
          <CardDescription>
            Add users to the support engineer role for remote desktop access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="userEmail">User Email</Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="user@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={(value: SupportEngineer['role']) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support_engineer">Support Engineer</SelectItem>
                  <SelectItem value="senior_support">Senior Support</SelectItem>
                  <SelectItem value="admin_support">Admin Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={addSupportEngineer} 
                disabled={addingUser}
                className="w-full"
              >
                {addingUser ? 'Adding...' : 'Add Engineer'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support Engineers</CardTitle>
          <CardDescription>
            Manage users with remote desktop access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {supportEngineers.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              No support engineers found. Add one above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {supportEngineers.map((engineer) => (
                <div
                  key={engineer.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getRoleIcon(engineer.role)}
                    <div>
                      <div className="font-medium">User ID: {engineer.user_id}</div>
                      <div className="text-sm text-muted-foreground">
                        Added: {new Date(engineer.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(engineer.role)}>
                      {engineer.role.replace('_', ' ')}
                    </Badge>
                    
                    <Badge variant={engineer.is_active ? "default" : "secondary"}>
                      {engineer.is_active ? 'Active' : 'Inactive'}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleEngineerStatus(engineer)}
                    >
                      {engineer.is_active ? 'Deactivate' : 'Activate'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSupportEngineer(engineer.user_id, engineer.user_id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};