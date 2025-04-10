
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from '@/components/Layout';
import { Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ResultData {
  id: number;
  electionId: number;
  electionName: string;
  constituency: string;
  candidates: CandidateResult[];
  published: boolean;
  winner: string;
  totalVotes: number;
}

interface CandidateResult {
  id: number;
  name: string;
  party: string;
  votes: number;
  photoUrl: string;
  votePercentage: number;
}

const VoterResults = () => {
  const { user } = useAuth();
  const [selectedElection, setSelectedElection] = useState<string>('all');
  
  // Mock election data
  const elections = [
    { id: 1, name: "Lok Sabha Elections 2025" },
    { id: 2, name: "Vidhan Sabha Elections 2024" },
    { id: 3, name: "Municipal Elections 2024" }
  ];
  
  // Mock results data (only published results are visible)
  const resultsData: ResultData[] = [
    {
      id: 2,
      electionId: 1,
      electionName: "Lok Sabha Elections 2025",
      constituency: "Delhi East",
      published: true,
      winner: "Kavita Desai",
      totalVotes: 387456,
      candidates: [
        {
          id: 4,
          name: "Kavita Desai",
          party: "People's Party",
          votes: 187320,
          photoUrl: "https://randomuser.me/api/portraits/women/22.jpg",
          votePercentage: 48.3
        },
        {
          id: 5,
          name: "Prakash Joshi",
          party: "Democratic Party",
          votes: 165206,
          photoUrl: "https://randomuser.me/api/portraits/men/45.jpg",
          votePercentage: 42.6
        },
        {
          id: 6,
          name: "Sonia Singh",
          party: "Progressive Alliance",
          votes: 34930,
          photoUrl: "https://randomuser.me/api/portraits/women/68.jpg",
          votePercentage: 9.1
        }
      ]
    }
  ];

  // Filter results based on selected election
  const filteredResults = resultsData.filter(result => 
    selectedElection === 'all' || result.electionName === selectedElection
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold">Election Results</h1>
            <p className="text-gray-500">View published election results</p>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <Select value={selectedElection} onValueChange={setSelectedElection}>
            <SelectTrigger>
              <SelectValue placeholder="All Elections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Elections</SelectItem>
              {elections.map((election) => (
                <SelectItem key={election.id} value={election.name}>{election.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredResults.length > 0 ? (
            filteredResults.map((result) => (
              <Card key={result.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 pb-2">
                  <div>
                    <CardTitle className="text-lg">{result.constituency}</CardTitle>
                    <p className="text-sm text-gray-500">{result.electionName}</p>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Winner: <span className="font-medium">{result.winner}</span></span>
                      <span>Total Votes: <span className="font-medium">{result.totalVotes.toLocaleString()}</span></span>
                    </div>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.candidates.map((candidate) => (
                        <TableRow key={candidate.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full overflow-hidden">
                                <img 
                                  src={candidate.photoUrl} 
                                  alt={candidate.name}
                                  className="h-full w-full object-cover" 
                                />
                              </div>
                              <div>{candidate.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{candidate.party}</TableCell>
                          <TableCell>{candidate.votes.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{candidate.votePercentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="relative pt-4">
                    <div className="flex space-x-1">
                      {result.candidates.map((candidate) => (
                        <div 
                          key={candidate.id}
                          className="h-4 rounded-full" 
                          style={{ 
                            width: `${candidate.votePercentage}%`,
                            backgroundColor: candidate.party === 'Democratic Party' ? '#3b82f6' : 
                              candidate.party === 'Progressive Alliance' ? '#ef4444' : '#10b981'
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      {result.candidates.map((candidate) => (
                        <div key={candidate.id} style={{ width: `${candidate.votePercentage}%` }}>
                          {candidate.votePercentage > 10 && (
                            <div className="text-center font-medium">{candidate.votePercentage}%</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <p className="mb-2">No published results are available yet</p>
                  <p>Results will be displayed here once they are published by the Election Commission</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VoterResults;
