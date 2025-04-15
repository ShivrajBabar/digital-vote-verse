
import React, { useEffect, useState } from 'react';
import { useRedirect } from '@/hooks/useRedirect';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { initDatabaseOnStartup } from '@/database/initOnStartup';
import { toast } from 'sonner';

const Index = () => {
  const { loading } = useRedirect();
  const [dbInitialized, setDbInitialized] = useState(false);
  
  // Initialize database on component mount
  useEffect(() => {
    const initDb = async () => {
      try {
        const success = await initDatabaseOnStartup();
        setDbInitialized(true);
        if (success) {
          toast.success("Database initialized successfully");
        } else {
          toast.error("Database initialization failed");
        }
      } catch (error) {
        console.error('Database initialization error:', error);
        toast.error("Failed to initialize database");
      }
    };
    
    initDb();
  }, []);
  
  // Loading message based on state
  let loadingMessage = "Welcome to Ballet Secure E-voting";
  if (!dbInitialized) {
    loadingMessage = "Initializing database...";
  }
  
  // Show loading state while redirecting and initializing database
  return <LoadingSpinner message={loadingMessage} />;
};

export default Index;
