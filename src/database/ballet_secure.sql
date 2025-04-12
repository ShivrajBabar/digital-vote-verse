
-- Ballet Secure E-voting Database Schema
-- Created: 2025-04-12

-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('superadmin', 'admin', 'voter')) NOT NULL,
  constituency_id INTEGER,
  status VARCHAR(20) DEFAULT 'Active',
  voter_id VARCHAR(50) UNIQUE,
  district VARCHAR(100),
  state VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  last_login DATETIME,
  FOREIGN KEY (constituency_id) REFERENCES constituencies(id)
);

-- Constituencies table
CREATE TABLE constituencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'Active',
  total_voters INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now'))
);

-- Elections table
CREATE TABLE elections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  election_type VARCHAR(100) NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  registration_deadline DATETIME,
  status VARCHAR(20) DEFAULT 'Upcoming',
  created_by INTEGER,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Candidates table
CREATE TABLE candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  party VARCHAR(255),
  symbol VARCHAR(100),
  age INTEGER,
  gender VARCHAR(20),
  constituency_id INTEGER,
  election_id INTEGER,
  photo_url TEXT,
  document_url TEXT,
  status VARCHAR(20) DEFAULT 'Pending',
  votes_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (constituency_id) REFERENCES constituencies(id),
  FOREIGN KEY (election_id) REFERENCES elections(id)
);

-- Votes table
CREATE TABLE votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voter_id INTEGER NOT NULL,
  candidate_id INTEGER NOT NULL,
  election_id INTEGER NOT NULL,
  booth_id INTEGER,
  timestamp DATETIME DEFAULT (datetime('now')),
  verification_hash TEXT,
  FOREIGN KEY (voter_id) REFERENCES users(id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id),
  FOREIGN KEY (election_id) REFERENCES elections(id),
  FOREIGN KEY (booth_id) REFERENCES booths(id),
  UNIQUE(voter_id, election_id)
);

-- Booths table
CREATE TABLE booths (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  address TEXT,
  constituency_id INTEGER,
  status VARCHAR(20) DEFAULT 'Active',
  admin_id INTEGER,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (constituency_id) REFERENCES constituencies(id),
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Results table
CREATE TABLE results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  election_id INTEGER NOT NULL,
  constituency_id INTEGER,
  candidate_id INTEGER,
  votes_count INTEGER DEFAULT 0,
  rank INTEGER,
  percentage REAL,
  winner BOOLEAN DEFAULT 0,
  published BOOLEAN DEFAULT 0,
  timestamp DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (election_id) REFERENCES elections(id),
  FOREIGN KEY (constituency_id) REFERENCES constituencies(id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_constituency ON users(constituency_id);
CREATE INDEX idx_candidates_election ON candidates(election_id);
CREATE INDEX idx_candidates_constituency ON candidates(constituency_id);
CREATE INDEX idx_votes_election ON votes(election_id);
CREATE INDEX idx_results_election ON results(election_id);

-- Insert sample superadmin
INSERT INTO users (name, email, password, role, status)
VALUES ('System Admin', 'admin@balletsecure.com', '$2a$10$mLK.rrdlvx9DCFb6Eck1t.TlltnGulepXnov3bBp5T2TloO1MYj52', 'superadmin', 'Active');
-- Default password: Password123
