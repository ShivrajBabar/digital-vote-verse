
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from '@/components/Layout';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const SuperadminCandidates = () => {
  const { toast } = useToast();

  // Mock candidates data
  const candidates = [
    { 
      id: 1, 
      name: 'Rajesh Kumar', 
      party: 'Democratic Party', 
      constituency: 'Mumbai North', 
      election: 'Lok Sabha Elections 2025',
      status: 'Approved'
    },
    { 
      id: 2, 
      name: 'Priya Sharma', 
      party: 'Progressive Alliance', 
      constituency: 'Delhi East', 
      election: 'Lok Sabha Elections 2025',
      status: 'Pending'
    },
    { 
      id: 3, 
      name: 'Ahmed Khan', 
      party: 'National Front', 
      constituency: 'Bangalore Central', 
      election: 'Vidhan Sabha Elections 2024',
      status: 'Approved'
    },
    { 
      id: 4, 
      name: 'Sunita Patel', 
      party: 'People\'s Party', 
      constituency: 'Chennai South', 
      election: 'Lok Sabha Elections 2025',
      status: 'Rejected'
    }
  ];

  const handleRegisterCandidate = () => {
    toast({
      title: "Feature in development",
      description: "Candidate registration form will be implemented soon.",
    });
  };

  const handleEditCandidate = (id: number) => {
    toast({
      title: "Edit Candidate",
      description: `Editing candidate with ID: ${id}`,
    });
  };

  const handleDeleteCandidate = (id: number) => {
    toast({
      title: "Delete Candidate",
      description: `Deleting candidate with ID: ${id}`,
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold">Candidate Management</h1>
          <Button onClick={handleRegisterCandidate}>
            <Plus className="h-4 w-4 mr-2" /> Register New Candidate
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              className="pl-10 pr-4 py-2 border rounded-md w-full"
            />
          </div>
          <select className="border rounded-md px-4 py-2">
            <option value="">All Elections</option>
            <option value="lok-sabha">Lok Sabha Elections</option>
            <option value="vidhan-sabha">Vidhan Sabha Elections</option>
          </select>
          <select className="border rounded-md px-4 py-2">
            <option value="">All States</option>
            <option value="maharashtra">Maharashtra</option>
            <option value="delhi">Delhi</option>
            <option value="karnataka">Karnataka</option>
          </select>
        </div>

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Candidates</CardTitle>
            <CardDescription>Manage election candidates across all constituencies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Party</th>
                    <th className="px-4 py-3 text-left">Constituency</th>
                    <th className="px-4 py-3 text-left">Election</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.id} className="border-b">
                      <td className="px-4 py-3">{candidate.id}</td>
                      <td className="px-4 py-3 font-medium">{candidate.name}</td>
                      <td className="px-4 py-3">{candidate.party}</td>
                      <td className="px-4 py-3">{candidate.constituency}</td>
                      <td className="px-4 py-3">{candidate.election}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${candidate.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                          candidate.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                          {candidate.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditCandidate(candidate.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteCandidate(candidate.id)}
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

export default SuperadminCandidates;
