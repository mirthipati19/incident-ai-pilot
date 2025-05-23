
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Eye, Edit, User, Calendar, AlertCircle } from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
}

interface IncidentListProps {
  incidents?: Incident[];
  onIncidentSelect?: (incident: Incident) => void;
}

// Mock data for demonstration
const mockIncidents: Incident[] = [
  {
    id: '1',
    title: 'Email server not responding',
    description: 'Users unable to send or receive emails',
    status: 'Open',
    priority: 'high',
    assignee: 'John Doe',
    category: 'network',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    title: 'Password reset request',
    description: 'User needs password reset for domain account',
    status: 'In Progress',
    priority: 'medium',
    assignee: 'Jane Smith',
    category: 'access',
    createdAt: '2024-01-15T09:15:00Z'
  },
  {
    id: '3',
    title: 'Printer offline in Building A',
    description: 'Main printer in Building A conference room offline',
    status: 'Resolved',
    priority: 'low',
    assignee: 'Mike Wilson',
    category: 'hardware',
    createdAt: '2024-01-14T14:20:00Z'
  },
  {
    id: '4',
    title: 'Security breach detected',
    description: 'Unusual activity detected on network',
    status: 'Open',
    priority: 'critical',
    assignee: 'John Doe',
    category: 'security',
    createdAt: '2024-01-15T11:45:00Z'
  }
];

const IncidentList = ({ incidents = mockIncidents, onIncidentSelect }: IncidentListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           incident.assignee.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || incident.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [incidents, searchTerm, statusFilter, priorityFilter]);

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          Incident Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Incidents Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.map((incident) => (
                <TableRow key={incident.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">#{incident.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{incident.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {incident.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(incident.status)}>
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(incident.priority)}>
                      {incident.priority.charAt(0).toUpperCase() + incident.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{incident.assignee}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {formatDate(incident.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onIncidentSelect?.(incident)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredIncidents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No incidents found matching your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IncidentList;
