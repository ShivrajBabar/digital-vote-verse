
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FileSearch } from 'lucide-react';

const EmptyResults = () => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-10 text-center">
        <FileSearch size={48} className="text-gray-400 mb-3" />
        <h3 className="text-xl font-medium mb-1">No Results Available</h3>
        <p className="text-gray-500">
          No election results have been published yet. Please check back later.
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyResults;
