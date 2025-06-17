import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, MessageSquare, Clock, AlertCircle, X } from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  category: string;
  user_id: string;
  createdAt: string;
  updatedAt?: string;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  type: 'comment' | 'status_change' | 'assignment';
}

interface IncidentDetailsProps {
  incident: Incident;
  onClose: () => void;
  onStatusUpdate?: (incidentId: string, newStatus: string) => void;
}

const IncidentDetails = ({ incident, onClose, onStatusUpdate }: IncidentDetailsProps) => {
  const [newComment, setNewComment] = useState('');
  const [comments] = useState<Comment[]>([
    {
      id: '1',
      author: 'John Doe',
      content: 'Initial diagnosis completed. Investigating root cause.',
      timestamp: '2024-01-15T10:45:00Z',
      type: 'comment'
    },
    {
      id: '2',
      author: 'System',
      content: 'Status changed from Open to In Progress',
      timestamp: '2024-01-15T11:00:00Z',
      type: 'status_change'
    }
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-purple-100 text-purple-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleStatusChange = (newStatus: string) => {
    onStatusUpdate?.(incident.id, newStatus);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      console.log('Adding comment:', newComment);
      setNewComment('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Incident #{incident.id} - {incident.title}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status and Priority */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge className={getStatusColor(incident.status)}>
                {incident.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Priority:</span>
              <Badge className={getPriorityColor(incident.priority)}>
                {incident.priority.charAt(0).toUpperCase() + incident.priority.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Category:</span>
              <Badge variant="outline">{incident.category}</Badge>
            </div>
          </div>

          {/* Incident Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {incident.description}
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Created: {formatDate(incident.createdAt)}</span>
              </div>
              
              {incident.updatedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Updated: {formatDate(incident.updatedAt)}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Assignment</h3>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{incident.assignee}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <Select onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Change Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" className="w-full">
                    Reassign Incident
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Comments Section */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Activity & Comments
            </h3>
            
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-sm">{comment.author}</span>
                      {comment.type !== 'comment' && (
                        <Badge variant="outline" className="text-xs">
                          {comment.type.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{comment.content}</p>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                Add Comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentDetails;
