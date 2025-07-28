
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceCatalogGrid } from "@/components/ServiceCatalog/ServiceCatalogGrid";
import ServiceCatalogAdminGrid from "@/components/ServiceCatalog/ServiceCatalogAdminGrid";
import ServiceCatalogForm from "@/components/ServiceCatalog/ServiceCatalogForm";
import { ServiceRequestForm } from "@/components/ServiceCatalog/ServiceRequestForm";
import { ServiceRequestsList } from "@/components/ServiceCatalog/ServiceRequestsList";
import { serviceCatalogService, ServiceCatalog, ServiceRequest } from "@/services/serviceCatalogService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { roleService } from "@/services/roleService";

export const ServiceCatalogPage: React.FC = () => {
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceCatalog | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        checkAdminStatus();
      }
      loadData();
    };
    getCurrentUser();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await roleService.isAdmin();
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [servicesData, requestsData] = await Promise.all([
        serviceCatalogService.getServiceCatalog(),
        serviceCatalogService.getServiceRequests()
      ]);
      
      setServices(servicesData);
      setRequests(requestsData as ServiceRequest[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load service catalog data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestService = (service: ServiceCatalog) => {
    setSelectedService(service);
    setIsFormOpen(true);
  };

  const handleSubmitRequest = async (requestData: any) => {
    if (!currentUser) return;
    
    const newRequest = await serviceCatalogService.createServiceRequest({
      ...requestData,
      user_id: currentUser.id
    });
    
    setRequests([newRequest as ServiceRequest, ...requests]);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const updatedRequest = await serviceCatalogService.updateServiceRequest(id, { status });
      setRequests(requests.map(req => 
        req.id === id ? updatedRequest as ServiceRequest : req
      ));
      
      toast({
        title: "Status Updated",
        description: `Request status updated to ${status.replace('_', ' ')}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update request status.",
        variant: "destructive",
      });
    }
  };

  const handleCreateService = async (serviceData: any) => {
    try {
      const newService = await serviceCatalogService.createServiceCatalogItem({
        ...serviceData,
        created_by: currentUser?.id
      });
      setServices(prev => [...prev, newService]);
      setIsServiceFormOpen(false);
      setEditingService(null);
      
      toast({
        title: "Success",
        description: "Service created successfully"
      });
    } catch (error) {
      console.error('Error creating service:', error);
      toast({
        title: "Error",
        description: "Failed to create service",
        variant: "destructive"
      });
    }
  };

  const handleUpdateService = async (serviceData: any) => {
    if (!editingService) return;
    
    try {
      const updatedService = await serviceCatalogService.updateServiceCatalogItem(
        editingService.id, 
        serviceData
      );
      setServices(prev => prev.map(service => 
        service.id === editingService.id ? updatedService : service
      ));
      setIsServiceFormOpen(false);
      setEditingService(null);
      
      toast({
        title: "Success",
        description: "Service updated successfully"
      });
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive"
      });
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await serviceCatalogService.updateServiceCatalogItem(id, { is_active: false });
      setServices(prev => prev.filter(service => service.id !== id));
      
      toast({
        title: "Success",
        description: "Service deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive"
      });
    }
  };

  const handleEditService = (service: ServiceCatalog) => {
    setEditingService(service);
    setIsServiceFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Service Catalog</h1>
          <p className="text-blue-200">Request IT services and track your requests</p>
        </div>

        <Tabs defaultValue="catalog" className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} bg-white/10 backdrop-blur-sm border-white/20`}>
            <TabsTrigger value="catalog" className="text-white data-[state=active]:bg-white/20">Service Catalog</TabsTrigger>
            <TabsTrigger value="requests" className="text-white data-[state=active]:bg-white/20">My Requests</TabsTrigger>
            {isAdmin && <TabsTrigger value="manage" className="text-white data-[state=active]:bg-white/20">Manage Services</TabsTrigger>}
          </TabsList>

          <TabsContent value="catalog">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle>Available Services</CardTitle>
                <CardDescription className="text-blue-200">
                  Browse and request IT services from our catalog
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceCatalogGrid
                  services={services}
                  onRequestService={handleRequestService}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle>Service Requests</CardTitle>
                <CardDescription className="text-blue-200">
                  Track the status of your service requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceRequestsList
                  requests={requests}
                  onUpdateStatus={handleUpdateStatus}
                  isAdmin={isAdmin}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="manage">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle>Service Management</CardTitle>
                  <CardDescription className="text-blue-200">
                    Create and manage service catalog entries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ServiceCatalogAdminGrid
                    services={services}
                    onEdit={handleEditService}
                    onDelete={handleDeleteService}
                    onCreate={() => {
                      setEditingService(null);
                      setIsServiceFormOpen(true);
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <ServiceRequestForm
          service={selectedService}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmitRequest}
        />

        {isServiceFormOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="max-w-2xl w-full">
              <ServiceCatalogForm
                service={editingService}
                onSubmit={editingService ? handleUpdateService : handleCreateService}
                onCancel={() => {
                  setIsServiceFormOpen(false);
                  setEditingService(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceCatalogPage;
