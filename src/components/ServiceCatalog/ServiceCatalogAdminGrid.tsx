import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus } from 'lucide-react';
import { ServiceCatalog } from '@/services/serviceCatalogService';

interface ServiceCatalogAdminGridProps {
  services: ServiceCatalog[];
  onEdit: (service: ServiceCatalog) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

const ServiceCatalogAdminGrid: React.FC<ServiceCatalogAdminGridProps> = ({
  services,
  onEdit,
  onDelete,
  onCreate
}) => {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Software': 'bg-blue-100 text-blue-800',
      'Hardware': 'bg-green-100 text-green-800',
      'Access': 'bg-purple-100 text-purple-800',
      'Support': 'bg-orange-100 text-orange-800',
      'Training': 'bg-pink-100 text-pink-800',
      'Infrastructure': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Service Catalog Management</h2>
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {service.description}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(service)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(service.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge className={getCategoryColor(service.category)}>
                  {service.category}
                </Badge>
                
                <div className="text-sm text-gray-600">
                  <p><strong>Fulfillment:</strong> {service.estimated_fulfillment_hours}h</p>
                  <p><strong>Approval Required:</strong> {service.requires_approval ? 'Yes' : 'No'}</p>
                  <p><strong>Status:</strong> {service.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No services found</p>
          <Button className="mt-4" onClick={onCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Service
          </Button>
        </div>
      )}
    </div>
  );
};

export default ServiceCatalogAdminGrid;