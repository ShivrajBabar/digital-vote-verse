
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';

interface EmptyResultsProps {
  onRefresh?: () => void;
}

const EmptyResults: React.FC<EmptyResultsProps> = ({ onRefresh }) => {
  return (
    <Card>
      <CardContent className="py-8">
        <div className="text-center text-gray-500">
          <p className="mb-2">No published results are available yet</p>
          <p className="mb-4">Results will be displayed here once they are published by the Election Commission</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyResults;
