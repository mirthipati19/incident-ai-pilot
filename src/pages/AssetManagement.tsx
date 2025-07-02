
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter } from 'lucide-react';
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
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const categories = ['All', 'Hardware', 'Software', 'Virtual', 'Cloud Service'];

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
      await assetManagementService.createAsset(assetData);
      toast({
        title: 'Success',
        description: 'Asset created successfully.',
      });
      loadAssets();
      setShowForm(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to create asset.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAsset = async (assetData: any) => {
    if (!editingAsset) return;

    try {
      await assetManagementService.updateAsset(editingAsset.id, assetData);
      toast({
        title: 'Success',
        description: 'Asset updated successfully.',
      });
      loadAssets();
      setEditingAsset(null);
      setShowForm(false);
    } catch (error: any) {
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
      toast({
        title: 'Error',
        description: 'Failed to delete asset.',
        variant: 'destructive',
      });
    }
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setShowForm(true);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || asset.asset_type === selectedCategory.toLowerCase().replace(' ', '_');
    return matchesSearch && matchesCategory;
  });

  if (showForm) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="relative z-10 container mx-auto px-4 py-8">
          <AssetForm
            asset={editingAsset}
            onSubmit={editingAsset ? handleUpdateAsset : handleCreateAsset}
            onCancel={() => {
              setShowForm(false);
              setEditingAsset(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ci8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Asset Management</h1>
          <p className="text-blue-200">Manage and track your organization's IT assets and resources.</p>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Asset Management
              </CardTitle>
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search assets by name, tag, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <div className="flex gap-2">
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
              </div>
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
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2">No Assets Found</h3>
              <p className="text-blue-200 mb-4">
                {searchTerm ? 'Try adjusting your search terms or filters.' : 'Get started by adding your first asset.'}
              </p>
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Asset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onEdit={handleEditAsset}
                onDelete={handleDeleteAsset}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetManagement;
