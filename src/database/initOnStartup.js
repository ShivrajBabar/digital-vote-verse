
import { initializeMySQL } from './initMysql';

// Initialize database on application startup
export async function initDatabaseOnStartup() {
  console.log('Starting database initialization...');
  try {
    await initializeMySQL();
    console.log('Database initialized successfully on startup');
    return true;
  } catch (error) {
    console.error('Failed to initialize database on startup:', error);
    return false;
  }
}
