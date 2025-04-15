
// Database configuration
// Use environment variables in production to avoid exposing credentials
export const dbConfig = {
  host: process.env.DB_HOST || '193.203.184.44',
  user: process.env.DB_USER || 'u906396894_devshreyas21',
  password: process.env.DB_PASSWORD || 'RajendraMahendra@123',
  database: process.env.DB_DATABASE || 'u906396894_ballet_secure',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};
