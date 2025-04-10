
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from '@/components/Layout';
import { UserPlus, Search, Edit, Trash2, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService } from '@/api/apiService';

const AdminVoters = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBooth, setFilterBooth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  
  // Fetch voters using React Query
  const { data: voters = [], isLoading, error } = useQuery({
    queryKey: ['voters'],
    queryFn: async () => {
      try {
        const response = await UserService.getAllUsers('voter');
        return response || [];
      } catch (error) {
        console.error('Error fetching voters:', error);
        throw error;
      }
    }
  });
  
  // Update voter status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return await UserService.updateUserStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters'] });
    }
  });
  
  // Delete voter mutation
  const deleteVoterMutation = useMutation({
    mutationFn: async (id: string) => {
      return await UserService.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters'] });
    }
  });

  // Get unique booth options from voters data
  const boothOptions = [...new Set(voters.map((voter: any) => voter.booth || ''))].filter(Boolean);

  const handleEditVoter = (id: string) => {
    navigate(`/admin/voters/edit/${id}`);
  };

  const handleDeleteVoter = (id: string) => {
    if (window.confirm('Are you sure you want to delete this voter?')) {
      deleteVoterMutation.mutate(id);
      toast({
        title: "Voter Deleted",
        description: `Voter has been deleted successfully.`,
      });
    }
  };

  const handleSendCredentials = (id: string) => {
    toast({
      title: "Credentials Sent",
      description: `Login credentials have been sent to the voter.`,
    });
  };

  // Function to update voter status
  const updateVoterStatus = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
    toast({
      title: "Status Updated",
      description: `Voter status changed to ${newStatus}`,
    });
  };

  // Sort function
  const requestSort = (key: string) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort voters
  const filteredVoters = React.useMemo(() => {
    let filtered = [...voters];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((voter: any) => 
        voter.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.voter_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply booth filter
    if (filterBooth) {
      filtered = filtered.filter((voter: any) => voter.booth === filterBooth);
    }
    
    // Apply status filter
    if (filterStatus) {
      filtered = filtered.filter((voter: any) => voter.status === filterStatus);
    }
    
    // Apply sorting
    filtered.sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    
    return filtered;
  }, [voters, searchTerm, filterBooth, filterStatus, sortConfig]);

  if (error) {
    return (
      <Layout>
        <div className="p-4 bg-red-50 text-red-500 rounded-md">
          Error loading voters data. Please try again later.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold">Voter Management</h1>
          <Button asChild>
            <Link to="/admin/voters/register">
              <UserPlus className="h-4 w-4 mr-2" /> Register Voter
            </Link>
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search voters by name or ID..."
              className="pl-10 pr-4 py-2 border rounded-md w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="border rounded-md px-4 py-2"
            value={filterBooth}
            onChange={(e) => setFilterBooth(e.target.value)}
          >
            <option value="">All Booths</option>
            {boothOptions.map((booth) => (
              <option key={booth} value={booth}>{booth}</option>
            ))}
          </select>
          <select 
            className="border rounded-md px-4 py-2"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Voters Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Voters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('name')}
                    >
                      Name {sortConfig.key === 'name' && (
                        <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('voter_id')}
                    >
                      Voter ID {sortConfig.key === 'voter_id' && (
                        <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('phone')}
                    >
                      Phone {sortConfig.key === 'phone' && (
                        <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('booth')}
                    >
                      Booth {sortConfig.key === 'booth' && (
                        <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('status')}
                    >
                      Status {sortConfig.key === 'status' && (
                        <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center">Loading voters...</td>
                    </tr>
                  ) : filteredVoters.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center">No voters found</td>
                    </tr>
                  ) : (
                    filteredVoters.map((voter: any) => (
                      <tr key={voter.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{voter.name}</td>
                        <td className="px-6 py-4">{voter.voter_id}</td>
                        <td className="px-6 py-4">{voter.phone}</td>
                        <td className="px-6 py-4">{voter.booth || 'Not assigned'}</td>
                        <td className="px-6 py-4">
                          <Popover>
                            <PopoverTrigger asChild>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer
                                ${voter.status === 'Active' ? 'bg-green-100 text-green-800' : 
                                  voter.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'}`}>
                                {voter.status}
                              </span>
                            </PopoverTrigger>
                            <PopoverContent className="w-56">
                              <div className="space-y-4">
                                <h4 className="font-medium">Update Status</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label htmlFor={`active-${voter.id}`}>Active</Label>
                                    <Switch 
                                      id={`active-${voter.id}`} 
                                      checked={voter.status === 'Active'}
                                      onCheckedChange={() => updateVoterStatus(voter.id, 'Active')}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Label htmlFor={`pending-${voter.id}`}>Pending</Label>
                                    <Switch 
                                      id={`pending-${voter.id}`} 
                                      checked={voter.status === 'Pending'}
                                      onCheckedChange={() => updateVoterStatus(voter.id, 'Pending')}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Label htmlFor={`inactive-${voter.id}`}>Inactive</Label>
                                    <Switch 
                                      id={`inactive-${voter.id}`} 
                                      checked={voter.status === 'Inactive'}
                                      onCheckedChange={() => updateVoterStatus(voter.id, 'Inactive')}
                                    />
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditVoter(voter.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleSendCredentials(voter.id)}>
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteVoter(voter.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminVoters;
