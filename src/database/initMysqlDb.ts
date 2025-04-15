
import { setupDatabase, testConnection } from '../api/mysqlDb';

async function init() {
  try {
    // Test connection first
    const connected = await testConnection();
    
    if (connected) {
      // Initialize database with tables
      await setupDatabase();
      console.log('Database setup completed successfully');
    } else {
      console.error('Failed to connect to database');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Run initialization
init().catch(console.error);
