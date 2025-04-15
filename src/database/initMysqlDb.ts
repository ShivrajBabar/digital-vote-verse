
import { setupDatabase, testConnection } from '../api/mysqlDb';
import mysql from 'mysql2/promise';
import { dbConfig } from '../api/dbConfig';

// Sample data to seed the database
const seedData = async (pool) => {
  try {
    console.log('Seeding database with sample data...');
    
    // Check if superadmin exists
    const [superadminRows] = await pool.query("SELECT * FROM users WHERE role = 'superadmin' LIMIT 1");
    if (superadminRows.length === 0) {
      // Insert superadmin user
      await pool.query(`
        INSERT INTO users (id, name, email, password, role, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'sa-1',
        'Super Admin',
        'superadmin@example.com',
        '$2a$10$HfzIhGCCaxqyaIdGgjWCO.q1gLdZPaYfJHsYoqSF9e0CYJgTKeUmi', // password123
        'superadmin',
        'Active'
      ]);
      console.log('Superadmin user created');
    }
    
    // Check if admin exists
    const [adminRows] = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
    if (adminRows.length === 0) {
      // Insert admin user
      await pool.query(`
        INSERT INTO users (id, name, email, password, role, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'adm-1',
        'Admin User',
        'admin@example.com',
        '$2a$10$HfzIhGCCaxqyaIdGgjWCO.q1gLdZPaYfJHsYoqSF9e0CYJgTKeUmi', // password123
        'admin',
        'Active'
      ]);
      console.log('Admin user created');
    }
    
    // Check if voter exists
    const [voterRows] = await pool.query("SELECT * FROM users WHERE role = 'voter' LIMIT 1");
    if (voterRows.length === 0) {
      // Insert voter user
      await pool.query(`
        INSERT INTO users (id, name, email, password, role, status, voter_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        'vot-1',
        'Voter User',
        'voter@example.com',
        '$2a$10$HfzIhGCCaxqyaIdGgjWCO.q1gLdZPaYfJHsYoqSF9e0CYJgTKeUmi', // password123
        'voter',
        'Active',
        'VOT12345'
      ]);
      console.log('Voter user created');
    }
    
    // Check if constituencies exist
    const [constituencyRows] = await pool.query("SELECT COUNT(*) as count FROM constituencies");
    if (constituencyRows[0].count === 0) {
      // Sample constituencies
      const constituencies = [
        { name: 'Mumbai North', state: 'Maharashtra', district: 'Mumbai', type: 'Lok Sabha' },
        { name: 'Delhi East', state: 'Delhi', district: 'East Delhi', type: 'Lok Sabha' },
        { name: 'Bangalore Central', state: 'Karnataka', district: 'Bangalore', type: 'Lok Sabha' },
      ];
      
      for (const constituency of constituencies) {
        await pool.query(`
          INSERT INTO constituencies (name, state, district, type, status)
          VALUES (?, ?, ?, ?, ?)
        `, [
          constituency.name,
          constituency.state,
          constituency.district,
          constituency.type,
          'Active'
        ]);
      }
      console.log('Sample constituencies created');
    }
    
    // Check if elections exist
    const [electionRows] = await pool.query("SELECT COUNT(*) as count FROM elections");
    if (electionRows[0].count === 0) {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      
      // Sample elections
      const elections = [
        {
          name: 'Lok Sabha Elections 2024',
          election_date: nextWeek.toISOString().split('T')[0],
          nomination_start: yesterday.toISOString().split('T')[0],
          nomination_end: tomorrow.toISOString().split('T')[0],
          campaign_end: nextWeek.toISOString().split('T')[0],
          voting_start: nextWeek.toISOString(),
          voting_end: new Date(nextWeek.getTime() + 86400000).toISOString(),
          type: 'Lok Sabha',
          status: 'Upcoming'
        },
        {
          name: 'Municipal Elections 2024',
          election_date: yesterday.toISOString().split('T')[0],
          nomination_start: new Date(yesterday.getTime() - 2592000000).toISOString().split('T')[0],
          nomination_end: new Date(yesterday.getTime() - 1728000000).toISOString().split('T')[0],
          campaign_end: new Date(yesterday.getTime() - 86400000).toISOString().split('T')[0],
          voting_start: new Date(yesterday.getTime() - 86400000).toISOString(),
          voting_end: yesterday.toISOString(),
          type: 'Municipal',
          status: 'Completed'
        },
        {
          name: 'State Assembly Election 2024',
          election_date: tomorrow.toISOString().split('T')[0],
          nomination_start: new Date(yesterday.getTime() - 1296000000).toISOString().split('T')[0],
          nomination_end: yesterday.toISOString().split('T')[0],
          campaign_end: tomorrow.toISOString().split('T')[0],
          voting_start: tomorrow.toISOString(),
          voting_end: new Date(tomorrow.getTime() + 86400000).toISOString(),
          type: 'Vidhan Sabha',
          status: 'Upcoming'
        }
      ];
      
      for (const election of elections) {
        await pool.query(`
          INSERT INTO elections 
          (name, election_date, nomination_start, nomination_end, campaign_end, voting_start, voting_end, type, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          election.name,
          election.election_date,
          election.nomination_start,
          election.nomination_end,
          election.campaign_end,
          election.voting_start,
          election.voting_end,
          election.type,
          election.status
        ]);
      }
      console.log('Sample elections created');
    }
    
    // Add sample candidates and election results if needed
    console.log('Database seeding completed');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};

async function init() {
  try {
    // Test connection first
    const connected = await testConnection();
    
    if (connected) {
      // Initialize database with tables
      await setupDatabase();
      console.log('Database setup completed successfully');
      
      // Seed database with sample data
      const pool = mysql.createPool(dbConfig);
      await seedData(pool);
    } else {
      console.error('Failed to connect to database');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Run initialization
init().catch(console.error);
