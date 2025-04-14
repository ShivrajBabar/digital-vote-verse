
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Generate consistent colors for candidates
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#58D68D', '#F4D03F', '#EB984E', '#EC7063'];

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const ResultCard = ({ result }) => {
  const [expanded, setExpanded] = useState(false);

  if (!result || !result.candidates) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Result data is incomplete</p>
        </CardContent>
      </Card>
    );
  }

  // Transform candidate results for pie chart
  const chartData = result.candidates.map((candidate, index) => ({
    name: candidate.name || `Candidate ${index + 1}`,
    value: candidate.votes || 0,
    color: COLORS[index % COLORS.length]
  }));

  // Get winner
  const winner = result.candidates.reduce((prev, current) => 
    (prev.votes > current.votes) ? prev : current, { votes: 0 });

  return (
    <Card>
      <CardHeader className="bg-gray-50 border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{result.election_name || 'Election Result'}</CardTitle>
            <p className="text-sm text-gray-500">
              {formatDate(result.completed_date)}
              {result.constituency_name && ` • ${result.constituency_name}`}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {/* Winner display */}
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-sm font-medium text-green-800">Winner</h3>
          <div className="flex items-center mt-1">
            {winner.photo_url && (
              <img 
                src={winner.photo_url} 
                alt={`${winner.name} photo`}
                className="h-10 w-10 rounded-full mr-3 object-cover"
              />
            )}
            <div>
              <p className="font-medium">{winner.name || 'Unknown'}</p>
              <p className="text-sm text-gray-600">
                {winner.party || 'Independent'} • {winner.votes || 0} votes 
                {result.total_votes > 0 ? ` (${Math.round((winner.votes / result.total_votes) * 100)}%)` : ''}
              </p>
            </div>
          </div>
        </div>
        
        {/* Expanded content */}
        {expanded && (
          <>
            {/* Chart */}
            <div className="my-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} votes`, 'Votes']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Results table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Rank</th>
                    <th className="px-4 py-2 text-left">Candidate</th>
                    <th className="px-4 py-2 text-left">Party</th>
                    <th className="px-4 py-2 text-right">Votes</th>
                    <th className="px-4 py-2 text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {result.candidates.sort((a, b) => b.votes - a.votes).map((candidate, index) => (
                    <tr key={index} className={index === 0 ? "bg-green-50" : "border-b"}>
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          {candidate.photo_url && (
                            <img 
                              src={candidate.photo_url} 
                              alt={`${candidate.name} photo`}
                              className="h-8 w-8 rounded-full mr-2 object-cover"
                            />
                          )}
                          {candidate.name || 'Unknown Candidate'}
                        </div>
                      </td>
                      <td className="px-4 py-3">{candidate.party || 'Independent'}</td>
                      <td className="px-4 py-3 text-right">{candidate.votes || 0}</td>
                      <td className="px-4 py-3 text-right">
                        {result.total_votes > 0 ? 
                          `${Math.round((candidate.votes / result.total_votes) * 100)}%` : '0%'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-medium">
                    <td colSpan="3" className="px-4 py-2 text-right">Total</td>
                    <td className="px-4 py-2 text-right">{result.total_votes || 0}</td>
                    <td className="px-4 py-2 text-right">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Additional result metadata */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-md">
                <h4 className="font-medium mb-1">Election Details</h4>
                <p>Type: {result.election_type || 'N/A'}</p>
                <p>Total Constituencies: {result.total_constituencies || 'N/A'}</p>
                <p>Total Candidates: {result.candidates?.length || 0}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-md">
                <h4 className="font-medium mb-1">Voting Statistics</h4>
                <p>Total Votes: {result.total_votes || 0}</p>
                <p>Voter Turnout: {result.voter_turnout || 'N/A'}%</p>
                <p>Published: {formatDate(result.published_date)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultCard;
