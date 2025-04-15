
// Database configuration
// Use environment variables in production to avoid exposing credentials

// Check if this is a development environment
const isDevelopment = process.env.NODE_ENV !== 'production';

export const dbConfig = {
  host: process.env.DB_HOST || '193.203.184.44',
  user: process.env.DB_USER || 'u906396894_devshreyas21',
  password: process.env.DB_PASSWORD || 'RajendraMahendra@123',
  database: process.env.DB_DATABASE || 'u906396894_ballet_secure',
  waitForConnections: true,
  connectionLimit: isDevelopment ? 20 : 10, // Higher connection limit in development
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Add debug option in development
  debug: isDevelopment ? ['ComQueryPacket'] : false
};

// Export a function to check database connection
export const checkDatabaseConfig = () => {
  console.log('Database configuration:');
  console.log('Host:', dbConfig.host);
  console.log('User:', dbConfig.user);
  console.log('Database:', dbConfig.database);
  
  // Don't log password
  console.log('Connection limit:', dbConfig.connectionLimit);
  
  return dbConfig.host && dbConfig.user && dbConfig.password && dbConfig.database;
};
