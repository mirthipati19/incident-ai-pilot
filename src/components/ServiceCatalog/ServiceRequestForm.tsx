
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceCatalog } from "@/services/serviceCatalogService";
import { useToast } from "@/hooks/use-toast";

interface ServiceRequestFormProps {
  service: ServiceCatalog | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requestData: any) => Promise<void>;
}

export const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({
  service,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    requestedData: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        service_catalog_id: service.id,
        title: formData.title || `${service.name} Request`,
        description: formData.description,
        priority: formData.priority,
        requested_data: formData.requestedData
      });
      
      toast({
        title: "Request Submitted",
        description: "Your service request has been submitted successfully.",
      });
      
      onClose();
      setFormData({ title: "", description: "", priority: "medium", requestedData: {} });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit service request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request: {service.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Request Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={`${service.name} Request`}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Please provide details about your request..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {service.requires_approval && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ This request requires approval and may take additional time to process.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
