import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Users, Settings, History, Shield } from 'lucide-react';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { remoteDesktopService } from '@/services/remoteDesktopService';
import { SupportEngineerManagement } from '@/components/RemoteDesktop/SupportEngineerManagement';
import { SessionRequestForm } from '@/components/RemoteDesktop/SessionRequestForm';
import { SessionApproval } from '@/components/RemoteDesktop/SessionApproval';
import { SessionHistory } from '@/components/RemoteDesktop/SessionHistory';

const RemoteDesktop = () => {
  const { user } = useImprovedAuth();
  const [isSupportEngineer, setIsSupportEngineer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserPermissions();
  }, [user]);

  const checkUserPermissions = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Check if user is support engineer
    const supportCheck = await remoteDesktopService.checkIsSupportEngineer(user.id);
    setIsSupportEngineer(supportCheck);

    // Check if user is admin (you can modify this logic based on your admin check)
    setIsAdmin(user.isAdmin || false);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p>Please sign in to access the Remote Desktop features.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Monitor className="w-8 h-8" />
            Remote Desktop
          </h1>
          <p className="text-muted-foreground mt-1">
            Secure remote desktop access and session management
          </p>
        </div>
        
        <div className="flex gap-2">
          {isSupportEngineer && (
            <Badge variant="default" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Support Engineer
            </Badge>
          )}
          {isAdmin && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              Administrator
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Sessions
          </TabsTrigger>
          {isSupportEngineer && (
            <TabsTrigger value="request" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Request Access
            </TabsTrigger>
          )}
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Management
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="sessions" className="space-y-6">
          <SessionApproval />
        </TabsContent>

        {isSupportEngineer && (
          <TabsContent value="request" className="space-y-6">
            <SessionRequestForm />
          </TabsContent>
        )}

        <TabsContent value="history" className="space-y-6">
          <SessionHistory />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="management" className="space-y-6">
            <SupportEngineerManagement />
          </TabsContent>
        )}
      </Tabs>

      {!isSupportEngineer && !isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Limited Access</CardTitle>
            <CardDescription>
              You can only view and approve incoming remote session requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              To request remote sessions or manage support engineers, you need to be added 
              as a support engineer by an administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RemoteDesktop;