
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PromptAnimator from '@/components/Assistant/PromptAnimator';
import VoiceAssistant from '@/components/Assistant/VoiceAssistant';
import CreateIncidentForm from '@/components/Incidents/CreateIncidentForm';
import IncidentList from '@/components/Incidents/IncidentList';
import IncidentDetails from '@/components/Incidents/IncidentDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeadphonesIcon, Plus, List, CheckCircle, XCircle, Clock } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <HeadphonesIcon className="w-10 h-10 text-blue-600" />
            Smart Support Assistant
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered IT Service Management with voice and automation
          </p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Assistant Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-center text-blue-800">AI Support Assistant</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <PromptAnimator text={currentPrompt} />
            <VoiceAssistant onVoiceResult={handleVoiceResult} />
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="incidents" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="incidents" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              All Incidents
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Incident
            </TabsTrigger>
            <TabsTrigger value="my-incidents" className="flex items-center gap-2">
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
            <Card>
              <CardHeader>
                <CardTitle>My Assigned Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
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
