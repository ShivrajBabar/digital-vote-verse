
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from '@/components/Layout';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

const SuperadminResults = () => {
  const { toast } = useToast();
  const [selectedElection, setSelectedElection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Mock election data
  const elections = [
    { id: 1, name: "Lok Sabha Elections 2025" },
    { id: 2, name: "Vidhan Sabha Elections 2024" },
    { id: 3, name: "Municipal Elections 2024" }
  ];
  
  // Mock results data
  const [resultsData, setResultsData] = useState<ResultData[]>([
    {
      id: 1,
      electionId: 1,
      electionName: "Lok Sabha Elections 2025",
      constituency: "Mumbai North",
      published: false,
      winner: "Rajesh Kumar",
      totalVotes: 452760,
      candidates: [
        {
          id: 1,
          name: "Rajesh Kumar",
          party: "Democratic Party",
          votes: 203742,
          photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
          votePercentage: 45
        },
        {
          id: 2,
          name: "Priya Sharma",
          party: "Progressive Alliance",
          votes: 156803,
          photoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
          votePercentage: 34.6
        },
        {
          id: 3,
          name: "Amit Verma",
          party: "National Front",
          votes: 92215,
          photoUrl: "https://randomuser.me/api/portraits/men/67.jpg",
          votePercentage: 20.4
        }
      ]
    },
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
    },
    {
      id: 3,
      electionId: 2,
      electionName: "Vidhan Sabha Elections 2024",
      constituency: "Mumbai South",
      published: false,
      winner: "Rahul Mehta",
      totalVotes: 276543,
      candidates: [
        {
          id: 7,
          name: "Rahul Mehta",
          party: "Democratic Party",
          votes: 143802,
          photoUrl: "https://randomuser.me/api/portraits/men/36.jpg",
          votePercentage: 52
        },
        {
          id: 8,
          name: "Alisha Khan",
          party: "Progressive Alliance",
          votes: 132741,
          photoUrl: "https://randomuser.me/api/portraits/women/65.jpg",
          votePercentage: 48
        }
      ]
    }
  ]);

  // Filter results based on selected election and search query
  const filteredResults = resultsData.filter(result => {
    const matchesElection = selectedElection === 'all' || result.electionName === selectedElection;
    const matchesSearch = searchQuery === '' || 
      result.constituency.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesElection && matchesSearch;
  });

  // Toggle result publication status
  const togglePublishStatus = (resultId: number) => {
    setResultsData(prevData => 
      prevData.map(result => 
        result.id === resultId 
          ? { ...result, published: !result.published } 
          : result
      )
    );
    
    const result = resultsData.find(r => r.id === resultId);
    const newStatus = result ? !result.published : false;
    
    toast({
      title: newStatus ? "Result Published" : "Result Unpublished",
      description: `Election results for ${result?.constituency} are now ${newStatus ? 'visible' : 'hidden'} to voters`,
    });
  };

  // Toggle expansion of candidate details
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const toggleExpand = (resultId: number) => {
    setExpandedResult(expandedResult === resultId ? null : resultId);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold">Election Results</h1>
          <Button
            onClick={() => {
              toast({
                title: "All Results Exported",
                description: "Election results have been exported to CSV",
              });
            }}
          >
            Export All Results
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by constituency..."
              className="pl-10 pr-4 py-2 border rounded-md w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
        </div>

        <div className="space-y-4">
          {filteredResults.map((result) => (
            <Card key={result.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">{result.constituency}</CardTitle>
                    <p className="text-sm text-gray-500">{result.electionName}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`publish-${result.id}`}>
                        {result.published ? "Published" : "Unpublished"}
                      </Label>
                      <Switch 
                        id={`publish-${result.id}`} 
                        checked={result.published}
                        onCheckedChange={() => togglePublishStatus(result.id)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(result.id)}
                    >
                      {expandedResult === result.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="mb-2">
                  <div className="flex justify-between text-sm">
                    <span>Winner: <span className="font-medium">{result.winner}</span></span>
                    <span>Total Votes: <span className="font-medium">{result.totalVotes.toLocaleString()}</span></span>
                  </div>
                </div>
                
                {expandedResult === result.id && (
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
                )}
                
                {!expandedResult || expandedResult !== result.id ? (
                  <div className="relative pt-2">
                    <div className="flex space-x-1">
                      {result.candidates.map((candidate) => (
                        <div 
                          key={candidate.id}
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${candidate.votePercentage}%`,
                            backgroundColor: candidate.party === 'Democratic Party' ? '#3b82f6' : 
                              candidate.party === 'Progressive Alliance' ? '#ef4444' : '#10b981'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}

          {filteredResults.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No results found for the selected filters
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SuperadminResults;
