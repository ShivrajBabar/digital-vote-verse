
import { testConnection, setupDatabase } from '../api/mysqlDb';
import { dbConfig } from '../api/dbConfig';
import mysql from 'mysql2/promise';

// Create connection pool for seeding
const seedPool = mysql.createPool(dbConfig);

// Seed the database with sample data
async function seedDatabase() {
  try {
    console.log('Seeding database with initial data...');
    const connection = await seedPool.getConnection();

    try {
      // Check if results exist
      const [resultRows] = await connection.query("SELECT COUNT(*) as count FROM election_results");
      
      if (resultRows[0].count === 0) {
        console.log('Adding sample election results...');
        
        // Get elections
        const [elections] = await connection.query("SELECT id FROM elections WHERE status = 'Completed' LIMIT 2");
        if (elections.length === 0) {
          console.log('No completed elections found for sample results');
          return;
        }
        
        // Get constituencies
        const [constituencies] = await connection.query("SELECT id FROM constituencies LIMIT 2");
        if (constituencies.length === 0) {
          console.log('No constituencies found for sample results');
          return;
        }
        
        // Get candidates
        const [candidates] = await connection.query(`
          INSERT INTO candidates (user_id, election_id, constituency_id, party, symbol, symbol_image, age, status)
          VALUES 
            ('vot-1', ${elections[0].id}, ${constituencies[0].id}, 'National Democratic Party', 'lotus', '/placeholder.svg', 45, 'Approved'),
            ('vot-2', ${elections[0].id}, ${constituencies[0].id}, 'Progressive Alliance', 'hand', '/placeholder.svg', 52, 'Approved'),
            ('vot-3', ${elections[0].id}, ${constituencies[0].id}, 'Independent', 'star', '/placeholder.svg', 39, 'Approved');
        `);
        
        // Add candidates for second constituency if available
        if (constituencies.length > 1 && elections.length > 1) {
          await connection.query(`
            INSERT INTO candidates (user_id, election_id, constituency_id, party, symbol, symbol_image, age, status)
            VALUES 
              ('vot-4', ${elections[0].id}, ${constituencies[1].id}, 'National Democratic Party', 'lotus', '/placeholder.svg', 48, 'Approved'),
              ('vot-5', ${elections[0].id}, ${constituencies[1].id}, 'Progressive Alliance', 'hand', '/placeholder.svg', 44, 'Approved');
          `);
        }
        
        // Get newly inserted candidate IDs
        const [candidateRows] = await connection.query("SELECT id FROM candidates ORDER BY id ASC LIMIT 5");
        
        if (candidateRows.length >= 3) {
          // Create election results for first constituency
          const totalVotes1 = 158745;
          const [result1] = await connection.query(`
            INSERT INTO election_results 
            (election_id, constituency_id, winner_id, total_votes, published)
            VALUES (?, ?, ?, ?, ?)
          `, [elections[0].id, constituencies[0].id, candidateRows[0].id, totalVotes1, 1]);
          
          const resultId1 = result1.insertId;
          
          // Add candidate results for first election result
          await connection.query(`
            INSERT INTO candidate_results
            (election_result_id, candidate_id, votes, vote_percentage)
            VALUES 
              (?, ?, ?, ?),
              (?, ?, ?, ?),
              (?, ?, ?, ?)
          `, [
            resultId1, candidateRows[0].id, 85420, 53.8,
            resultId1, candidateRows[1].id, 65325, 41.2,
            resultId1, candidateRows[2].id, 8000, 5.0
          ]);
          
          // Create second result if we have enough data
          if (constituencies.length > 1 && candidateRows.length >= 5) {
            const totalVotes2 = 145230;
            const [result2] = await connection.query(`
              INSERT INTO election_results 
              (election_id, constituency_id, winner_id, total_votes, published)
              VALUES (?, ?, ?, ?, ?)
            `, [elections[0].id, constituencies[1].id, candidateRows[3].id, totalVotes2, 1]);
            
            const resultId2 = result2.insertId;
            
            // Add candidate results for second election result
            await connection.query(`
              INSERT INTO candidate_results
              (election_result_id, candidate_id, votes, vote_percentage)
              VALUES 
                (?, ?, ?, ?),
                (?, ?, ?, ?)
            `, [
              resultId2, candidateRows[3].id, 78450, 54.0,
              resultId2, candidateRows[4].id, 66780, 46.0
            ]);
          }
        }
      }
      
      console.log('Database seeding completed');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Initialize and seed the database
async function initialize() {
  try {
    console.log('Testing database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('Failed to connect to the database. Please check your configuration.');
      return;
    }
    
    console.log('Setting up database tables...');
    await setupDatabase();
    
    console.log('Seeding database with sample data...');
    await seedDatabase();
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Export the initialize function
export const initializeMySQL = initialize;

// Run initialization if this file is executed directly
if (require.main === module) {
  initialize()
    .then(() => console.log('Database initialization script completed'))
    .catch(console.error);
}
