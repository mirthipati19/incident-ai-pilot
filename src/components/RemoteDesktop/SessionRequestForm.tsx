import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { remoteDesktopService } from '@/services/remoteDesktopService';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  name: string;
}

export const SessionRequestForm = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name')
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const requestRemoteSession = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user",
        variant: "destructive",
      });
      return;
    }

    if (!purpose.trim()) {
      toast({
        title: "Error",
        description: "Please provide a purpose for the remote session",
        variant: "destructive",
      });
      return;
    }

    setRequesting(true);

    const { data, error } = await remoteDesktopService.requestRemoteSession(
      selectedUserId,
      purpose
    );

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to request remote session",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Remote session requested. Session code: ${data?.session_code}`,
      });
      
      // Reset form
      setSelectedUserId('');
      setPurpose('');
      setSearchTerm('');
    }

    setRequesting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Request Remote Session
        </CardTitle>
        <CardDescription>
          Request access to a user's desktop for support purposes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Search Users</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetUser">Select User</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a user to connect to" />
            </SelectTrigger>
            <SelectContent>
              {loading ? (
                <SelectItem value="loading" disabled>Loading users...</SelectItem>
              ) : filteredUsers.length === 0 ? (
                <SelectItem value="no-users" disabled>No users found</SelectItem>
              ) : (
                filteredUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose">Purpose</Label>
          <Textarea
            id="purpose"
            placeholder="Describe the reason for this remote session..."
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={requestRemoteSession}
          disabled={requesting || !selectedUserId || !purpose.trim()}
          className="w-full"
        >
          {requesting ? 'Requesting...' : 'Request Remote Access'}
        </Button>
      </CardContent>
    </Card>
  );
};