
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, User, Zap, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { incidentService } from '@/services/incidentService';

interface IncidentData {
  title: string;
  description: string;
  priority: string;
  category: string;
  assignee: string;
}

interface CreateIncidentFormProps {
  onClose: () => void;
}

const CreateIncidentForm = ({ onClose }: CreateIncidentFormProps) => {
  const [formData, setFormData] = useState<IncidentData>({
    title: '',
    description: '',
    priority: '',
    category: '',
    assignee: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof IncidentData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.priority) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await incidentService.createIncident({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category || 'other',
        assignee: formData.assignee || 'auto'
      });
      
      toast({
        title: "Incident Created",
        description: "Your incident has been successfully created and assigned.",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create incident. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white border-gray-200 text-gray-900 relative">
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
        >
          <X className="h-5 w-5" />
        </Button>
        
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Create New Incident
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-700">Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="Brief description of the issue"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700">Description *</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the incident"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-gray-700">Priority *</Label>
                <Select onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Low
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        High
                      </div>
                    </SelectItem>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Critical
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-700">Category</Label>
                <Select onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="access">Access Request</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee" className="text-gray-700">Assign to</Label>
              <Select onValueChange={(value) => handleInputChange('assignee', value)}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Auto-assign or select technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Auto-assign
                    </div>
                  </SelectItem>
                  <SelectItem value="john.doe">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      John Doe - Level 1
                    </div>
                  </SelectItem>
                  <SelectItem value="jane.smith">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Jane Smith - Level 2
                    </div>
                  </SelectItem>
                  <SelectItem value="mike.wilson">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Mike Wilson - Level 3
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Incident...' : 'Create Incident'}
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateIncidentForm;
