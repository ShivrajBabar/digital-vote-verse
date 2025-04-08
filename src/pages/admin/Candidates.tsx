
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from '@/components/Layout';
import { Search, Eye, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const AdminCandidates = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Mock candidates data for admin's constituency
  const candidates = [
    { 
      id: 1, 
      name: 'Rajesh Kumar', 
      party: 'Democratic Party', 
      symbol: '🌸 Flower',
      election: 'Lok Sabha Elections 2025',
      status: 'Approved'
    },
    { 
      id: 2, 
      name: 'Priya Sharma', 
      party: 'Progressive Alliance', 
      symbol: '🌿 Leaf',
      election: 'Lok Sabha Elections 2025',
      status: 'Approved'
    },
    { 
      id: 3, 
      name: 'Amit Singh', 
      party: 'National Front', 
      symbol: '🌞 Sun',
      election: 'Municipal Corporation Elections',
      status: 'Pending'
    },
    { 
      id: 4, 
      name: 'Kavita Patel', 
      party: 'People\'s Party', 
      symbol: '🏵️ Rosette',
      election: 'Lok Sabha Elections 2025',
      status: 'Approved'
    }
  ];

  const handleViewCandidate = (id: number) => {
    toast({
      title: "View Candidate",
      description: `Viewing candidate with ID: ${id}`,
    });
  };

  const handleDownloadCandidateList = () => {
    toast({
      title: "Download Initiated",
      description: "Candidate list download started.",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold">Candidates</h1>
            <p className="text-gray-500">Candidates in {user?.constituency || 'your constituency'}</p>
          </div>
          <Button variant="outline" onClick={handleDownloadCandidateList}>
            <Download className="h-4 w-4 mr-2" /> Download List
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
            <option value="municipal">Municipal Corporation Elections</option>
          </select>
          <select className="border rounded-md px-4 py-2">
            <option value="">All Parties</option>
            <option value="democratic">Democratic Party</option>
            <option value="progressive">Progressive Alliance</option>
            <option value="national">National Front</option>
          </select>
        </div>

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Candidates</CardTitle>
            <CardDescription>Candidates registered for elections in your constituency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Party</th>
                    <th className="px-4 py-3 text-left">Symbol</th>
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
                      <td className="px-4 py-3">{candidate.symbol}</td>
                      <td className="px-4 py-3">{candidate.election}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${candidate.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {candidate.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewCandidate(candidate.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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

export default AdminCandidates;
