
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PromptAnimator from '@/components/Assistant/PromptAnimator';
import CallSupport from '@/components/Assistant/CallSupport';
import ChatSupport from '@/components/Assistant/ChatSupport';
import ConnectPermissionPrompt from '@/components/Assistant/ConnectPermissionPrompt';
import IncidentList from '@/components/Incidents/IncidentList';
import IncidentDetails from '@/components/Incidents/IncidentDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeadphonesIcon, List, CheckCircle, XCircle, Clock, MessageCircle, Phone, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { incidentService, type Incident } from '@/services/incidentService';
import { useToast } from '@/hooks/use-toast';

const ITSMPage = () => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState("Welcome to Mouritech Support! How can I assist you today?");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    resolvedToday: 0,
    critical: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load user incidents and stats
  useEffect(() => {
    if (user?.id) {
      loadIncidents();
      loadStats();
    }
  }, [user?.id]);

  const loadIncidents = async () => {
    if (!user?.id) return;
    
    try {
      const userIncidents = await incidentService.getUserIncidents(user.id);
      setIncidents(userIncidents);
    } catch (error) {
      console.error('Failed to load incidents:', error);
      toast({
        title: "Error",
        description: "Failed to load incidents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;
    
    try {
      const userStats = await incidentService.getIncidentStats(user.id);
      setStats(userStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const createIncidentFromInput = async (text: string, source: 'call' | 'chat') => {
    if (!user?.id) return null;

    const lowerText = text.toLowerCase();
    
    // Determine priority and category based on keywords
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let category = 'other';
    
    if (lowerText.includes('urgent') || lowerText.includes('critical') || lowerText.includes('down')) {
      priority = 'critical';
    } else if (lowerText.includes('important') || lowerText.includes('asap')) {
      priority = 'high';
    }
    
    if (lowerText.includes('software') || lowerText.includes('install') || lowerText.includes('application')) {
      category = 'software';
    } else if (lowerText.includes('network') || lowerText.includes('internet') || lowerText.includes('connection')) {
      category = 'network';
    } else if (lowerText.includes('hardware') || lowerText.includes('computer') || lowerText.includes('laptop')) {
      category = 'hardware';
    } else if (lowerText.includes('password') || lowerText.includes('login') || lowerText.includes('access')) {
      category = 'access';
    }

    const newIncidentData = {
      title: `${source === 'call' ? 'Voice' : 'Chat'} Support Request - ${text.slice(0, 50)}${text.length > 50 ? '...' : ''}`,
      description: text,
      status: 'Open' as const,
      priority,
      category,
      user_id: user.id,
      assignee: null
    };

    try {
      const newIncident = await incidentService.createIncident(newIncidentData);
      setIncidents(prev => [newIncident, ...prev]);
      loadStats(); // Refresh stats
      return newIncident;
    } catch (error) {
      console.error('Failed to create incident:', error);
      toast({
        title: "Error",
        description: "Failed to create incident",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleCallResult = async (text: string) => {
    console.log('Call input received:', text);
    
    // Check if this looks like a problem description
    const problemKeywords = ['problem', 'issue', 'error', 'not working', 'broken', 'help', 'trouble', 'cant', "can't", 'unable', 'need'];
    const containsProblemKeyword = problemKeywords.some(keyword => text.toLowerCase().includes(keyword));
    
    if (containsProblemKeyword && text.length > 10) {
      const incident = await createIncidentFromInput(text, 'call');
      if (incident) {
        setCurrentPrompt(`I've created incident #${incident.id.slice(0, 8)} for your issue. Let me help you resolve: "${text}"`);
      }
    } else if (text.toLowerCase().includes('install') || text.toLowerCase().includes('software')) {
      setCurrentPrompt('I can help you install software. Would you like me to connect to your device?');
      setShowConnectPrompt(true);
    } else if (text.toLowerCase().includes('status') || text.toLowerCase().includes('check')) {
      setCurrentPrompt('Let me show you the current incident status dashboard.');
    } else {
      setCurrentPrompt('I can help you with incident management, software installation, status checks, or creating new tickets. Please describe your issue.');
    }
  };

  const handleChatMessage = async (message: string) => {
    console.log('Chat message sent:', message);
    
    // Check if this looks like a problem description
    const problemKeywords = ['problem', 'issue', 'error', 'not working', 'broken', 'help', 'trouble', 'cant', "can't", 'unable', 'need'];
    const containsProblemKeyword = problemKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    if (containsProblemKeyword && message.length > 10) {
      const incident = await createIncidentFromInput(message, 'chat');
      if (incident) {
        setCurrentPrompt(`I've automatically created incident #${incident.id.slice(0, 8)} for your issue. I'm working on a solution for: "${message}"`);
      }
    } else {
      setCurrentPrompt(`Chat: "${message}". How else can I help you?`);
    }
  };

  const handleIncidentSelect = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  const handleStatusUpdate = async (incidentId: string, newStatus: string) => {
    try {
      await incidentService.updateIncidentStatus(incidentId, newStatus);
      
      // Update local state
      setIncidents(prev => 
        prev.map(incident => 
          incident.id === incidentId 
            ? { ...incident, status: newStatus as any, updated_at: new Date().toISOString() }
            : incident
        )
      );
      setSelectedIncident(prev => 
        prev ? { ...prev, status: newStatus as any, updated_at: new Date().toISOString() } : null
      );
      
      // Refresh stats
      loadStats();
      
      toast({
        title: "Success",
        description: "Incident status updated successfully",
      });
    } catch (error) {
      console.error('Failed to update incident status:', error);
      toast({
        title: "Error",
        description: "Failed to update incident status",
        variant: "destructive"
      });
    }
  };

  // Statistics with real user data
  const statCards = [
    { label: 'Open Incidents', value: stats.open, icon: XCircle, color: 'text-red-600' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-yellow-600' },
    { label: 'Resolved Today', value: stats.resolvedToday, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Critical Priority', value: stats.critical, icon: AlertTriangle, color: 'text-orange-600' }
  ];

  return (
    <div 
      className="min-h-screen relative p-4"
      style={{
        backgroundImage: `url('/lovable-uploads/50b753fc-5735-49ae-ad55-1cc4efdd1bc3.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3 drop-shadow-lg">
            <HeadphonesIcon className="w-10 h-10 text-blue-300" />
            Mouritech Support
          </h1>
          <p className="text-lg text-white/90 drop-shadow-md">
            AI-powered IT Service Management with voice, automation and smart device integration
          </p>
          {user?.name && (
            <p className="text-md text-white/80 drop-shadow-md">
              Welcome back, {user.name}! (ID: {user.user_id})
            </p>
          )}
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color.replace('text-', 'text-').replace('-600', '-300')}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Assistant Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Call Support */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-center text-white flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                Call Support
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <PromptAnimator text={currentPrompt} />
              <CallSupport onCallResult={handleCallResult} />
            </CardContent>
          </Card>

          {/* Chat Support */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-center text-white flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat Support
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ChatSupport onMessageSent={handleChatMessage} />
            </CardContent>
          </Card>

          {/* Device Connection */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-center text-white flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                Smart Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showConnectPrompt ? (
                <ConnectPermissionPrompt onApproval={() => setShowConnectPrompt(false)} />
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-white/60" />
                  <p className="text-white/80 text-sm">Ready to connect when needed</p>
                  <button 
                    onClick={() => setShowConnectPrompt(true)}
                    className="mt-3 bg-blue-600/80 hover:bg-blue-700/80 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Request Connection
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Only Incidents Tab */}
        <Tabs defaultValue="incidents" className="w-full">
          <TabsList className="grid w-full grid-cols-1 bg-white/10 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="incidents" className="flex items-center gap-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <List className="w-4 h-4" />
              My Incidents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incidents" className="mt-6">
            <IncidentList 
              incidents={incidents}
              onIncidentSelect={handleIncidentSelect}
            />
          </TabsContent>
        </Tabs>

        {/* Incident Details Modal */}
        {selectedIncident && (
          <IncidentDetails
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default ITSMPage;
