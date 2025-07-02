
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceCatalogGrid } from "@/components/ServiceCatalog/ServiceCatalogGrid";
import { ServiceRequestForm } from "@/components/ServiceCatalog/ServiceRequestForm";
import { ServiceRequestsList } from "@/components/ServiceCatalog/ServiceRequestsList";
import { serviceCatalogService, ServiceCatalog, ServiceRequest } from "@/services/serviceCatalogService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const ServiceCatalogPage: React.FC = () => {
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceCatalog | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      loadData();
    };
    getCurrentUser();
  }, []);

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

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Service Catalog</h1>
        <p className="text-gray-600">Request IT services and track your requests</p>
      </div>

      <Tabs defaultValue="catalog" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="catalog">Service Catalog</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <Card>
            <CardHeader>
              <CardTitle>Available Services</CardTitle>
              <CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle>Service Requests</CardTitle>
              <CardDescription>
                Track the status of your service requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceRequestsList
                requests={requests}
                onUpdateStatus={handleUpdateStatus}
                isAdmin={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ServiceRequestForm
        service={selectedService}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitRequest}
      />
    </div>
  );
};

export default ServiceCatalogPage;
