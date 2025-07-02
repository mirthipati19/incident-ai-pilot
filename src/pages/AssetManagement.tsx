
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Monitor, Plus, Search, Edit, Eye, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for assets
const mockAssets = [
  {
    id: "1",
    name: "Dell OptiPlex 7090",
    asset_tag: "AST001",
    asset_type: "Desktop",
    category: "Hardware",
    status: "active",
    assigned_to: "john.doe@company.com",
    location: "Office Floor 1",
    manufacturer: "Dell",
    model: "OptiPlex 7090",
    serial_number: "DL7090001",
    purchase_date: "2023-01-15",
    warranty_expiry: "2026-01-15",
    cost: 1200,
    current_value: 900
  },
  {
    id: "2",
    name: "MacBook Pro 16-inch",
    asset_tag: "AST002",
    asset_type: "Laptop",
    category: "Hardware",
    status: "active",
    assigned_to: "jane.smith@company.com",
    location: "Remote",
    manufacturer: "Apple",
    model: "MacBook Pro 16-inch",
    serial_number: "MBP16002",
    purchase_date: "2023-03-20",
    warranty_expiry: "2026-03-20",
    cost: 2500,
    current_value: 2000
  },
  {
    id: "3",
    name: "Adobe Creative Suite License",
    asset_tag: "LIC001",
    asset_type: "Software",
    category: "Software",
    status: "active",
    assigned_to: "design.team@company.com",
    location: "Cloud",
    manufacturer: "Adobe",
    model: "Creative Suite 2023",
    serial_number: "ACS2023001",
    purchase_date: "2023-02-01",
    warranty_expiry: "2024-02-01",
    cost: 600,
    current_value: 300
  }
];

const AssetManagementPage = () => {
  const [assets, setAssets] = useState(mockAssets);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const { toast } = useToast();

  const statuses = ["All", "active", "inactive", "maintenance", "retired"];

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "All" || asset.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'retired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (asset: any) => {
    toast({
      title: "Edit Asset",
      description: `Editing ${asset.name} - Feature coming soon!`,
    });
  };

  const handleViewDetails = (asset: any) => {
    toast({
      title: "Asset Details",
      description: `Viewing details for ${asset.name}`,
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Monitor className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Asset Management</h1>
          </div>
          <p className="text-lg text-gray-600">Track and manage your organization's hardware and software assets</p>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap items-center">
            {statuses.map(status => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
                className="whitespace-nowrap capitalize"
              >
                {status}
              </Button>
            ))}
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Asset
            </Button>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="hover:shadow-lg transition-shadow h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge className={getStatusColor(asset.status)}>
                    {asset.status}
                  </Badge>
                  <Badge variant="outline">
                    {asset.asset_tag}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{asset.name}</CardTitle>
                <CardDescription>
                  {asset.manufacturer} {asset.model}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{asset.asset_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{asset.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assigned to:</span>
                    <span className="font-medium text-xs">{asset.assigned_to}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Value:</span>
                    <span className="font-medium">${asset.current_value}</span>
                  </div>
                </div>

                {/* Warranty Warning */}
                {new Date(asset.warranty_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                  <div className="flex items-center gap-2 text-orange-600 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Warranty expires soon</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(asset)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(asset)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAssets.length === 0 && (
          <div className="text-center py-12">
            <Monitor className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-500">Try adjusting your search terms or status filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetManagementPage;
