
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, User, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IncidentData {
  title: string;
  description: string;
  priority: string;
  category: string;
  assignee: string;
}

interface CreateIncidentFormProps {
  onIncidentCreated?: (incident: IncidentData) => void;
}

const CreateIncidentForm = ({ onIncidentCreated }: CreateIncidentFormProps) => {
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newIncident = {
        ...formData,
        id: Date.now().toString(),
        status: 'Open',
        createdAt: new Date().toISOString()
      };

      console.log('Created incident:', newIncident);
      onIncidentCreated?.(formData);
      
      toast({
        title: "Incident Created",
        description: "Your incident has been successfully created and assigned.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: '',
        category: '',
        assignee: ''
      });
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
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          Create New Incident
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="Brief description of the issue"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the incident"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
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
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
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
            <Label htmlFor="assignee">Assign to</Label>
            <Select onValueChange={(value) => handleInputChange('assignee', value)}>
              <SelectTrigger>
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

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Incident...' : 'Create Incident'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateIncidentForm;
