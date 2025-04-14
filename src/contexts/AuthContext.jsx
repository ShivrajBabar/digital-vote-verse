
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

// Create the context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock user data for development
  const mockUsers = [
    {
      id: '1',
      name: 'Super Admin',
      email: 'superadmin@example.com',
      role: 'superadmin',
      photoUrl: '/placeholder.svg',
    },
    {
      id: '2',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      photoUrl: '/placeholder.svg',
      constituency: 'Mumbai North',
      state: 'Maharashtra',
      district: 'Mumbai',
    },
    {
      id: '3',
      name: 'Voter User',
      email: 'voter@example.com',
      role: 'voter',
      photoUrl: '/placeholder.svg',
      constituency: 'Mumbai North',
      state: 'Maharashtra',
      district: 'Mumbai',
      electionType: 'Lok Sabha',
    },
  ];

  // Check if user is already logged in (from local storage)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password, role, electionType) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user in mock data (in production, this would be an API call)
      const foundUser = mockUsers.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && u.role === role
      );
      
      if (!foundUser) {
        throw new Error('Invalid credentials');
      }

      // For voter role, check if election type is provided
      if (role === 'voter' && !electionType) {
        throw new Error('Election type is required for voters');
      }

      // Update user data with election type if voter
      const userData = role === 'voter' 
        ? { ...foundUser, electionType } 
        : foundUser;
      
      // Store user in localStorage and state
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Navigate based on role
      switch (role) {
        case 'superadmin':
          navigate('/superadmin/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'voter':
          navigate('/voter/dashboard');
          break;
        default:
          navigate('/');
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name}`,
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
