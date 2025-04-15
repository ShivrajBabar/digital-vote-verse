
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingResults = () => {
  return (
    <div className="space-y-4">
      <div className="w-full sm:w-64">
        <Skeleton className="h-10" />
      </div>
      
      {[1, 2].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="py-4">
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LoadingResults;
