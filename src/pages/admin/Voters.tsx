
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from '@/components/Layout';
import { Plus, Search, Edit, Trash2, UserPlus, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const AdminVoters = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Mock voters data
  const voters = [
    { 
      id: 1, 
      name: 'Aditya Sharma', 
      voterId: 'MH0123456789',
      email: 'aditya@example.com',
      phone: '+91 98765 43210',
      booth: 'Booth #123, Municipal School',
      status: 'Verified'
    },
    { 
      id: 2, 
      name: 'Sneha Patel', 
      voterId: 'MH0987654321',
      email: 'sneha@example.com',
      phone: '+91 87654 32109',
      booth: 'Booth #145, Community Hall',
      status: 'Verified'
    },
    { 
      id: 3, 
      name: 'Rajesh Kumar', 
      voterId: 'MH0192837465',
      email: 'rajesh@example.com',
      phone: '+91 76543 21098',
      booth: 'Booth #127, Public School',
      status: 'Pending'
    },
    { 
      id: 4, 
      name: 'Priya Gupta', 
      voterId: 'MH0246813579',
      email: 'priya@example.com',
      phone: '+91 65432 10987',
      booth: 'Booth #123, Municipal School',
      status: 'Verified'
    }
  ];

  const handleRegisterVoter = () => {
    toast({
      title: "Feature in development",
      description: "Voter registration form will be implemented soon.",
    });
  };

  const handleEditVoter = (id: number) => {
    toast({
      title: "Edit Voter",
      description: `Editing voter with ID: ${id}`,
    });
  };

  const handleDeleteVoter = (id: number) => {
    toast({
      title: "Delete Voter",
      description: `Deleting voter with ID: ${id}`,
    });
  };

  const handleDownloadVoterList = () => {
    toast({
      title: "Download Initiated",
      description: "Voter list download started.",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold">Voter Management</h1>
            <p className="text-gray-500">Managing voters for {user?.constituency || 'your constituency'}</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={handleRegisterVoter}>
              <UserPlus className="h-4 w-4 mr-2" /> Register New Voter
            </Button>
            <Button variant="outline" onClick={handleDownloadVoterList}>
              <Download className="h-4 w-4 mr-2" /> Download List
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search voters by name, ID, or phone..."
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
            <option value="">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Voters Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Voters</CardTitle>
            <CardDescription>Manage voters in your assigned constituency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Voter ID</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">Booth</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map((voter) => (
                    <tr key={voter.id} className="border-b">
                      <td className="px-4 py-3">{voter.id}</td>
                      <td className="px-4 py-3 font-medium">{voter.name}</td>
                      <td className="px-4 py-3">{voter.voterId}</td>
                      <td className="px-4 py-3">{voter.email}</td>
                      <td className="px-4 py-3">{voter.phone}</td>
                      <td className="px-4 py-3">{voter.booth}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${voter.status === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {voter.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditVoter(voter.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteVoter(voter.id)}
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

export default AdminVoters;
