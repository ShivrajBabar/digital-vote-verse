
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const LoadingResults = () => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-3"></div>
        <h3 className="text-xl font-medium mb-1">Loading Results</h3>
        <p className="text-gray-500">
          Please wait while we fetch the election results...
        </p>
      </CardContent>
    </Card>
  );
};

export default LoadingResults;
