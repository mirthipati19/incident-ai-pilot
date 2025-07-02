
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Asset } from "@/services/assetManagementService";
import { useToast } from "@/hooks/use-toast";

interface AssetFormProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assetData: any) => Promise<void>;
}

export const AssetForm: React.FC<AssetFormProps> = ({
  asset,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    asset_tag: "",
    name: "",
    asset_type: "hardware",
    category: "",
    manufacturer: "",
    model: "",
    serial_number: "",
    purchase_date: "",
    warranty_expiry: "",
    status: "active",
    location: "",
    cost: "",
    specifications: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (asset) {
      setFormData({
        asset_tag: asset.asset_tag || "",
        name: asset.name || "",
        asset_type: asset.asset_type || "hardware",
        category: asset.category || "",
        manufacturer: asset.manufacturer || "",
        model: asset.model || "",
        serial_number: asset.serial_number || "",
        purchase_date: asset.purchase_date || "",
        warranty_expiry: asset.warranty_expiry || "",
        status: asset.status || "active",
        location: asset.location || "",
        cost: asset.cost?.toString() || "",
        specifications: JSON.stringify(asset.specifications || {}, null, 2)
      });
    } else {
      setFormData({
        asset_tag: "",
        name: "",
        asset_type: "hardware",
        category: "",
        manufacturer: "",
        model: "",
        serial_number: "",
        purchase_date: "",
        warranty_expiry: "",
        status: "active",
        location: "",
        cost: "",
        specifications: "{}"
      });
    }
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      const submitData = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        purchase_date: formData.purchase_date || null,
        warranty_expiry: formData.warranty_expiry || null,
        specifications: formData.specifications ? JSON.parse(formData.specifications) : {}
      };
      
      await onSubmit(submitData);
      
      toast({
        title: asset ? "Asset Updated" : "Asset Created",
        description: `Asset has been ${asset ? 'updated' : 'created'} successfully.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${asset ? 'update' : 'create'} asset.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? 'Edit Asset' : 'Create New Asset'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="asset_tag">Asset Tag *</Label>
              <Input
                id="asset_tag"
                value={formData.asset_tag}
                onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="asset_type">Asset Type</Label>
              <Select
                value={formData.asset_type}
                onValueChange={(value) => setFormData({ ...formData, asset_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="cloud_service">Cloud Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
              <Input
                id="warranty_expiry"
                type="date"
                value={formData.warranty_expiry}
                onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="specifications">Specifications (JSON)</Label>
            <Textarea
              id="specifications"
              value={formData.specifications}
              onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              rows={4}
              placeholder='{"cpu": "Intel i7", "ram": "16GB", "storage": "500GB SSD"}'
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (asset ? "Update Asset" : "Create Asset")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
