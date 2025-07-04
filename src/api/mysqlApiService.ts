
import db from './mysqlDb';
import { v4 as uuidv4 } from 'uuid';
import { User, Election, Candidate, ElectionResult, CandidateResult } from '../database/schema';

// Define interfaces for better type safety
interface ResultFilters {
  published?: boolean;
  election_id?: number;
  constituency_id?: number;
}

interface DatabaseResult {
  id: number;
  election_id: number;
  constituency_id: number;
  winner_id: number;
  total_votes: number;
  published: number;
  election_name: string;
  election_type: string;
  constituency_name: string;
  winner_name: string;
  winner_party: string;
  created_at: string;
  updated_at: string;
  candidates?: any[];
}

// Users API
export const UserService = {
  async getAllUsers(filters = {}) {
    const sql = 'SELECT * FROM users WHERE status = "Active"';
    return await db.query<User>(sql);
  },
  
  async getUserById(id: string) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    return await db.queryOne<User>(sql, [id]);
  },
  
  async getUserByEmail(email: string) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    return await db.queryOne<User>(sql, [email]);
  },
  
  async createUser(userData: Partial<User>) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const sql = `INSERT INTO users (id, name, email, password, role, status, photoUrl, constituency_id, voter_id, phone, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                
    const params = [
      id,
      userData.name,
      userData.email,
      userData.password,
      userData.role,
      userData.status || 'Pending',
      userData.photoUrl,
      userData.constituency_id,
      userData.voter_id,
      userData.phone,
      now,
      now
    ];
    
    await db.insert(sql, params);
    return { ...userData, id };
  },
  
  async updateUser(id: string, userData: Partial<User>) {
    const now = new Date().toISOString();
    
    const sql = `UPDATE users SET 
                name = COALESCE(?, name),
                email = COALESCE(?, email),
                password = COALESCE(?, password),
                status = COALESCE(?, status),
                photoUrl = COALESCE(?, photoUrl),
                constituency_id = COALESCE(?, constituency_id),
                voter_id = COALESCE(?, voter_id),
                phone = COALESCE(?, phone),
                updated_at = ?
                WHERE id = ?`;
                
    const params = [
      userData.name,
      userData.email,
      userData.password,
      userData.status,
      userData.photoUrl,
      userData.constituency_id,
      userData.voter_id,
      userData.phone,
      now,
      id
    ];
    
    return await db.update(sql, params);
  },
  
  async deleteUser(id: string) {
    const sql = 'DELETE FROM users WHERE id = ?';
    return await db.update(sql, [id]);
  }
};

// Elections API
export const ElectionService = {
  async getAllElections(filters = {}) {
    const sql = 'SELECT * FROM elections';
    return await db.query<Election>(sql);
  },
  
  async getElectionById(id: number) {
    const sql = 'SELECT * FROM elections WHERE id = ?';
    return await db.queryOne<Election>(sql, [id]);
  },
  
  async createElection(electionData: Partial<Election>) {
    const now = new Date().toISOString();
    
    const sql = `INSERT INTO elections 
                (name, election_date, nomination_start, nomination_end, campaign_end, voting_start, voting_end, type, status, result_published, state, district, constituency_id, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                
    const params = [
      electionData.name,
      electionData.election_date,
      electionData.nomination_start,
      electionData.nomination_end,
      electionData.campaign_end,
      electionData.voting_start,
      electionData.voting_end,
      electionData.type,
      electionData.status || 'Upcoming',
      electionData.result_published ? 1 : 0,
      electionData.state,
      electionData.district,
      electionData.constituency_id,
      now,
      now
    ];
    
    const id = await db.insert(sql, params);
    return { ...electionData, id };
  },
  
  async updateElection(id: number, electionData: Partial<Election>) {
    const now = new Date().toISOString();
    
    const sql = `UPDATE elections SET
                name = COALESCE(?, name),
                election_date = COALESCE(?, election_date),
                nomination_start = COALESCE(?, nomination_start),
                nomination_end = COALESCE(?, nomination_end),
                campaign_end = COALESCE(?, campaign_end),
                voting_start = COALESCE(?, voting_start),
                voting_end = COALESCE(?, voting_end),
                type = COALESCE(?, type),
                status = COALESCE(?, status),
                result_published = COALESCE(?, result_published),
                state = COALESCE(?, state),
                district = COALESCE(?, district),
                constituency_id = COALESCE(?, constituency_id),
                updated_at = ?
                WHERE id = ?`;
                
    const params = [
      electionData.name,
      electionData.election_date,
      electionData.nomination_start,
      electionData.nomination_end,
      electionData.campaign_end,
      electionData.voting_start,
      electionData.voting_end,
      electionData.type,
      electionData.status,
      electionData.result_published !== undefined ? (electionData.result_published ? 1 : 0) : null,
      electionData.state,
      electionData.district,
      electionData.constituency_id,
      now,
      id
    ];
    
    return await db.update(sql, params);
  },
  
  async deleteElection(id: number) {
    const sql = 'DELETE FROM elections WHERE id = ?';
    return await db.update(sql, [id]);
  }
};

// Results API
export const ResultService = {
  async getAllResults(filters: ResultFilters = {}) {
    try {
      console.log('Getting all results with filters:', filters);
      
      // Build WHERE clause based on filters
      let whereClause = 'WHERE 1=1';
      const params = [];
      
      if (filters.published !== undefined) {
        whereClause += ' AND er.published = ?';
        params.push(filters.published ? 1 : 0);
      }
      
      if (filters.election_id !== undefined) {
        whereClause += ' AND er.election_id = ?';
        params.push(filters.election_id);
      }
      
      if (filters.constituency_id !== undefined) {
        whereClause += ' AND er.constituency_id = ?';
        params.push(filters.constituency_id);
      }
      
      // Main query to get election results
      const sql = `
        SELECT 
          er.id, er.election_id, er.constituency_id, er.winner_id, er.total_votes, er.published,
          e.name as election_name, e.type as election_type,
          c.name as constituency_name,
          u.name as winner_name, cand.party as winner_party,
          er.created_at as completed_date, er.updated_at as published_date
        FROM election_results er
        JOIN elections e ON er.election_id = e.id
        JOIN constituencies c ON er.constituency_id = c.id
        JOIN candidates cand ON er.winner_id = cand.id
        JOIN users u ON cand.user_id = u.id
        ${whereClause}
        ORDER BY er.created_at DESC
      `;
      
      console.log('Executing query:', sql, 'with params:', params);
      const results = await db.query<DatabaseResult>(sql, params);
      console.log(`Found ${results.length} results`);
      
      // Fetch candidate results for each election result
      for (const result of results) {
        const candidateSql = `
          SELECT 
            cr.id, cr.candidate_id, cr.votes, cr.vote_percentage,
            c.party, c.symbol as symbol_url, c.symbol_image,
            u.id as user_id, u.name, u.photo_url
          FROM candidate_results cr
          JOIN candidates c ON cr.candidate_id = c.id
          JOIN users u ON c.user_id = u.id
          WHERE cr.election_result_id = ?
          ORDER BY cr.votes DESC
        `;
        
        result.candidates = await db.query(candidateSql, [result.id]);
        console.log(`Found ${result.candidates?.length || 0} candidates for result ${result.id}`);
      }
      
      return results;
    } catch (error) {
      console.error('Database error in getAllResults:', error);
      throw error;
    }
  },
  
  async getResultById(id: number) {
    const sql = `
      SELECT er.*, e.name as election_name, c.name as constituency_name,
             winner.name as winner_name, winner.party as winner_party
      FROM election_results er
      JOIN elections e ON er.election_id = e.id
      JOIN constituencies c ON er.constituency_id = c.id
      JOIN candidates winner ON er.winner_id = winner.id
      WHERE er.id = ?
    `;
    
    const result: any = await db.queryOne(sql, [id]);
    
    if (result) {
      const candidateSql = `
        SELECT cr.*, c.name, c.party, c.symbol_image as photoUrl, 
               u.photo_url as photoUrl, c.user_id,
               (cr.votes / er.total_votes) * 100 as votePercentage
        FROM candidate_results cr
        JOIN candidates c ON cr.candidate_id = c.id
        JOIN users u ON c.user_id = u.id
        JOIN election_results er ON cr.election_result_id = er.id
        WHERE cr.election_result_id = ?
      `;
      
      result.candidates = await db.query(candidateSql, [id]);
    }
    
    return result;
  },
  
  async createResult(resultData: Partial<ElectionResult>, candidateResults: Partial<CandidateResult>[]) {
    const now = new Date().toISOString();
    
    // Begin transaction - Get connection from the db module
    const connection = await (db as any).pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insert election result
      const resultSql = `
        INSERT INTO election_results 
        (election_id, constituency_id, winner_id, total_votes, published, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const resultParams = [
        resultData.election_id,
        resultData.constituency_id,
        resultData.winner_id,
        resultData.total_votes,
        resultData.published ? 1 : 0,
        now,
        now
      ];
      
      const [resultQueryResult] = await connection.query(resultSql, resultParams);
      const resultId = (resultQueryResult as any).insertId;
      
      // Insert candidate results
      for (const candidateResult of candidateResults) {
        const candidateSql = `
          INSERT INTO candidate_results
          (election_result_id, candidate_id, votes, vote_percentage, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const candidateParams = [
          resultId,
          candidateResult.candidate_id,
          candidateResult.votes,
          candidateResult.vote_percentage || 0,
          now,
          now
        ];
        
        await connection.query(candidateSql, candidateParams);
      }
      
      // Commit transaction
      await connection.commit();
      
      return { ...resultData, id: resultId };
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('Error creating result:', error);
      throw error;
    } finally {
      connection.release();
    }
  },
  
  async updateResult(id: number, resultData: Partial<ElectionResult>) {
    const now = new Date().toISOString();
    
    const sql = `
      UPDATE election_results SET
      election_id = COALESCE(?, election_id),
      constituency_id = COALESCE(?, constituency_id),
      winner_id = COALESCE(?, winner_id),
      total_votes = COALESCE(?, total_votes),
      published = COALESCE(?, published),
      updated_at = ?
      WHERE id = ?
    `;
    
    const params = [
      resultData.election_id,
      resultData.constituency_id,
      resultData.winner_id,
      resultData.total_votes,
      resultData.published !== undefined ? (resultData.published ? 1 : 0) : null,
      now,
      id
    ];
    
    return await db.update(sql, params);
  },
  
  async deleteResult(id: number) {
    // Begin transaction
    const connection = await (db as any).pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Delete candidate results first
      await connection.query('DELETE FROM candidate_results WHERE election_result_id = ?', [id]);
      
      // Then delete the election result
      await connection.query('DELETE FROM election_results WHERE id = ?', [id]);
      
      // Commit transaction
      await connection.commit();
      return true;
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('Error deleting result:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
};

// Export all services
export default {
  UserService,
  ElectionService,
  ResultService
};
