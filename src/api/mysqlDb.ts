
import mysql from 'mysql2/promise';
import { dbConfig } from './dbConfig';
import fs from 'fs';
import path from 'path';

// Create connection pool
export const pool = mysql.createPool(dbConfig);

// Test database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
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
    const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split SQL statements by semicolon
    const statements = sqlSchema
      .split(';')
      .filter(statement => statement.trim().length > 0);
    
    // Execute each statement
    const connection = await pool.getConnection();
    
    try {
      for (const statement of statements) {
        if (statement.trim()) {
          await connection.query(statement);
        }
      }
      console.log('Database initialized successfully');
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
    const [result] = await pool.query(sql, params);
    return (result as any).affectedRows;
  } catch (error) {
    console.error('Database update error:', error);
    throw error;
  }
}

// Initialize database and create all tables
export function setupDatabase() {
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
