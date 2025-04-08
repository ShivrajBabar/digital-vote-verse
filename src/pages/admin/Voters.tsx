
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from '@/components/Layout';
import { UserPlus, Search, Edit, Trash2, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';

const AdminVoters = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock voters data
  const voters = [
    { 
      id: 1, 
      name: "Aditya Sharma", 
      voter_id: "MH0123456789", 
      phone: "9876543210", 
      booth: "Booth #123, Municipal School",
      status: "Verified"
    },
    { 
      id: 2, 
      name: "Priya Patel", 
      voter_id: "MH0987654321", 
      phone: "9876543211", 
      booth: "Booth #145, Community Hall",
      status: "Verified"
    },
    { 
      id: 3, 
      name: "Rahul Gupta", 
      voter_id: "MH0192837465", 
      phone: "9876543212", 
      booth: "Booth #123, Municipal School",
      status: "Pending"
    },
    { 
      id: 4, 
      name: "Sneha Desai", 
      voter_id: "MH0246813579", 
      phone: "9876543213", 
      booth: "Booth #127, Public School",
      status: "Verified"
    },
    { 
      id: 5, 
      name: "Vikram Singh", 
      voter_id: "MH0135792468", 
      phone: "9876543214", 
      booth: "Booth #145, Community Hall",
      status: "Pending"
    }
  ];

  const handleEditVoter = (id: number) => {
    navigate(`/admin/voters/edit/${id}`);
  };

  const handleDeleteVoter = (id: number) => {
    toast({
      title: "Delete Voter",
      description: `Deleting voter with ID: ${id}`,
    });
  };

  const handleSendCredentials = (id: number) => {
    toast({
      title: "Credentials Sent",
      description: `Login credentials have been sent to voter with ID: ${id}`,
    });
  };

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
            />
          </div>
          <select className="border rounded-md px-4 py-2">
            <option value="">All Booths</option>
            <option value="booth-123">Booth #123</option>
            <option value="booth-145">Booth #145</option>
            <option value="booth-127">Booth #127</option>
          </select>
          <select className="border rounded-md px-4 py-2">
            <option value="">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
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
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Voter ID</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Booth</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map((voter) => (
                    <tr key={voter.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{voter.name}</td>
                      <td className="px-6 py-4">{voter.voter_id}</td>
                      <td className="px-6 py-4">{voter.phone}</td>
                      <td className="px-6 py-4">{voter.booth}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${voter.status === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {voter.status}
                        </span>
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

export default AdminVoters;
