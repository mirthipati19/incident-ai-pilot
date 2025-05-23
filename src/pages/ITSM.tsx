
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PromptAnimator from '@/components/Assistant/PromptAnimator';
import VoiceAssistant from '@/components/Assistant/VoiceAssistant';
import ChatSupport from '@/components/Assistant/ChatSupport';
import CreateIncidentForm from '@/components/Incidents/CreateIncidentForm';
import IncidentList from '@/components/Incidents/IncidentList';
import IncidentDetails from '@/components/Incidents/IncidentDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeadphonesIcon, Plus, List, CheckCircle, XCircle, Clock, MessageCircle } from 'lucide-react';

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
  const [currentPrompt, setCurrentPrompt] = useState("How can I help you today?");
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const handleVoiceResult = (text: string) => {
    console.log('Voice input received:', text);
    setCurrentPrompt(`I heard: "${text}". Processing your request...`);
    
    // Simulate processing the voice command
    setTimeout(() => {
      if (text.toLowerCase().includes('incident') || text.toLowerCase().includes('problem')) {
        setCurrentPrompt('I can help you create a new incident. Please fill out the form below.');
      } else if (text.toLowerCase().includes('status') || text.toLowerCase().includes('check')) {
        setCurrentPrompt('Let me show you the current incident status dashboard.');
      } else {
        setCurrentPrompt('I can help you with incident management, status checks, or creating new tickets.');
      }
    }, 2000);
  };

  const handleChatMessage = (message: string) => {
    console.log('Chat message sent:', message);
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

  // Mock statistics
  const stats = [
    { label: 'Open Incidents', value: 12, icon: XCircle, color: 'text-red-600' },
    { label: 'In Progress', value: 8, icon: Clock, color: 'text-yellow-600' },
    { label: 'Resolved Today', value: 15, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Total This Week', value: 47, icon: List, color: 'text-blue-600' }
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
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3 drop-shadow-lg">
            <HeadphonesIcon className="w-10 h-10 text-blue-300" />
            Mouritech Support Dashboard
          </h1>
          <p className="text-lg text-white/90 drop-shadow-md">
            AI-powered IT Service Management with voice and automation
          </p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-white/10 backdrop-blur-sm border border-white/20">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Voice Assistant */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="text-center text-white flex items-center justify-center gap-2">
                <HeadphonesIcon className="w-5 h-5" />
                Voice Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <PromptAnimator text={currentPrompt} />
              <VoiceAssistant onVoiceResult={handleVoiceResult} />
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
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="incidents" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="incidents" className="flex items-center gap-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <List className="w-4 h-4" />
              All Incidents
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <Plus className="w-4 h-4" />
              Create Incident
            </TabsTrigger>
            <TabsTrigger value="my-incidents" className="flex items-center gap-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <CheckCircle className="w-4 h-4" />
              My Incidents
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

          <TabsContent value="my-incidents" className="mt-6">
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white">My Assigned Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-white/70">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-white/40" />
                  <p>No incidents assigned to you at the moment.</p>
                  <p className="text-sm">Great job keeping up with your workload!</p>
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
