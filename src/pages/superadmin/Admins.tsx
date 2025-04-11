
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from '@/components/Layout';
import { UserPlus, Search, Edit, Trash2, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService } from '@/api/apiService';

const SuperadminAdmins = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  
  // Fetch admins using React Query
  const { data: admins = [], isLoading, error } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      try {
        const response = await UserService.getAllUsers('admin');
        return response || [];
      } catch (error) {
        console.error('Error fetching admins:', error);
        throw error;
      }
    }
  });
  
  // Update admin status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return await UserService.updateUserStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast({
        title: "Status Updated",
        description: "Admin status has been updated successfully",
      });
    }
  });
  
  // Delete admin mutation
  const deleteAdminMutation = useMutation({
    mutationFn: async (id) => {
      return await UserService.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast({
        title: "Admin Deleted",
        description: "Admin has been deleted successfully",
      });
    }
  });
  
  // Get unique states from admins data
  const states = [...new Set(admins.map((admin) => admin.state || ''))].filter(Boolean);
  
  const handleDeleteAdmin = (id) => {
    if (window.confirm("Are you sure you want to delete this admin?")) {
      deleteAdminMutation.mutate(id);
    }
  };
  
  const handleSendCredentials = (email) => {
    toast({
      title: "Credentials Sent",
      description: `Login credentials have been sent to ${email}`,
    });
  };
  
  // Update admin status
  const updateAdminStatus = (id, newStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };
  
  // Sort function
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Filter and sort admins
  const filteredAdmins = React.useMemo(() => {
    let filtered = [...admins];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((admin) => 
        admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply state filter
    if (filterState) {
      filtered = filtered.filter((admin) => admin.state === filterState);
    }
    
    // Apply status filter
    if (filterStatus) {
      filtered = filtered.filter((admin) => admin.status === filterStatus);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    
    return filtered;
  }, [admins, searchTerm, filterState, filterStatus, sortConfig]);

  if (error) {
    return (
      <Layout>
        <div className="p-4 bg-red-50 text-red-500 rounded-md">
          Error loading admins data. Please try again later.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold">Admin Management</h1>
          <Button asChild>
            <Link to="/superadmin/admins/register">
              <UserPlus className="h-4 w-4 mr-2" /> Register Admin
            </Link>
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search admins by name or email..."
              className="pl-10 pr-4 py-2 border rounded-md w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="border rounded-md px-4 py-2"
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
          >
            <option value="">All States</option>
            {states.map((state) => (
              <option key={state} value={state}>{state}</option>
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

        {/* Admins Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Admins</CardTitle>
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
                      onClick={() => requestSort('email')}
                    >
                      Email {sortConfig.key === 'email' && (
                        <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('constituency_name')}
                    >
                      Constituency {sortConfig.key === 'constituency_name' && (
                        <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort('state')}
                    >
                      State {sortConfig.key === 'state' && (
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
                      <td colSpan={6} className="px-6 py-4 text-center">Loading admins...</td>
                    </tr>
                  ) : filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center">No admins found</td>
                    </tr>
                  ) : (
                    filteredAdmins.map((admin) => (
                      <tr key={admin.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{admin.name}</td>
                        <td className="px-6 py-4">{admin.email}</td>
                        <td className="px-6 py-4">{admin.constituency_name || 'Not assigned'}</td>
                        <td className="px-6 py-4">{admin.state || 'Not assigned'}</td>
                        <td className="px-6 py-4">
                          <Popover>
                            <PopoverTrigger asChild>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer
                                ${admin.status === 'Active' ? 'bg-green-100 text-green-800' : 
                                  admin.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'}`}>
                                {admin.status}
                              </span>
                            </PopoverTrigger>
                            <PopoverContent className="w-56">
                              <div className="space-y-4">
                                <h4 className="font-medium">Update Status</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label htmlFor={`active-${admin.id}`}>Active</Label>
                                    <Switch 
                                      id={`active-${admin.id}`} 
                                      checked={admin.status === 'Active'}
                                      onCheckedChange={() => updateAdminStatus(admin.id, 'Active')}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Label htmlFor={`pending-${admin.id}`}>Pending</Label>
                                    <Switch 
                                      id={`pending-${admin.id}`} 
                                      checked={admin.status === 'Pending'}
                                      onCheckedChange={() => updateAdminStatus(admin.id, 'Pending')}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <Label htmlFor={`inactive-${admin.id}`}>Inactive</Label>
                                    <Switch 
                                      id={`inactive-${admin.id}`} 
                                      checked={admin.status === 'Inactive'}
                                      onCheckedChange={() => updateAdminStatus(admin.id, 'Inactive')}
                                    />
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/superadmin/admins/edit/${admin.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleSendCredentials(admin.email)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteAdmin(admin.id)}
                            >
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

export default SuperadminAdmins;
