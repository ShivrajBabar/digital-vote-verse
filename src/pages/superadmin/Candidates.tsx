
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from '@/components/Layout';
import { UserPlus, Search, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';

const SuperadminCandidates = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock candidates data
  const candidates = [
    { 
      id: 1, 
      name: "Rajesh Kumar", 
      party: "Democratic Party", 
      age: 45, 
      constituency: "Mumbai North",
      election: "Lok Sabha Elections 2025",
      status: "Approved"
    },
    { 
      id: 2, 
      name: "Sonia Singh", 
      party: "Progressive Alliance", 
      age: 42, 
      constituency: "Delhi East",
      election: "Lok Sabha Elections 2025",
      status: "Pending"
    },
    { 
      id: 3, 
      name: "Amit Verma", 
      party: "National Front", 
      age: 52, 
      constituency: "Bangalore Central",
      election: "Vidhan Sabha Elections 2024",
      status: "Approved"
    },
    { 
      id: 4, 
      name: "Kavita Desai", 
      party: "People's Party", 
      age: 39, 
      constituency: "Chennai South",
      election: "Municipal Elections 2024",
      status: "Rejected"
    },
    { 
      id: 5, 
      name: "Prakash Joshi", 
      party: "Democratic Party", 
      age: 47, 
      constituency: "Mumbai South",
      election: "Lok Sabha Elections 2025",
      status: "Pending"
    }
  ];

  const handleEditCandidate = (id: number) => {
    navigate(`/superadmin/candidates/edit/${id}`);
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
          <Button asChild>
            <Link to="/superadmin/candidates/register">
              <UserPlus className="h-4 w-4 mr-2" /> Register Candidate
            </Link>
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
            <option value="municipal">Municipal Elections</option>
          </select>
          <select className="border rounded-md px-4 py-2">
            <option value="">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Election Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Party</th>
                    <th className="px-6 py-3">Age</th>
                    <th className="px-6 py-3">Constituency</th>
                    <th className="px-6 py-3">Election</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{candidate.name}</td>
                      <td className="px-6 py-4">{candidate.party}</td>
                      <td className="px-6 py-4">{candidate.age}</td>
                      <td className="px-6 py-4">{candidate.constituency}</td>
                      <td className="px-6 py-4">{candidate.election}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${candidate.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                          candidate.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                          {candidate.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditCandidate(candidate.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCandidate(candidate.id)}>
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
