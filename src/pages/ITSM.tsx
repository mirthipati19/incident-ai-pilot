import React, { useState } from "react";
import { MainNavigation } from "@/components/Navigation/MainNavigation";
import CreateIncidentForm from "@/components/Incidents/CreateIncidentForm";
import IncidentList from "@/components/Incidents/IncidentList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Ticket, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  MessageCircle,
  Phone
} from "lucide-react";
import ChatSupport from "@/components/Assistant/ChatSupport";
import ImprovedVoiceInstaller from "@/components/ImprovedVoiceInstaller";
import { useChatContext } from "@/contexts/ChatContext";

const ITSM = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showChatSupport, setShowChatSupport] = useState(false);
  const { addMessage, startCall, isCallActive } = useChatContext();

  const handleChatMessage = (message: string) => {
    addMessage(message, false);
    // Simulate bot response
    setTimeout(() => {
      addMessage(`I understand you're experiencing: "${message}". I'm analyzing this issue and will create a support ticket for you right away.`, true);
    }, 1000);
  };

  const handleStartCall = () => {
    startCall();
    setShowChatSupport(false);
  };

  // Mock data for demonstration
  const incidentStats = {
    open: 12,
    inProgress: 5,
    resolved: 48,
    total: 65
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">IT Service Management</h1>
            <p className="text-gray-600">Manage and track your IT service requests and incidents</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Voice Controller */}
            <ImprovedVoiceInstaller />
            
            {/* Chat Support Button */}
            <Button
              onClick={() => setShowChatSupport(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat Support
            </Button>
            
            {/* Call Support Button */}
            <Button
              onClick={handleStartCall}
              disabled={isCallActive}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
            >
              <Phone className="w-4 h-4 mr-2" />
              {isCallActive ? 'Call Active' : 'Call Support'}
            </Button>
            
            {/* Create Incident Button */}
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Incident
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Open Tickets</p>
                  <p className="text-2xl font-bold text-blue-800">{incidentStats.open}</p>
                </div>
                <div className="bg-blue-500 p-3 rounded-full">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-800">{incidentStats.inProgress}</p>
                </div>
                <div className="bg-yellow-500 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Resolved</p>
                  <p className="text-2xl font-bold text-green-800">{incidentStats.resolved}</p>
                </div>
                <div className="bg-green-500 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Total Tickets</p>
                  <p className="text-2xl font-bold text-purple-800">{incidentStats.total}</p>
                </div>
                <div className="bg-purple-500 p-3 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="incidents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="incidents">My Incidents</TabsTrigger>
            <TabsTrigger value="all-incidents">All Incidents</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="incidents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-blue-600" />
                  Your Incidents
                </CardTitle>
                <CardDescription>
                  Track and manage your submitted incidents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IncidentList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-incidents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Organization Incidents</CardTitle>
                <CardDescription>
                  View all incidents across your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IncidentList showAllOrganization={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Incident Analytics</CardTitle>
                <CardDescription>
                  View trends and statistics for your incidents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  Analytics dashboard coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Incident Reports</CardTitle>
                <CardDescription>
                  Generate and download incident reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  Reports functionality coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showCreateForm && (
        <CreateIncidentForm onClose={() => setShowCreateForm(false)} />
      )}

      {showChatSupport && (
        <ChatSupport 
          onClose={() => setShowChatSupport(false)}
          onMessageSent={handleChatMessage}
        />
      )}
    </div>
  );
};

export default ITSM;
