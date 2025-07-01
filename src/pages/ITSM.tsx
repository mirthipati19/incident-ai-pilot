import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PromptAnimator from '@/components/Assistant/PromptAnimator';
import CallSupport from '@/components/Assistant/CallSupport';
import ChatSupport from '@/components/Assistant/ChatSupport';
import IncidentList from '@/components/Incidents/IncidentList';
import IncidentDetails from '@/components/Incidents/IncidentDetails';
import IncidentResolutionPopup from '@/components/IncidentResolutionPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeadphonesIcon, List, CheckCircle, XCircle, Clock, MessageCircle, Phone, AlertTriangle, Settings, LogOut } from 'lucide-react';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';
import { incidentService, type Incident } from '@/services/incidentService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';

const ITSMPage = () => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState("Welcome to Authexa Support! How can I assist you today?");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resolutionPopup, setResolutionPopup] = useState<{
    incident: Incident;
    suggestedResolution: string;
  } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    resolvedToday: 0,
    critical: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, signOut } = useImprovedAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load user incidents and stats
  useEffect(() => {
    if (user?.id) {
      loadIncidents();
      loadStats();
      checkAdminStatus();
    }
  }, [user?.id]);

  const checkAdminStatus = async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      setIsAdmin(!!data);
    } catch (error) {
      console.log('Not an admin user');
    }
  };

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

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out",
      });
      navigate('/signin');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  const generateAIResolution = (description: string): string => {
    const lowerText = description.toLowerCase();
    
    if (lowerText.includes('password') || lowerText.includes('login')) {
      return "Try resetting your password using the 'Forgot Password' link. If that doesn't work, clear your browser cache and cookies, then try again. Contact IT if the issue persists.";
    } else if (lowerText.includes('software') || lowerText.includes('install')) {
      return "Ensure you have admin rights on your computer. Download the latest version from the official website. If installation fails, temporarily disable antivirus and try again.";
    } else if (lowerText.includes('network') || lowerText.includes('internet')) {
      return "Check if other devices can connect to the network. Try restarting your router and computer. If using WiFi, move closer to the router or try using an ethernet cable.";
    } else if (lowerText.includes('slow') || lowerText.includes('performance')) {
      return "Close unnecessary programs and browser tabs. Restart your computer. Check if your hard drive has sufficient free space (at least 15% free). Run a disk cleanup if needed.";
    } else {
      return "Please try restarting the application or your computer. If the issue persists, check for software updates. Document any error messages and contact support if needed.";
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
      setRefreshTrigger(prev => prev + 1); // Trigger refresh for IncidentList
      
      // Auto-assign to AI for immediate resolution attempt
      setTimeout(async () => {
        try {
          await incidentService.updateIncidentStatus(newIncident.id, 'In Progress');
          const suggestedResolution = generateAIResolution(text);
          
          // Simulate AI processing time
          setTimeout(() => {
            setResolutionPopup({
              incident: { ...newIncident, status: 'In Progress' },
              suggestedResolution
            });
          }, 3000);
        } catch (error) {
          console.error('Failed to auto-assign incident:', error);
        }
      }, 1000);
      
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
        setCurrentPrompt(`I've created incident #${incident.id.slice(0, 8)} for your issue. AI is analyzing the problem and preparing a solution...`);
      }
    } else if (text.toLowerCase().includes('status') || text.toLowerCase().includes('check')) {
      setCurrentPrompt('Let me show you the current incident status dashboard.');
    } else {
      setCurrentPrompt('I can help you with incident management, status checks, or creating new tickets. Please describe your issue.');
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
        setCurrentPrompt(`I've automatically created incident #${incident.id.slice(0, 8)} for your issue. AI is analyzing your problem and preparing a solution...`);
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
      
      // Refresh stats and trigger refresh for IncidentList
      loadStats();
      setRefreshTrigger(prev => prev + 1);
      
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

  const handleResolutionAccept = async (rating: number, feedback?: string) => {
    if (!resolutionPopup) return;
    
    try {
      // Update incident to resolved
      await incidentService.updateIncidentStatus(resolutionPopup.incident.id, 'Resolved');
      
      // Record AI resolution stats
      await supabase
        .from('ai_resolution_stats')
        .insert({
          incident_id: resolutionPopup.incident.id,
          resolution_method: 'auto',
          resolution_time_minutes: Math.floor(Math.random() * 30) + 5, // Mock time
          user_satisfaction_score: rating,
          ai_confidence_score: 0.85,
          resolved_at: new Date().toISOString()
        });
      
      // Update local state
      setIncidents(prev => 
        prev.map(incident => 
          incident.id === resolutionPopup.incident.id
            ? { ...incident, status: 'Resolved' as const, updated_at: new Date().toISOString() }
            : incident
        )
      );
      
      loadStats();
      setRefreshTrigger(prev => prev + 1);
      setResolutionPopup(null);
      
      toast({
        title: "Resolution Accepted",
        description: "Great! Your incident has been resolved. Thank you for the feedback!",
      });
      
      // Auto-close incident after 30 seconds
      setTimeout(async () => {
        try {
          await incidentService.updateIncidentStatus(resolutionPopup.incident.id, 'Closed');
          loadStats();
          setRefreshTrigger(prev => prev + 1);
        } catch (error) {
          console.error('Failed to auto-close incident:', error);
        }
      }, 30000);
      
    } catch (error) {
      console.error('Failed to record resolution:', error);
      toast({
        title: "Error",
        description: "Failed to record resolution",
        variant: "destructive"
      });
    }
  };

  const handleResolutionEscalate = async () => {
    if (!resolutionPopup) return;
    
    try {
      // Update incident to In Progress and assign to human
      await incidentService.updateIncidentStatus(resolutionPopup.incident.id, 'In Progress');
      
      // Record escalation
      await supabase
        .from('ai_resolution_stats')
        .insert({
          incident_id: resolutionPopup.incident.id,
          resolution_method: 'escalated',
          ai_confidence_score: 0.45,
          resolved_at: null
        });
      
      // Update local state
      setIncidents(prev => 
        prev.map(incident => 
          incident.id === resolutionPopup.incident.id
            ? { ...incident, status: 'In Progress' as const, assignee: 'Human Support Agent', updated_at: new Date().toISOString() }
            : incident
        )
      );
      
      loadStats();
      setRefreshTrigger(prev => prev + 1);
      setResolutionPopup(null);
      
      toast({
        title: "Escalated to Human Support",
        description: "Your incident has been assigned to a human support agent who will contact you soon.",
      });
    } catch (error) {
      console.error('Failed to escalate incident:', error);
      toast({
        title: "Error",
        description: "Failed to escalate incident",
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
        backgroundImage: `url('/lovable-uploads/c94935e4-6231-41ae-993c-155a820c9885.png')`,
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
          <div className="flex items-center justify-center gap-3">
            <img 
              src="/lovable-uploads/c94935e4-6231-41ae-993c-155a820c9885.png" 
              alt="Authexa Logo" 
              className="w-12 h-12"
            />
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              Authexa Support
            </h1>
            <div className="flex gap-2">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    <Settings className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="bg-red-600/20 text-white border-red-400/30 hover:bg-red-600/30"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
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
              <div className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 text-white/60" />
                <p className="text-white/80 text-sm">Ready to connect when needed</p>
                <button 
                  className="mt-3 bg-blue-600/80 hover:bg-blue-700/80 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Request Connection
                </button>
              </div>
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
              userId={user?.id || ''}
              refreshTrigger={refreshTrigger}
            />
          </TabsContent>
        </Tabs>

        {/* Incident Details Modal */}
        {selectedIncident && (
          <IncidentDetails
            incident={{
              ...selectedIncident,
              createdAt: selectedIncident.created_at,
              updatedAt: selectedIncident.updated_at,
              assignee: selectedIncident.assignee || 'Unassigned'
            }}
            onClose={() => setSelectedIncident(null)}
            onStatusUpdate={handleStatusUpdate}
          />
        )}

        {/* AI Resolution Popup */}
        {resolutionPopup && (
          <IncidentResolutionPopup
            incident={resolutionPopup.incident}
            suggestedResolution={resolutionPopup.suggestedResolution}
            onResolve={handleResolutionAccept}
            onEscalate={handleResolutionEscalate}
            onClose={() => setResolutionPopup(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ITSMPage;
