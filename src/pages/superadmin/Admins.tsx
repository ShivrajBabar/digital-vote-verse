
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from '@/components/Layout';
import { UserPlus, Search, Edit, Trash2, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';

const SuperadminAdmins = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock admins data
  const admins = [
    { 
      id: 1, 
      name: "Vikram Singh", 
      email: "vikram@example.com", 
      phone: "9876543210", 
      constituency: "Mumbai North",
      status: "Active"
    },
    { 
      id: 2, 
      name: "Shreya Patel", 
      email: "shreya@example.com", 
      phone: "9876543211", 
      constituency: "Mumbai South",
      status: "Active"
    },
    { 
      id: 3, 
      name: "Ramesh Gupta", 
      email: "ramesh@example.com", 
      phone: "9876543212", 
      constituency: "Delhi East",
      status: "Inactive"
    },
    { 
      id: 4, 
      name: "Anjali Desai", 
      email: "anjali@example.com", 
      phone: "9876543213", 
      constituency: "Bangalore Central",
      status: "Active"
    },
    { 
      id: 5, 
      name: "Rahul Mehta", 
      email: "rahul@example.com", 
      phone: "9876543214", 
      constituency: "Chennai South",
      status: "Pending"
    }
  ];

  const handleEditAdmin = (id: number) => {
    navigate(`/superadmin/admins/edit/${id}`);
  };

  const handleDeleteAdmin = (id: number) => {
    toast({
      title: "Delete Admin",
      description: `Deleting admin with ID: ${id}`,
    });
  };

  const handleSendCredentials = (id: number) => {
    toast({
      title: "Credentials Sent",
      description: `Login credentials have been sent to admin with ID: ${id}`,
    });
  };

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
              placeholder="Search admins..."
              className="pl-10 pr-4 py-2 border rounded-md w-full"
            />
          </div>
          <select className="border rounded-md px-4 py-2">
            <option value="">All Constituencies</option>
            <option value="mumbai-north">Mumbai North</option>
            <option value="delhi-east">Delhi East</option>
            <option value="bangalore-central">Bangalore Central</option>
          </select>
          <select className="border rounded-md px-4 py-2">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Admins Table */}
        <Card>
          <CardHeader>
            <CardTitle>Constituency Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Constituency</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{admin.name}</td>
                      <td className="px-6 py-4">{admin.email}</td>
                      <td className="px-6 py-4">{admin.phone}</td>
                      <td className="px-6 py-4">{admin.constituency}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${admin.status === 'Active' ? 'bg-green-100 text-green-800' : 
                          admin.status === 'Inactive' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                          {admin.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditAdmin(admin.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleSendCredentials(admin.id)}>
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAdmin(admin.id)}>
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
