
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Settings, Monitor, Shield } from "lucide-react";
import { ServiceCatalog } from "@/services/serviceCatalogService";

interface ServiceCatalogGridProps {
  services: ServiceCatalog[];
  onRequestService: (service: ServiceCatalog) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'hardware':
      return <Monitor className="h-6 w-6" />;
    case 'software':
      return <Settings className="h-6 w-6" />;
    case 'access':
      return <Shield className="h-6 w-6" />;
    case 'infrastructure':
      return <User className="h-6 w-6" />;
    default:
      return <Settings className="h-6 w-6" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'hardware':
      return 'bg-blue-100 text-blue-800';
    case 'software':
      return 'bg-green-100 text-green-800';
    case 'access':
      return 'bg-purple-100 text-purple-800';
    case 'infrastructure':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const ServiceCatalogGrid: React.FC<ServiceCatalogGridProps> = ({
  services,
  onRequestService
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <Card key={service.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getCategoryIcon(service.category)}
                <div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <Badge className={getCategoryColor(service.category)}>
                    {service.category}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              {service.description}
            </CardDescription>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>~{service.estimated_fulfillment_hours}h</span>
              </div>
              {service.requires_approval && (
                <Badge variant="outline">Requires Approval</Badge>
              )}
            </div>
            <Button 
              onClick={() => onRequestService(service)}
              className="w-full"
            >
              Request Service
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
