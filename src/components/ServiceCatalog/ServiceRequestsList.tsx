
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User } from "lucide-react";
import { ServiceRequest } from "@/services/serviceCatalogService";
import { format } from "date-fns";

interface ServiceRequestsListProps {
  requests: ServiceRequest[];
  onUpdateStatus?: (id: string, status: string) => void;
  isAdmin?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'submitted':
      return 'bg-blue-100 text-blue-800';
    case 'pending_approval':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-purple-100 text-purple-800';
    case 'fulfilled':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const ServiceRequestsList: React.FC<ServiceRequestsListProps> = ({
  requests,
  onUpdateStatus,
  isAdmin = false
}) => {
  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{request.title}</CardTitle>
              <div className="flex space-x-2">
                <Badge className={getPriorityColor(request.priority)}>
                  {request.priority}
                </Badge>
                <Badge className={getStatusColor(request.status)}>
                  {request.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-600">{request.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Created: {format(new Date(request.created_at), 'PPp')}</span>
                  </div>
                  {request.sla_due_date && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Due: {format(new Date(request.sla_due_date), 'PPp')}</span>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && onUpdateStatus && (
                <div className="flex space-x-2 pt-3 border-t">
                  {request.status === 'submitted' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onUpdateStatus(request.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateStatus(request.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {request.status === 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => onUpdateStatus(request.id, 'in_progress')}
                    >
                      Start Work
                    </Button>
                  )}
                  {request.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => onUpdateStatus(request.id, 'fulfilled')}
                    >
                      Mark Fulfilled
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
