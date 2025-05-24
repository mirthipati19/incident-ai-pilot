
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PromptAnimator from '@/components/Assistant/PromptAnimator';
import CallSupport from '@/components/Assistant/CallSupport';
import ChatSupport from '@/components/Assistant/ChatSupport';
import ConnectPermissionPrompt from '@/components/Assistant/ConnectPermissionPrompt';
import CreateIncidentForm from '@/components/Incidents/CreateIncidentForm';
import IncidentList from '@/components/Incidents/IncidentList';
import IncidentDetails from '@/components/Incidents/IncidentDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeadphonesIcon, Plus, List, CheckCircle, XCircle, Clock, MessageCircle, Phone, Shield, Settings, Users, AlertTriangle } from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
}

const ITSMPage = () => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState("Welcome to Mouritech Support! How can I assist you today?");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);

  const handleCallResult = (text: string) => {
    console.log('Call input received:', text);
    setCurrentPrompt(`Call transcript: "${text}". Processing your request...`);
    
    // Simulate processing the call command
    setTimeout(() => {
      if (text.toLowerCase().includes('incident') || text.toLowerCase().includes('problem') || text.toLowerCase().includes('issue')) {
        setCurrentPrompt('I can help you create a new incident. Please fill out the form or continue describing the issue.');
      } else if (text.toLowerCase().includes('install') || text.toLowerCase().includes('software')) {
        setCurrentPrompt('I can help you install software. Would you like me to connect to your device?');
        setShowConnectPrompt(true);
      } else if (text.toLowerCase().includes('status') || text.toLowerCase().includes('check')) {
        setCurrentPrompt('Let me show you the current incident status dashboard.');
      } else {
        setCurrentPrompt('I can help you with incident management, software installation, status checks, or creating new tickets.');
      }
    }, 2000);
  };

  const handleChatMessage = (message: string) => {
    console.log('Chat message sent:', message);
    setCurrentPrompt(`Chat: "${message}". How else can I help you?`);
  };

  const handleIncidentCreated = (incidentData: any) => {
    const newIncident: Incident = {
      ...incidentData,
      id: Date.now().toString(),
      status: 'Open' as const,
      createdAt: new Date().toISOString()
    };
    setIncidents(prev => [newIncident, ...prev]);
    setCurrentPrompt('Great! Your incident has been created and assigned to the appropriate team.');
  };

  const handleIncidentSelect = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  const handleStatusUpdate = (incidentId: string, newStatus: string) => {
    setIncidents(prev => 
      prev.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: newStatus as any, updatedAt: new Date().toISOString() }
          : incident
      )
    );
    setSelectedIncident(prev => 
      prev ? { ...prev, status: newStatus as any, updatedAt: new Date().toISOString() } : null
    );
  };

  // Enhanced statistics with ServiceNow-style metrics
  const stats = [
    { label: 'Open Incidents', value: incidents.filter(i => i.status === 'Open').length || 12, icon: XCircle, color: 'text-red-600' },
    { label: 'In Progress', value: incidents.filter(i => i.status === 'In Progress').length || 8, icon: Clock, color: 'text-yellow-600' },
    { label: 'Resolved Today', value: incidents.filter(i => i.status === 'Resolved').length || 15, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Critical Priority', value: incidents.filter(i => i.priority === 'critical').length || 3, icon: AlertTriangle, color: 'text-orange-600' }
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
            Mouritech ServiceNow Support
          </h1>
          <p className="text-lg text-white/90 drop-shadow-md">
            AI-powered IT Service Management with voice, automation and smart device integration
          </p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
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

        {/* Main Content Tabs */}
        <Tabs defaultValue="incidents" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="incidents" className="flex items-center gap-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <List className="w-4 h-4" />
              Incidents
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <Plus className="w-4 h-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="my-work" className="flex items-center gap-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <Users className="w-4 h-4" />
              My Work
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <Settings className="w-4 h-4" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incidents" className="mt-6">
            <IncidentList 
              incidents={incidents}
              onIncidentSelect={handleIncidentSelect}
            />
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <div className="flex justify-center">
              <CreateIncidentForm onIncidentCreated={handleIncidentCreated} />
            </div>
          </TabsContent>

          <TabsContent value="my-work" className="mt-6">
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white">My Assigned Work</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-600/20 rounded-lg border border-blue-500/30">
                      <h4 className="text-white font-medium mb-2">Active Tickets</h4>
                      <p className="text-2xl font-bold text-blue-300">5</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
                      <h4 className="text-white font-medium mb-2">Pending Review</h4>
                      <p className="text-2xl font-bold text-yellow-300">2</p>
                    </div>
                    <div className="text-center p-4 bg-green-600/20 rounded-lg border border-green-500/30">
                      <h4 className="text-white font-medium mb-2">Completed Today</h4>
                      <p className="text-2xl font-bold text-green-300">8</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="mt-6">
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white">System Administration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-white font-medium">System Health</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-green-600/20 rounded-lg">
                        <span className="text-white">Database</span>
                        <Badge className="bg-green-600 text-white">Healthy</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-600/20 rounded-lg">
                        <span className="text-white">API Services</span>
                        <Badge className="bg-green-600 text-white">Online</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-600/20 rounded-lg">
                        <span className="text-white">Smart Agent</span>
                        <Badge className="bg-yellow-600 text-white">Standby</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-white font-medium">Quick Actions</h4>
                    <div className="space-y-2">
                      <button className="w-full p-3 bg-blue-600/30 hover:bg-blue-600/50 text-white rounded-lg text-left transition-colors">
                        Bulk Import Users
                      </button>
                      <button className="w-full p-3 bg-purple-600/30 hover:bg-purple-600/50 text-white rounded-lg text-left transition-colors">
                        Generate Reports
                      </button>
                      <button className="w-full p-3 bg-orange-600/30 hover:bg-orange-600/50 text-white rounded-lg text-left transition-colors">
                        System Maintenance
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
