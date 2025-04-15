
import mysql from 'mysql2/promise';
import { dbConfig, checkDatabaseConfig } from './dbConfig';
import fs from 'fs';
import path from 'path';

// Create connection pool
export const pool = mysql.createPool(dbConfig);

// Test database connection
export async function testConnection() {
  try {
    // Check if configuration is valid
    if (!checkDatabaseConfig()) {
      console.error('Database configuration is incomplete');
      return false;
    }
    
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
    
    // Test querying a simple statement
    const [result] = await connection.query('SELECT 1 + 1 AS solution');
    console.log('Test query result:', result);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  }
}

// Initialize database with tables from the SQL file
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Read SQL schema from file
    const schemaPath = path.resolve(process.cwd(), 'src/database/ballet_secure.sql');
    console.log('Reading schema from:', schemaPath);
    
    if (!fs.existsSync(schemaPath)) {
      console.error(`Schema file not found at ${schemaPath}`);
      throw new Error('Schema file not found');
    }
    
    const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split SQL statements by semicolon
    const statements = sqlSchema
      .split(';')
      .filter(statement => statement.trim().length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    const connection = await pool.getConnection();
    
    try {
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (statement) {
          try {
            console.log(`Executing statement ${i + 1}/${statements.length}`);
            await connection.query(statement);
          } catch (error) {
            // Log error but continue with other statements
            // This allows tables that already exist to be skipped
            console.error(`Error executing statement ${i + 1}:`, error);
          }
        }
      }
      console.log('Database schema initialized successfully');
    } finally {
      connection.release();
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Execute a query with parameters
export async function query<T>(sql: string, params?: any[]): Promise<T[]> {
  try {
    console.log('Executing query:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
    if (params?.length) console.log('With parameters:', params);
    
    const [rows] = await pool.query(sql, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Execute a single-row query
export async function queryOne<T>(sql: string, params?: any[]): Promise<T | null> {
  try {
    const rows = await query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Database queryOne error:', error);
    throw error;
  }
}

// Execute an insert query and return the inserted ID
export async function insert(sql: string, params?: any[]): Promise<number> {
  try {
    console.log('Executing insert:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
    if (params?.length) console.log('With parameters:', params);
    
    const [result] = await pool.query(sql, params);
    return (result as any).insertId;
  } catch (error) {
    console.error('Database insert error:', error);
    throw error;
  }
}

// Execute an update query and return affected rows count
export async function update(sql: string, params?: any[]): Promise<number> {
  try {
    console.log('Executing update:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
    if (params?.length) console.log('With parameters:', params);
    
    const [result] = await pool.query(sql, params);
    return (result as any).affectedRows;
  } catch (error) {
    console.error('Database update error:', error);
    throw error;
  }
}

// Initialize database and create all tables
export async function setupDatabase() {
  console.log('Setting up database...');
  const connected = await testConnection();
  
  if (!connected) {
    console.error('Database connection failed, cannot setup database');
    throw new Error('Database connection failed');
  }
  
  return initializeDatabase();
}

export default {
  query,
  queryOne,
  insert,
  update,
  testConnection,
  setupDatabase,
  pool
};
