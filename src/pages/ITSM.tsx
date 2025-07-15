import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageCircle, Plus, Ticket, Search, Filter, Clock, User, AlertCircle, Mic } from 'lucide-react';
import CreateIncidentForm from '@/components/Incidents/CreateIncidentForm';
import IncidentList from '@/components/Incidents/IncidentList';
import CallSupport from '@/components/Assistant/CallSupport';
import ChatSupport from '@/components/Assistant/ChatSupport';
import VoiceControllerInstaller from '@/components/VoiceController/VoiceControllerInstaller';
import { incidentService } from '@/services/incidentService';
import { useToast } from '@/hooks/use-toast';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import ImprovedChatSupport from '@/components/Assistant/ImprovedChatSupport';

const ITSM = () => {
  const { user } = useImprovedAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('incidents');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCallSupport, setShowCallSupport] = useState(false);
  const [showChatSupport, setShowChatSupport] = useState(false);
  const [showVoiceInstaller, setShowVoiceInstaller] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      loadIncidents();
    }
  }, [user]);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const data = await incidentService.getUserIncidents(user?.id);
      setIncidents(data);
    } catch (error: any) {
      console.error('Failed to load incidents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load incidents.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (incidentData: any) => {
    try {
      await incidentService.createIncident({
        ...incidentData,
        user_id: user?.id
      });
      toast({
        title: 'Success',
        description: 'Incident created successfully.',
      });
      setShowCreateForm(false);
      loadIncidents();
    } catch (error: any) {
      console.error('Failed to create incident:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create incident.',
        variant: 'destructive',
      });
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    const counts = {
      all: incidents.length,
      open: incidents.filter(i => i.status === 'Open').length,
      'in progress': incidents.filter(i => i.status === 'In Progress').length,
      resolved: incidents.filter(i => i.status === 'Resolved').length,
      closed: incidents.filter(i => i.status === 'Closed').length
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (showCreateForm) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NEgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <CreateIncidentForm
          onSubmit={handleCreateIncident}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NEgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Self Service Portal</h1>
          <p className="text-blue-200">Get quick help through our AI assistant or manage your support tickets.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => setShowCallSupport(true)}>
            <CardContent className="p-6 text-center">
              <Phone className="h-12 w-12 mx-auto mb-4 text-blue-400" />
              <h3 className="font-semibold mb-2">Call Support</h3>
              <p className="text-sm text-blue-200">Get instant voice assistance</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => setShowChatSupport(true)}>
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <h3 className="font-semibold mb-2">Chat Support</h3>
              <p className="text-sm text-blue-200">Chat with our AI assistant</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => setShowVoiceInstaller(true)}>
            <CardContent className="p-6 text-center">
              <Mic className="h-12 w-12 mx-auto mb-4 text-purple-400" />
              <h3 className="font-semibold mb-2">Voice Controller</h3>
              <p className="text-sm text-blue-200">Install voice control software</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => setShowCreateForm(true)}>
            <CardContent className="p-6 text-center">
              <Plus className="h-12 w-12 mx-auto mb-4 text-orange-400" />
              <h3 className="font-semibold mb-2">Create Ticket</h3>
              <p className="text-sm text-blue-200">Submit a new support request</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <Ticket className="h-12 w-12 mx-auto mb-4 text-pink-400" />
              <h3 className="font-semibold mb-2">My Tickets</h3>
              <p className="text-sm text-blue-200">{statusCounts.all} total tickets</p>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Management */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                My Support Tickets
              </CardTitle>
              <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
              >
                <option value="all" className="bg-gray-800">All Status ({statusCounts.all})</option>
                <option value="open" className="bg-gray-800">Open ({statusCounts.open})</option>
                <option value="in progress" className="bg-gray-800">In Progress ({statusCounts['in progress']})</option>
                <option value="resolved" className="bg-gray-800">Resolved ({statusCounts.resolved})</option>
                <option value="closed" className="bg-gray-800">Closed ({statusCounts.closed})</option>
              </select>
            </div>

            {/* Tickets List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white mt-4">Loading tickets...</p>
              </div>
            ) : (
              <IncidentList 
                incidents={filteredIncidents} 
                onIncidentUpdate={loadIncidents}
              />
            )}
          </CardContent>
        </Card>

        {/* Support Modals */}
        {showCallSupport && (
          <CallSupport onClose={() => setShowCallSupport(false)} />
        )}

        <ImprovedChatSupport 
          isOpen={showChatSupport} 
          onClose={() => setShowChatSupport(false)} 
        />

        {showVoiceInstaller && (
          <VoiceControllerInstaller onClose={() => setShowVoiceInstaller(false)} />
        )}
      </div>
    </div>
  );
};

export default ITSM;
