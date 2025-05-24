
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PromptAnimator from '@/components/Assistant/PromptAnimator';
import CallSupport from '@/components/Assistant/CallSupport';
import ChatSupport from '@/components/Assistant/ChatSupport';
import ConnectPermissionPrompt from '@/components/Assistant/ConnectPermissionPrompt';
import IncidentList from '@/components/Incidents/IncidentList';
import IncidentDetails from '@/components/Incidents/IncidentDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, List, CheckCircle, XCircle, Clock, Phone, Shield, Settings, Users, AlertTriangle } from 'lucide-react';

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

  const createIncidentFromInput = (text: string, source: 'call' | 'chat') => {
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

    const newIncident: Incident = {
      id: Date.now().toString(),
      title: `${source === 'call' ? 'Voice' : 'Chat'} Support Request - ${text.slice(0, 50)}${text.length > 50 ? '...' : ''}`,
      description: text,
      status: 'Open',
      priority,
      category,
      assignee: 'auto',
      createdAt: new Date().toISOString()
    };

    setIncidents(prev => [newIncident, ...prev]);
    return newIncident;
  };

  const handleCallResult = (text: string) => {
    console.log('Call input received:', text);
    
    // Check if this looks like a problem description
    const problemKeywords = ['problem', 'issue', 'error', 'not working', 'broken', 'help', 'trouble', 'cant', "can't", 'unable', 'need'];
    const containsProblemKeyword = problemKeywords.some(keyword => text.toLowerCase().includes(keyword));
    
    if (containsProblemKeyword && text.length > 10) {
      const incident = createIncidentFromInput(text, 'call');
      setCurrentPrompt(`I've created incident #${incident.id} for your issue. Let me help you resolve: "${text}"`);
    } else if (text.toLowerCase().includes('install') || text.toLowerCase().includes('software')) {
      setCurrentPrompt('I can help you install software. Would you like me to connect to your device?');
      setShowConnectPrompt(true);
    } else if (text.toLowerCase().includes('status') || text.toLowerCase().includes('check')) {
      setCurrentPrompt('Let me show you the current incident status dashboard.');
    } else {
      setCurrentPrompt('I can help you with incident management, software installation, status checks, or creating new tickets. Please describe your issue.');
    }
  };

  const handleChatMessage = (message: string) => {
    console.log('Chat message sent:', message);
    
    // Check if this looks like a problem description
    const problemKeywords = ['problem', 'issue', 'error', 'not working', 'broken', 'help', 'trouble', 'cant', "can't", 'unable', 'need'];
    const containsProblemKeyword = problemKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    if (containsProblemKeyword && message.length > 10) {
      const incident = createIncidentFromInput(message, 'chat');
      setCurrentPrompt(`I've automatically created incident #${incident.id} for your issue. I'm working on a solution for: "${message}"`);
    } else {
      setCurrentPrompt(`Chat: "${message}". How else can I help you?`);
    }
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

  // Enhanced statistics with enterprise-style metrics
  const stats = [
    { label: 'Open Incidents', value: incidents.filter(i => i.status === 'Open').length || 12, icon: XCircle, color: 'text-red-600' },
    { label: 'In Progress', value: incidents.filter(i => i.status === 'In Progress').length || 8, icon: Clock, color: 'text-yellow-600' },
    { label: 'Resolved Today', value: incidents.filter(i => i.status === 'Resolved').length || 15, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Critical Priority', value: incidents.filter(i => i.priority === 'critical').length || 3, icon: AlertTriangle, color: 'text-orange-600' }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IT Service Management</h1>
          <p className="text-gray-600 mt-1">Incident management and support system</p>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Support */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
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
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Chat Support
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ChatSupport onMessageSent={handleChatMessage} />
          </CardContent>
        </Card>

        {/* Device Connection */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              Smart Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showConnectPrompt ? (
              <ConnectPermissionPrompt onApproval={() => setShowConnectPrompt(false)} />
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 text-sm">Ready to connect when needed</p>
                <button 
                  onClick={() => setShowConnectPrompt(true)}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Incidents
          </TabsTrigger>
          <TabsTrigger value="my-work" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            My Work
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
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

        <TabsContent value="my-work" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Assigned Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-gray-700 font-medium mb-2">Active Tickets</h4>
                    <p className="text-2xl font-bold text-blue-600">5</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="text-gray-700 font-medium mb-2">Pending Review</h4>
                    <p className="text-2xl font-bold text-yellow-600">2</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-gray-700 font-medium mb-2">Completed Today</h4>
                    <p className="text-2xl font-bold text-green-600">8</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Administration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-gray-700 font-medium">System Health</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-gray-700">Database</span>
                      <Badge className="bg-green-600 text-white">Healthy</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-gray-700">API Services</span>
                      <Badge className="bg-green-600 text-white">Online</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="text-gray-700">Smart Agent</span>
                      <Badge className="bg-yellow-600 text-white">Standby</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-gray-700 font-medium">Quick Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-left transition-colors border border-blue-200">
                      Bulk Import Users
                    </button>
                    <button className="w-full p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-left transition-colors border border-purple-200">
                      Generate Reports
                    </button>
                    <button className="w-full p-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-left transition-colors border border-orange-200">
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
  );
};

export default ITSMPage;
