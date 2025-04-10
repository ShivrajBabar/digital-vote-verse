
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.resolve(process.cwd(), 'election_db.sqlite');

// Ensure the database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export async function openDB() {
  return open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
}

// Initialize database with tables
export async function initDB() {
  const db = await openDB();
  
  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('superadmin', 'admin', 'voter')),
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Active', 'Inactive', 'Pending')),
      photoUrl TEXT,
      constituency_id INTEGER,
      voter_id TEXT UNIQUE,
      phone TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  // Constituencies table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS constituencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      state TEXT NOT NULL,
      district TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Lok Sabha', 'Vidhan Sabha', 'Municipal', 'Panchayat')),
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  // Elections table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS elections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      election_date TEXT NOT NULL,
      nomination_start TEXT NOT NULL,
      nomination_end TEXT NOT NULL,
      campaign_end TEXT NOT NULL,
      voting_start TEXT NOT NULL,
      voting_end TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Lok Sabha', 'Vidhan Sabha', 'Municipal', 'Panchayat')),
      status TEXT NOT NULL DEFAULT 'Upcoming' CHECK(status IN ('Upcoming', 'Ongoing', 'Completed', 'Cancelled')),
      result_published BOOLEAN NOT NULL DEFAULT 0,
      state TEXT,
      district TEXT,
      constituency_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  
  // Candidates table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      election_id INTEGER NOT NULL,
      constituency_id INTEGER NOT NULL,
      party TEXT NOT NULL,
      symbol TEXT NOT NULL,
      symbol_image TEXT,
      age INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Approved', 'Pending', 'Rejected')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (election_id) REFERENCES elections(id),
      FOREIGN KEY (constituency_id) REFERENCES constituencies(id)
    )
  `);
  
  // Booths table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS booths (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      constituency_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (constituency_id) REFERENCES constituencies(id)
    )
  `);
  
  // Votes table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      election_id INTEGER NOT NULL,
      constituency_id INTEGER NOT NULL,
      candidate_id INTEGER NOT NULL,
      voter_id TEXT NOT NULL,
      booth_id INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      is_valid BOOLEAN NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (election_id) REFERENCES elections(id),
      FOREIGN KEY (constituency_id) REFERENCES constituencies(id),
      FOREIGN KEY (candidate_id) REFERENCES candidates(id),
      FOREIGN KEY (voter_id) REFERENCES users(id),
      FOREIGN KEY (booth_id) REFERENCES booths(id)
    )
  `);
  
  // Election Results table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS election_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      election_id INTEGER NOT NULL,
      constituency_id INTEGER NOT NULL,
      winner_id INTEGER NOT NULL,
      total_votes INTEGER NOT NULL,
      published BOOLEAN NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (election_id) REFERENCES elections(id),
      FOREIGN KEY (constituency_id) REFERENCES constituencies(id),
      FOREIGN KEY (winner_id) REFERENCES candidates(id)
    )
  `);
  
  // Candidate Results table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS candidate_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      election_result_id INTEGER NOT NULL,
      candidate_id INTEGER NOT NULL,
      votes INTEGER NOT NULL,
      vote_percentage REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (election_result_id) REFERENCES election_results(id),
      FOREIGN KEY (candidate_id) REFERENCES candidates(id)
    )
  `);
  
  // Create indexes for common queries
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_constituency ON users(constituency_id);
    CREATE INDEX IF NOT EXISTS idx_candidates_election ON candidates(election_id);
    CREATE INDEX IF NOT EXISTS idx_candidates_constituency ON candidates(constituency_id);
    CREATE INDEX IF NOT EXISTS idx_votes_election ON votes(election_id);
    CREATE INDEX IF NOT EXISTS idx_votes_constituency ON votes(constituency_id);
    CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id);
  `);
  
  return db;
}

// Create a middleware to check if the database is initialized
export async function initializeDatabase() {
  try {
    await initDB();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Call this function when your app starts
initializeDatabase().catch(console.error);
