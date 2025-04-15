
import React, { useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import ResultsPageHeader from '@/components/voter/results/ResultsPageHeader';
import ElectionSelector from '@/components/voter/results/ElectionSelector';
import ResultCard from '@/components/voter/results/ResultCard';
import EmptyResults from '@/components/voter/results/EmptyResults';
import LoadingResults from '@/components/voter/results/LoadingResults';
import { toast as sonnerToast } from 'sonner';
import axios from 'axios';
import { ResultData } from '@/types/election';

const VoterResults = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedElection, setSelectedElection] = useState<string>('all');
  
  // Fetch elections for the dropdown
  const { data: elections, isLoading: electionsLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: async () => {
      try {
        // Fetch completed elections from the database
        const response = await axios.get('/api/elections', {
          params: { status: 'Completed' }
        });
        console.log('Fetched elections:', response.data);
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching elections:', error);
        toast({
          title: "Error",
          description: "Failed to load elections",
          variant: "destructive"
        });
        return [];
      }
    }
  });
  
  // Fetch published results - ensure only published results are shown
  const { 
    data: results, 
    isLoading: resultsLoading,
    refetch: refetchResults
  } = useQuery({
    queryKey: ['voter-results', selectedElection],
    queryFn: async () => {
      try {
        // Define query parameters
        const params: Record<string, string> = { published: 'true' };
        if (selectedElection !== 'all') {
          params.election_id = selectedElection;
        }
        
        // Fetch results from the database
        const response = await axios.get('/api/results', { params });
        console.log('Fetched results:', response.data);
        return Array.isArray(response.data) ? response.data : [];
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
  
  // Handler for refreshing results
  const handleRefresh = useCallback(() => {
    refetchResults();
    sonnerToast.info("Refreshing results...");
  }, [refetchResults]);
  
  // Display loading state
  if (resultsLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <ResultsPageHeader />
          <LoadingResults />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <ResultsPageHeader electionCount={results?.length || 0} />
        </div>

        <ElectionSelector 
          selectedElection={selectedElection} 
          setSelectedElection={setSelectedElection} 
          electionOptions={electionOptions}
          isLoading={electionsLoading}
        />

        <div className="space-y-4">
          {results && results.length > 0 ? (
            results.map((result: ResultData) => (
              <ResultCard key={result.id} result={result} />
            ))
          ) : (
            <EmptyResults onRefresh={handleRefresh} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VoterResults;
