
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Monitor, Server, Cloud, Package, MapPin, User, Calendar } from "lucide-react";
import { Asset } from "@/services/assetManagementService";
import { format } from "date-fns";

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onViewDetails?: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
}

const getAssetIcon = (type: string) => {
  switch (type) {
    case 'hardware':
      return <Monitor className="h-6 w-6" />;
    case 'software':
      return <Package className="h-6 w-6" />;
    case 'virtual':
      return <Server className="h-6 w-6" />;
    case 'cloud_service':
      return <Cloud className="h-6 w-6" />;
    default:
      return <Monitor className="h-6 w-6" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    case 'retired':
      return 'bg-red-100 text-red-800';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onEdit,
  onViewDetails,
  onDelete
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getAssetIcon(asset.asset_type)}
            <div>
              <CardTitle className="text-lg">{asset.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getStatusColor(asset.status)}>
                  {asset.status}
                </Badge>
                <Badge variant="outline">
                  {asset.asset_type.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div className="font-mono">{asset.asset_tag}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Category:</span>
              <div className="font-medium">{asset.category}</div>
            </div>
            {asset.manufacturer && (
              <div>
                <span className="text-gray-500">Manufacturer:</span>
                <div className="font-medium">{asset.manufacturer}</div>
              </div>
            )}
          </div>

          {asset.location && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{asset.location}</span>
            </div>
          )}

          {asset.purchase_date && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Purchased: {format(new Date(asset.purchase_date), 'MMM d, yyyy')}</span>
            </div>
          )}

          {asset.cost && (
            <div className="text-sm">
              <span className="text-gray-500">Cost:</span>
              <span className="font-medium ml-1">${asset.cost.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t">
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(asset)}
              >
                View Details
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                size="sm"
                onClick={() => onEdit(asset)}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(asset.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
