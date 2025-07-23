import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  History, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  MoreVertical,
  Download,
  Trash2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VisionSession {
  id: string;
  title: string;
  status: string;
  intent_description: string;
  current_step: number;
  total_steps: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export const SessionHistory = () => {
  const [sessions, setSessions] = useState<VisionSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<VisionSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const { toast } = useToast();

  useEffect(() => {
    loadSessionHistory();
  }, []);

  useEffect(() => {
    filterAndSortSessions();
  }, [sessions, searchQuery, statusFilter, sortBy]);

  const loadSessionHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('vision_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading session history:', error);
      toast({
        title: "Error",
        description: "Failed to load session history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSessions = () => {
    let filtered = sessions;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.intent_description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredSessions(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'active':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'paused':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-blue-50 text-blue-700 border-blue-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
      paused: 'bg-yellow-50 text-yellow-700 border-yellow-200'
    };

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants] || 'bg-gray-50 text-gray-700 border-gray-200'}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const exportSession = async (sessionId: string) => {
    try {
      // Get session details, steps, and messages
      const [sessionRes, stepsRes, messagesRes] = await Promise.all([
        supabase.from('vision_sessions').select('*').eq('id', sessionId).single(),
        supabase.from('vision_session_steps').select('*').eq('session_id', sessionId).order('step_number'),
        supabase.from('vision_chat_messages').select('*').eq('session_id', sessionId).order('created_at')
      ]);

      if (sessionRes.error || stepsRes.error || messagesRes.error) {
        throw new Error('Failed to fetch session data');
      }

      const exportData = {
        session: sessionRes.data,
        steps: stepsRes.data,
        messages: messagesRes.data,
        exportedAt: new Date().toISOString()
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vision-session-${sessionId}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Session data has been downloaded",
      });
    } catch (error) {
      console.error('Error exporting session:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export session data",
        variant: "destructive",
      });
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vision_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast({
        title: "Session Deleted",
        description: "The session has been permanently deleted",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the session",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold flex items-center space-x-2">
            <History className="w-6 h-6 text-blue-600" />
            <span>Session History</span>
          </h2>
          <Badge variant="outline">
            {sessions.length} Total Sessions
          </Badge>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="title">By Title</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <Card className="p-8">
            <div className="text-center space-y-3">
              <History className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                No Sessions Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Start your first VisionAssist session to see it here'
                }
              </p>
            </div>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <Card key={session.id} className="p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium">{session.title}</h3>
                    {getStatusBadge(session.status)}
                  </div>
                  
                  {session.intent_description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {session.intent_description}
                    </p>
                  )}

                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      Progress: {session.current_step}/{session.total_steps} steps
                    </span>
                    <span>
                      Duration: {formatDuration(session.created_at, session.completed_at || session.updated_at)}
                    </span>
                    <span>
                      Started: {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportSession(session.id)}
                    className="flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSession(session.id)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};