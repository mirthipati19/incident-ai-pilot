import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ServiceCatalog } from '@/services/serviceCatalogService';

interface ServiceCatalogFormProps {
  service?: ServiceCatalog;
  onSubmit: (serviceData: any) => Promise<void>;
  onCancel?: () => void;
}

const ServiceCatalogForm: React.FC<ServiceCatalogFormProps> = ({
  service,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    category: service?.category || '',
    icon: service?.icon || '',
    estimated_fulfillment_hours: service?.estimated_fulfillment_hours || 24,
    requires_approval: service?.requires_approval || false,
    is_active: service?.is_active !== undefined ? service.is_active : true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Software',
    'Hardware', 
    'Access',
    'Support',
    'Training',
    'Infrastructure'
  ];

  const icons = [
    'laptop',
    'server',
    'key',
    'headphones',
    'book',
    'network'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{service ? 'Edit Service' : 'Create New Service'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter service name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the service"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select icon" />
                </SelectTrigger>
                <SelectContent>
                  {icons.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fulfillment">Estimated Fulfillment (hours)</Label>
              <Input
                id="fulfillment"
                type="number"
                value={formData.estimated_fulfillment_hours}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  estimated_fulfillment_hours: parseInt(e.target.value) || 24 
                }))}
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_approval"
                checked={formData.requires_approval}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, requires_approval: !!checked }))
                }
              />
              <Label htmlFor="requires_approval">Requires approval</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_active: !!checked }))
                }
              />
              <Label htmlFor="is_active">Service is active</Label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (service ? 'Update Service' : 'Create Service')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ServiceCatalogForm;