
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FileSearch, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const EmptyResults = ({ onRefresh }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <FileSearch size={48} className="text-gray-400 mb-3" />
          </motion.div>
          
          <h3 className="text-xl font-medium mb-1">No Results Available</h3>
          <p className="text-gray-500 max-w-md">
            No election results have been published yet for the selected filters. Results will appear here after they are verified and published by the Election Commission.
          </p>
          
          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
            <AlertCircle size={20} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 text-left">
              If you're expecting to see results, please ensure you're using the correct election filter or check back later.
            </p>
          </div>
          
          {onRefresh && (
            <Button 
              variant="outline" 
              className="mt-6 gap-2"
              onClick={onRefresh}
            >
              <RefreshCcw size={16} />
              Refresh Results
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmptyResults;
