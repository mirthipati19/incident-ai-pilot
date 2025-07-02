
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Asset } from "@/services/assetManagementService";

interface AssetFormProps {
  asset?: Asset;
  onSubmit: (assetData: any) => Promise<void>;
  onCancel?: () => void;
}

export const AssetForm: React.FC<AssetFormProps> = ({
  asset,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: asset?.name || "",
    asset_tag: asset?.asset_tag || "",
    asset_type: asset?.asset_type || "hardware",
    category: asset?.category || "",
    manufacturer: asset?.manufacturer || "",
    model: asset?.model || "",
    serial_number: asset?.serial_number || "",
    location: asset?.location || "",
    status: asset?.status || "active",
    cost: asset?.cost?.toString() || "",
    purchase_date: asset?.purchase_date || "",
    warranty_expiry: asset?.warranty_expiry || "",
    current_value: asset?.current_value?.toString() || "",
    depreciation_rate: asset?.depreciation_rate?.toString() || "",
    specifications: JSON.stringify(asset?.specifications || {})
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const assetData = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        current_value: formData.current_value ? parseFloat(formData.current_value) : null,
        depreciation_rate: formData.depreciation_rate ? parseFloat(formData.depreciation_rate) : null,
        specifications: formData.specifications ? JSON.parse(formData.specifications) : {}
      };

      await onSubmit(assetData);
    } catch (error) {
      console.error('Error submitting asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle>{asset ? 'Edit Asset' : 'Create New Asset'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset_tag">Asset Tag *</Label>
              <Input
                id="asset_tag"
                value={formData.asset_tag}
                onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset_type">Asset Type</Label>
              <Select value={formData.asset_type} onValueChange={(value) => setFormData({ ...formData, asset_type: value })}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
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

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
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

            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
              <Input
                id="warranty_expiry"
                type="date"
                value={formData.warranty_expiry}
                onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_value">Current Value</Label>
              <Input
                id="current_value"
                type="number"
                step="0.01"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depreciation_rate">Depreciation Rate (%)</Label>
              <Input
                id="depreciation_rate"
                type="number"
                step="0.01"
                value={formData.depreciation_rate}
                onChange={(e) => setFormData({ ...formData, depreciation_rate: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specifications">Specifications (JSON)</Label>
            <Textarea
              id="specifications"
              value={formData.specifications}
              onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
              rows={3}
              placeholder='{"cpu": "Intel i7", "ram": "16GB"}'
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? 'Saving...' : (asset ? 'Update Asset' : 'Create Asset')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="border-white/20 text-white hover:bg-white/10">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
