
import React from 'react';
import { useRedirect } from '@/hooks/useRedirect';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const Index = () => {
  const { loading } = useRedirect();
  
  // Show loading state while redirecting
  return <LoadingSpinner />;
};

export default Index;
