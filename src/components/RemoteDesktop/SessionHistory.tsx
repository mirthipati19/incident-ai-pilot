import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Search, Eye, Calendar, Clock, Monitor } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { remoteDesktopService, RemoteSession } from '@/services/remoteDesktopService';

export const SessionHistory = () => {
  const { toast } = useToast();
  const { user } = useImprovedAuth();
  const [sessions, setSessions] = useState<RemoteSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<RemoteSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user?.id) {
      loadSessions();
    }
  }, [user?.id]);

  useEffect(() => {
    filterSessions();
  }, [sessions, searchTerm, statusFilter]);

  const loadSessions = async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await remoteDesktopService.getSessionsByUser(user.id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load session history",
        variant: "destructive",
      });
    } else {
      setSessions(data || []);
    }
    setLoading(false);
  };

  const filterSessions = () => {
    let filtered = sessions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.session_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    setFilteredSessions(filtered);
  };

  const getStatusBadgeVariant = (status: RemoteSession['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'active':
        return 'secondary';
      case 'approved':
        return 'outline';
      case 'pending':
        return 'secondary';
      case 'denied':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: RemoteSession['status']) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'active':
        return '🟢';
      case 'approved':
        return '👍';
      case 'pending':
        return '⏳';
      case 'denied':
        return '❌';
      case 'cancelled':
        return '🚫';
      default:
        return '❓';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading session history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Session History
          </CardTitle>
          <CardDescription>
            View all remote desktop sessions you've participated in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sessions found.</p>
              {searchTerm || statusFilter !== 'all' ? (
                <p className="text-sm">Try adjusting your search or filter criteria.</p>
              ) : (
                <p className="text-sm">Session history will appear here once you participate in remote sessions.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">
                            {session.session_code}
                          </span>
                          <Badge variant={getStatusBadgeVariant(session.status)}>
                            {getStatusIcon(session.status)} {session.status}
                          </Badge>
                        </div>
                        
                        {session.purpose && (
                          <p className="text-sm text-muted-foreground">
                            {session.purpose}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(session.requested_at).toLocaleDateString()}
                          </div>
                          {session.duration_minutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(session.duration_minutes)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xs text-muted-foreground">
                          {new Date(session.requested_at).toLocaleTimeString()}
                        </div>
                        {session.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>

                    {session.notes && (
                      <div className="mt-3 p-2 bg-muted rounded text-sm">
                        <strong>Notes:</strong> {session.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};