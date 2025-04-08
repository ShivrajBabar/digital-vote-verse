
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from '@/components/Layout';
import { Plus, Search, Edit, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const SuperadminAdmins = () => {
  const { toast } = useToast();

  // Mock admins data
  const admins = [
    { 
      id: 1, 
      name: 'Vikram Singh', 
      email: 'vikram@example.com',
      phone: '+91 98765 43210',
      state: 'Maharashtra',
      district: 'Mumbai',
      constituency: 'Mumbai North',
      status: 'Active'
    },
    { 
      id: 2, 
      name: 'Meera Patel', 
      email: 'meera@example.com',
      phone: '+91 87654 32109',
      state: 'Delhi',
      district: 'Delhi',
      constituency: 'Delhi East',
      status: 'Active'
    },
    { 
      id: 3, 
      name: 'Rahul Gupta', 
      email: 'rahul@example.com',
      phone: '+91 76543 21098',
      state: 'Karnataka',
      district: 'Bangalore',
      constituency: 'Bangalore Central',
      status: 'Inactive'
    },
    { 
      id: 4, 
      name: 'Ananya Desai', 
      email: 'ananya@example.com',
      phone: '+91 65432 10987',
      state: 'Tamil Nadu',
      district: 'Chennai',
      constituency: 'Chennai South',
      status: 'Active'
    }
  ];

  const handleAddAdmin = () => {
    toast({
      title: "Feature in development",
      description: "Admin registration form will be implemented soon.",
    });
  };

  const handleEditAdmin = (id: number) => {
    toast({
      title: "Edit Admin",
      description: `Editing admin with ID: ${id}`,
    });
  };

  const handleDeleteAdmin = (id: number) => {
    toast({
      title: "Delete Admin",
      description: `Deleting admin with ID: ${id}`,
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold">Admin Management</h1>
          <Button onClick={handleAddAdmin}>
            <UserPlus className="h-4 w-4 mr-2" /> Add New Admin
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search admins..."
              className="pl-10 pr-4 py-2 border rounded-md w-full"
            />
          </div>
          <select className="border rounded-md px-4 py-2">
            <option value="">All States</option>
            <option value="maharashtra">Maharashtra</option>
            <option value="delhi">Delhi</option>
            <option value="karnataka">Karnataka</option>
          </select>
          <select className="border rounded-md px-4 py-2">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Admins Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Admins</CardTitle>
            <CardDescription>Manage constituency admins across all states</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">Constituency</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b">
                      <td className="px-4 py-3">{admin.id}</td>
                      <td className="px-4 py-3 font-medium">{admin.name}</td>
                      <td className="px-4 py-3">{admin.email}</td>
                      <td className="px-4 py-3">{admin.phone}</td>
                      <td className="px-4 py-3">{admin.constituency}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${admin.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {admin.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditAdmin(admin.id)}
                          >
                            <Edit className="h-4 w-4" />
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
                  ))}
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
