
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ResultService, ElectionService } from '@/api/apiService';
import { useToast } from '@/components/ui/use-toast';
import { useLocation } from 'react-router-dom';
import { Search, Download, Eye, CheckCircle, XCircle } from 'lucide-react';
import ResultCard from '@/components/voter/results/ResultCard';
import LoadingResults from '@/components/voter/results/LoadingResults';
import EmptyResults from '@/components/voter/results/EmptyResults';

const SuperadminResults = () => {
  const { toast } = useToast();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const electionFromUrl = queryParams.get('election');
  
  const [selectedElection, setSelectedElection] = useState(electionFromUrl || 'all');
  const [publishStatus, setPublishStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('results');
  
  const queryClient = useQueryClient();
  
  // Fetch elections for the filter dropdown
  const { data: elections = [], isLoading: electionsLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: async () => {
      try {
        const response = await ElectionService.getAllElections();
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching elections:', error);
        return [];
      }
    }
  });
  
  // Fetch results based on filters
  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ['all-results', selectedElection, publishStatus],
    queryFn: async () => {
      try {
        const filters = {};
        
        if (selectedElection !== 'all') {
          filters.election_id = selectedElection;
        }
        
        if (publishStatus !== 'all') {
          filters.published = publishStatus === 'published';
        }
        
        const response = await ResultService.getAllResults(filters);
        return Array.isArray(response) ? response : [];
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
  
  // Publish/Unpublish result mutation
  const publishMutation = useMutation({
    mutationFn: async ({ id, publish }) => {
      return await ResultService.publishResult(id, publish);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-results']);
      toast({
        title: "Success",
        description: "Result status updated successfully",
      });
    },
    onError: (error) => {
      console.error('Publish error:', error);
      toast({
        title: "Error",
        description: "Failed to update result status",
        variant: "destructive"
      });
    }
  });
  
  // Generate results mutation
  const generateMutation = useMutation({
    mutationFn: async (electionId) => {
      return await ResultService.generateResults(electionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-results']);
      toast({
        title: "Success",
        description: "Results generated successfully",
      });
    },
    onError: (error) => {
      console.error('Generate error:', error);
      toast({
        title: "Error",
        description: "Failed to generate results",
        variant: "destructive"
      });
    }
  });
  
  // Handle publish/unpublish
  const togglePublish = (id, currentStatus) => {
    publishMutation.mutate({ id, publish: !currentStatus });
  };
  
  // Handle generate results
  const generateResults = (electionId) => {
    generateMutation.mutate(electionId);
  };
  
  // Format election options for the dropdown
  const electionOptions = Array.isArray(elections) ? elections.map(election => ({
    id: election.id,
    name: election.name,
    status: election.status
  })) : [];
  
  // Filter results based on search term
  const filteredResults = Array.isArray(results) ? results.filter(result => {
    if (!searchTerm) return true;
    const searchString = searchTerm.toLowerCase();
    return (
      result.election_name?.toLowerCase().includes(searchString) ||
      result.constituency_name?.toLowerCase().includes(searchString)
    );
  }) : [];
  
  console.log("Elections:", elections);
  console.log("Election Options:", electionOptions);
  console.log("Results:", results);
  console.log("Filtered Results:", filteredResults);
  
  // Loading state
  if (resultsLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Election Results</h1>
          <LoadingResults />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold">Election Results</h1>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" /> Export Data
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="generate">Generate Results</TabsTrigger>
          </TabsList>
          
          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search results..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Election filter */}
              <div className="w-full sm:w-48">
                <Select value={selectedElection} onValueChange={setSelectedElection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select election" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Elections</SelectItem>
                    {electionOptions.map(election => (
                      <SelectItem key={election.id} value={String(election.id)}>
                        {election.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Published status filter */}
              <div className="w-full sm:w-48">
                <Select value={publishStatus} onValueChange={setPublishStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Published status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="unpublished">Unpublished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Results list */}
            <div className="space-y-4">
              {filteredResults.length > 0 ? (
                filteredResults.map(result => (
                  <Card key={result.id} className="mb-4">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-xl">
                          {result.election_name} - {result.constituency_name || "All Constituencies"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Total Votes: {result.total_votes || 0} | 
                          Turnout: {result.voter_turnout || 0}%
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </Button>
                        <Button 
                          variant={result.published ? "destructive" : "default"}
                          size="sm"
                          onClick={() => togglePublish(result.id, result.published)}
                        >
                          {result.published ? (
                            <><XCircle className="h-4 w-4 mr-1" /> Unpublish</>
                          ) : (
                            <><CheckCircle className="h-4 w-4 mr-1" /> Publish</>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-2">
                        <ResultCard result={result} />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyResults />
              )}
            </div>
          </TabsContent>
          
          {/* Generate Results Tab */}
          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate Election Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Select an election to generate results for:</h3>
                  <p className="text-sm text-gray-500">
                    Only completed elections are eligible for result generation.
                  </p>
                  
                  <div className="mt-4 grid gap-4">
                    {electionsLoading ? (
                      <div className="text-center py-4">Loading elections...</div>
                    ) : (
                      Array.isArray(elections) && elections
                        .filter(election => election.status === 'Completed')
                        .map(election => (
                          <Card key={election.id} className="overflow-hidden">
                            <div className="flex justify-between items-center p-4">
                              <div>
                                <h4 className="font-medium">{election.name}</h4>
                                <p className="text-sm text-gray-500">{election.type} | {election.date}</p>
                              </div>
                              <Button
                                onClick={() => generateResults(election.id)}
                                disabled={generateMutation.isPending}
                              >
                                Generate Results
                              </Button>
                            </div>
                          </Card>
                        ))
                    )}
                    
                    {Array.isArray(elections) && elections.filter(election => election.status === 'Completed').length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No completed elections available for result generation.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SuperadminResults;
