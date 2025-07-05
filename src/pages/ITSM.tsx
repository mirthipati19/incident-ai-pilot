
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Ticket, MessageSquare, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreateIncidentForm from "@/components/Incidents/CreateIncidentForm";
import IncidentList from "@/components/Incidents/IncidentList";
import VoiceControllerInstaller from "@/components/VoiceController/VoiceControllerInstaller";
import { incidentService, Incident } from "@/services/incidentService";

const ITSM = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Mock user ID - in a real app, this would come from authentication
  const userId = "user-123";

  const loadIncidents = async () => {
    try {
      setIsLoading(true);
      const userIncidents = await incidentService.getUserIncidents(userId);
      setIncidents(userIncidents);
    } catch (error) {
      console.error('Error loading incidents:', error);
      toast({
        title: "Error",
        description: "Failed to load incidents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleIncidentCreate = async (incidentData: {
    title: string;
    description: string;
    priority: string;
    category: string;
    assignee: string;
  }) => {
    try {
      const newIncident = await incidentService.createIncident({
        ...incidentData,
        user_id: userId,
        status: 'Open',
        priority: incidentData.priority as 'low' | 'medium' | 'high' | 'critical'
      });
      
      await loadIncidents(); // Refresh the list
      setShowCreateForm(false);
      
      toast({
        title: "Success",
        description: "Incident created successfully!"
      });
    } catch (error) {
      console.error('Error creating incident:', error);
      throw error; // Let the form handle the error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Self Service Portal
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Submit and track your IT support requests
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {incidents.filter(i => i.status === 'Open').length}
                  </p>
                  <p className="text-sm text-gray-600">Open Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {incidents.filter(i => i.status === 'In Progress').length}
                  </p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {incidents.filter(i => i.status === 'Resolved').length}
                  </p>
                  <p className="text-sm text-gray-600">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Filter className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">2.5h</p>
                  <p className="text-sm text-gray-600">Avg Response</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Incident Management
            </CardTitle>
            <CardDescription className="text-gray-600">
              Create, track, and manage your IT support tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="tickets" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="tickets" className="text-sm font-medium">
                  My Tickets
                </TabsTrigger>
                <TabsTrigger value="create" className="text-sm font-medium">
                  Create Ticket
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="tickets" className="space-y-6">
                {isLoading ? (
                  <div>Loading incidents...</div>
                ) : (
                  <IncidentList 
                    incidents={incidents} 
                    onIncidentUpdate={loadIncidents}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="create" className="space-y-6">
                <CreateIncidentForm 
                  onSubmit={handleIncidentCreate}
                  onCancel={() => {}}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Voice Controller Installer */}
      <VoiceControllerInstaller />

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Ticket</h2>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              <CreateIncidentForm 
                onSubmit={handleIncidentCreate}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ITSM;
