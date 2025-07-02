
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Monitor, Smartphone, Laptop, HardDrive, Printer, Wifi } from 'lucide-react';
import { AssetCard } from '@/components/AssetManagement/AssetCard';
import { AssetForm } from '@/components/AssetManagement/AssetForm';
import { assetManagementService, Asset } from '@/services/assetManagementService';
import { useToast } from '@/hooks/use-toast';
import { useImprovedAuth } from '@/contexts/ImprovedAuthContext';

const AssetManagement = () => {
  const { user } = useImprovedAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const categories = ['All', 'Hardware', 'Software', 'Network', 'Mobile', 'Peripherals'];
  const statuses = ['All', 'Active', 'Inactive', 'In Repair', 'Disposed', 'Reserved'];

  const getAssetIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'laptop':
      case 'computer':
        return Laptop;
      case 'monitor':
      case 'display':
        return Monitor;
      case 'mobile':
      case 'phone':
        return Smartphone;
      case 'storage':
      case 'drive':
        return HardDrive;
      case 'printer':
        return Printer;
      case 'network':
        return Wifi;
      default:
        return Monitor;
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await assetManagementService.getAssets();
      setAssets(data);
    } catch (error: any) {
      console.error('Failed to load assets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assets.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (assetData: any) => {
    try {
      if (!user?.id) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to create assets.',
          variant: 'destructive',
        });
        return;
      }

      await assetManagementService.createAsset({
        ...assetData,
        created_by: user.id
      });
      
      toast({
        title: 'Success',
        description: 'Asset created successfully.',
      });
      
      setShowForm(false);
      loadAssets();
    } catch (error: any) {
      console.error('Failed to create asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to create asset.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAsset = async (assetData: any) => {
    if (!selectedAsset) return;

    try {
      await assetManagementService.updateAsset(selectedAsset.id, assetData);
      
      toast({
        title: 'Success',
        description: 'Asset updated successfully.',
      });
      
      setShowForm(false);
      setSelectedAsset(null);
      loadAssets();
    } catch (error: any) {
      console.error('Failed to update asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to update asset.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await assetManagementService.deleteAsset(assetId);
      
      toast({
        title: 'Success',
        description: 'Asset deleted successfully.',
      });
      
      loadAssets();
    } catch (error: any) {
      console.error('Failed to delete asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete asset.',
        variant: 'destructive',
      });
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (asset.manufacturer && asset.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (asset.model && asset.model.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || asset.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || asset.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (showForm) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="relative z-10">
          <AssetForm
            asset={selectedAsset}
            onSubmit={selectedAsset ? handleUpdateAsset : handleCreateAsset}
            onCancel={() => {
              setShowForm(false);
              setSelectedAsset(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">Asset Management</h1>
            <p className="text-blue-200">Track and manage your organization's IT assets and equipment.</p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search by name, tag, manufacturer, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="bg-gray-800">
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
              >
                {statuses.map(status => (
                  <option key={status} value={status} className="bg-gray-800">
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Assets Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white mt-4">Loading assets...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="text-center py-12">
              <Monitor className="h-16 w-16 mx-auto mb-4 text-blue-400" />
              <h3 className="text-xl font-semibold mb-2">No Assets Found</h3>
              <p className="text-blue-200 mb-4">
                {searchTerm || selectedCategory !== 'All' || selectedStatus !== 'All' 
                  ? 'Try adjusting your search terms or filters.' 
                  : 'Start by adding your first asset to the system.'}
              </p>
              {!searchTerm && selectedCategory === 'All' && selectedStatus === 'All' && (
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Asset
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onEdit={(asset) => {
                  setSelectedAsset(asset);
                  setShowForm(true);
                }}
                onDelete={handleDeleteAsset}
                onViewDetails={(asset) => {
                  // Handle view details if needed
                  console.log('View details for asset:', asset);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetManagement;
