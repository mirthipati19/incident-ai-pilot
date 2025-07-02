
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, BarChart3 } from "lucide-react";
import { AssetCard } from "@/components/AssetManagement/AssetCard";
import { AssetForm } from "@/components/AssetManagement/AssetForm";
import { assetManagementService, Asset, SoftwareLicense } from "@/services/assetManagementService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const AssetManagementPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
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
  }, [statusFilter, categoryFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [assetsData, licensesData] = await Promise.all([
        assetManagementService.getAssets({
          status: statusFilter || undefined,
          category: categoryFilter || undefined
        }),
        assetManagementService.getLicenses()
      ]);
      
      setAssets(assetsData);
      setLicenses(licensesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load asset management data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAsset = () => {
    setSelectedAsset(null);
    setIsAssetFormOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsAssetFormOpen(true);
  };

  const handleViewAssetDetails = (asset: Asset) => {
    // This could open a detailed asset view
    console.log("View asset details:", asset);
  };

  const handleAssetSubmit = async (assetData: any) => {
    if (!currentUser) return;
    
    if (selectedAsset) {
      const updatedAsset = await assetManagementService.updateAsset(selectedAsset.id, assetData);
      setAssets(assets.map(asset => 
        asset.id === selectedAsset.id ? updatedAsset : asset
      ));
    } else {
      const newAsset = await assetManagementService.createAsset(assetData);
      setAssets([newAsset, ...assets]);
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const assetStats = {
    total: assets.length,
    active: assets.filter(a => a.status === 'active').length,
    maintenance: assets.filter(a => a.status === 'maintenance').length,
    retired: assets.filter(a => a.status === 'retired').length
  };

  const licenseStats = {
    total: licenses.reduce((sum, l) => sum + l.total_licenses, 0),
    used: licenses.reduce((sum, l) => sum + (l.used_licenses || 0), 0),
    expiring: licenses.filter(l => l.expiry_date && new Date(l.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Asset Management</h1>
        <p className="text-gray-600">Manage your IT assets, licenses, and configurations</p>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetStats.total}</div>
            <div className="text-xs text-muted-foreground">
              {assetStats.active} active, {assetStats.maintenance} in maintenance
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">License Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenseStats.used}/{licenseStats.total}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((licenseStats.used / licenseStats.total) * 100)}% utilized
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Licenses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenseStats.expiring}</div>
            <div className="text-xs text-muted-foreground">
              Expiring in next 30 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${assets.reduce((sum, a) => sum + (a.cost || 0), 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Total asset value
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
          <TabsTrigger value="relationships">Dependencies</TabsTrigger>
        </TabsList>

        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>IT Assets</CardTitle>
                  <CardDescription>
                    Manage your hardware, software, and virtual assets
                  </CardDescription>
                </div>
                <Button onClick={handleCreateAsset}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Filter by category..."
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full md:w-48"
                />
              </div>

              {/* Assets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onEdit={handleEditAsset}
                    onViewDetails={handleViewAssetDetails}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses">
          <Card>
            <CardHeader>
              <CardTitle>Software Licenses</CardTitle>
              <CardDescription>
                Track and manage software license compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {licenses.map((license) => (
                  <Card key={license.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{license.software_name}</CardTitle>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 rounded text-sm ${
                            license.compliance_status === 'compliant' 
                              ? 'bg-green-100 text-green-800'
                              : license.compliance_status === 'expired'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {license.compliance_status}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <div className="font-medium">{license.license_type}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Usage:</span>
                          <div className="font-medium">
                            {license.used_licenses || 0}/{license.total_licenses}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Vendor:</span>
                          <div className="font-medium">{license.vendor || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Expires:</span>
                          <div className="font-medium">
                            {license.expiry_date 
                              ? format(new Date(license.expiry_date), 'MMM d, yyyy')
                              : 'Never'
                            }
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relationships">
          <Card>
            <CardHeader>
              <CardTitle>Asset Dependencies</CardTitle>
              <CardDescription>
                View and manage relationships between assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <p>Asset dependency visualization coming soon...</p>
                <p className="text-sm mt-2">This will show relationships and impact analysis between assets.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AssetForm
        asset={selectedAsset}
        isOpen={isAssetFormOpen}
        onClose={() => setIsAssetFormOpen(false)}
        onSubmit={handleAssetSubmit}
      />
    </div>
  );
};

export default AssetManagementPage;
