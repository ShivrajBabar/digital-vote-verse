
import React, { useState, useEffect } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { ResultService } from '@/api/apiService';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface CandidateResult {
  id: number;
  candidate_id: number;
  name: string;
  party: string;
  votes: number;
  photoUrl: string;
  votePercentage: number;
}

interface ResultData {
  id: number;
  election_id: number;
  election_name: string;
  constituency_name: string;
  winner_id: number;
  winner_name: string;
  winner_party: string;
  winner_photo: string;
  total_votes: number;
  published: boolean;
  candidates: CandidateResult[];
}

const VoterResults = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedElection, setSelectedElection] = useState<string>('all');
  
  // Fetch elections for the dropdown
  const { data: elections, isLoading: electionsLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: async () => {
      try {
        // Only fetch completed elections
        const response = await fetch('/api/elections?status=Completed');
        if (!response.ok) throw new Error('Failed to fetch elections');
        return await response.json();
      } catch (error) {
        console.error('Error fetching elections:', error);
        return [];
      }
    }
  });
  
  // Fetch published results
  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['results', selectedElection],
    queryFn: async () => {
      try {
        const filters: any = { published: true };
        if (selectedElection !== 'all') {
          const electionId = parseInt(selectedElection);
          if (!isNaN(electionId)) {
            filters.election_id = electionId;
          }
        }
        
        const data = await ResultService.getAllResults(filters);
        return data || [];
      } catch (error) {
        console.error('Error fetching results:', error);
        toast({
          title: "Error",
          description: "Failed to load election results",
          variant: "destructive"
        });
        return [];
      }
    }
  });
  
  // Format election options for the dropdown
  const electionOptions = elections?.map((election: any) => ({
    id: election.id,
    name: election.name
  })) || [];
  
  // Display loading state
  if (resultsLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Election Results</h1>
            <p className="text-gray-500">View published election results</p>
          </div>
          
          <div className="w-full sm:w-64">
            <Skeleton className="h-10" />
          </div>
          
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="bg-gray-50 pb-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="pt-4">
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }
  
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
              {electionOptions.map((election: any) => (
                <SelectItem key={election.id} value={election.id.toString()}>{election.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {results && results.length > 0 ? (
            results.map((result: ResultData) => (
              <Card key={result.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 pb-2">
                  <div>
                    <CardTitle className="text-lg">{result.constituency_name}</CardTitle>
                    <p className="text-sm text-gray-500">{result.election_name}</p>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Winner: <span className="font-medium">{result.winner_name}</span></span>
                      <span>Total Votes: <span className="font-medium">{result.total_votes.toLocaleString()}</span></span>
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
                                  src={candidate.photoUrl || "/placeholder.svg"} 
                                  alt={candidate.name}
                                  className="h-full w-full object-cover" 
                                />
                              </div>
                              <div>{candidate.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{candidate.party}</TableCell>
                          <TableCell>{candidate.votes.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{candidate.votePercentage.toFixed(1)}%</TableCell>
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
                            backgroundColor: getPartyColor(candidate.party)
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      {result.candidates.map((candidate) => (
                        <div key={candidate.id} style={{ width: `${candidate.votePercentage}%` }}>
                          {candidate.votePercentage > 10 && (
                            <div className="text-center font-medium">{candidate.votePercentage.toFixed(1)}%</div>
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

// Helper function to get a color based on party name
function getPartyColor(partyName: string): string {
  // Create a simple hash of the party name to generate a consistent color
  let hash = 0;
  for (let i = 0; i < partyName.length; i++) {
    hash = partyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to a hue value (0-360)
  const hue = hash % 360;
  
  // Use HSL to generate colors with consistent saturation and lightness
  return `hsl(${hue}, 70%, 50%)`;
}

export default VoterResults;
