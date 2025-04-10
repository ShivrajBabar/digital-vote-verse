
import { NextApiRequest, NextApiResponse } from 'next';
import { openDB } from '../db';
import { verifyToken } from '../middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Verify token for all requests
  const user = await verifyToken(req, res);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (method) {
    case 'GET':
      if (req.query.id) {
        return await getResultById(req, res, user);
      }
      return await getAllResults(req, res, user);
    case 'POST':
      if (req.url?.includes('/generate')) {
        return await generateResults(req, res, user);
      }
      return res.status(405).json({ message: 'Method not allowed' });
    case 'PATCH':
      if (req.url?.includes('/publish')) {
        return await publishResult(req, res, user);
      }
      return res.status(405).json({ message: 'Method not allowed' });
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all election results
async function getAllResults(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { election_id, constituency_id, published } = req.query;
    const db = await openDB();
    
    let query = `
      SELECT er.*, e.name as election_name, c.name as constituency_name, ca.id as candidate_id,
      u.name as winner_name, ca.party as winner_party, u.photoUrl as winner_photo
      FROM election_results er
      JOIN elections e ON er.election_id = e.id
      JOIN constituencies c ON er.constituency_id = c.id
      JOIN candidates ca ON er.winner_id = ca.id
      JOIN users u ON ca.user_id = u.id
    `;
    
    const params: any[] = [];
    
    // For voters, only show published results
    if (user.role === 'voter') {
      query += ' WHERE er.published = 1';
    } else if (published !== undefined) {
      if (params.length > 0) {
        query += ' AND er.published = ?';
      } else {
        query += ' WHERE er.published = ?';
      }
      params.push(published === 'true' ? 1 : 0);
    }
    
    if (election_id) {
      if (params.length > 0) {
        query += ' AND er.election_id = ?';
      } else {
        query += ' WHERE er.election_id = ?';
      }
      params.push(election_id);
    }
    
    if (constituency_id) {
      if (params.length > 0) {
        query += ' AND er.constituency_id = ?';
      } else {
        query += ' WHERE er.constituency_id = ?';
      }
      params.push(constituency_id);
    }
    
    // Admin can only see their assigned constituencies
    if (user.role === 'admin' && user.constituency_id) {
      if (params.length > 0) {
        query += ' AND er.constituency_id = ?';
      } else {
        query += ' WHERE er.constituency_id = ?';
      }
      params.push(user.constituency_id);
    }
    
    // Order by most recent
    query += ' ORDER BY er.created_at DESC';
    
    const results = await db.all(query, params);
    
    // Get candidate results for each election result
    const resultsWithCandidates = await Promise.all(
      results.map(async (result) => {
        const candidateResults = await db.all(`
          SELECT cr.*, c.user_id, u.name, u.photoUrl, c.party, c.symbol
          FROM candidate_results cr
          JOIN candidates c ON cr.candidate_id = c.id
          JOIN users u ON c.user_id = u.id
          WHERE cr.election_result_id = ?
          ORDER BY cr.votes DESC
        `, [result.id]);
        
        return { ...result, candidates: candidateResults };
      })
    );
    
    return res.status(200).json(resultsWithCandidates);
  } catch (error) {
    console.error('Get all results error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get election result by ID
async function getResultById(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    const db = await openDB();
    
    let query = `
      SELECT er.*, e.name as election_name, c.name as constituency_name, ca.id as candidate_id,
      u.name as winner_name, ca.party as winner_party, u.photoUrl as winner_photo
      FROM election_results er
      JOIN elections e ON er.election_id = e.id
      JOIN constituencies c ON er.constituency_id = c.id
      JOIN candidates ca ON er.winner_id = ca.id
      JOIN users u ON ca.user_id = u.id
      WHERE er.id = ?
    `;
    
    const params: any[] = [id];
    
    // For voters, only show published results
    if (user.role === 'voter') {
      query += ' AND er.published = 1';
    }
    
    // Admin can only see their assigned constituencies
    if (user.role === 'admin' && user.constituency_id) {
      query += ' AND er.constituency_id = ?';
      params.push(user.constituency_id);
    }
    
    const result = await db.get(query, params);
    
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    
    // Get candidate results
    const candidateResults = await db.all(`
      SELECT cr.*, c.user_id, u.name, u.photoUrl, c.party, c.symbol
      FROM candidate_results cr
      JOIN candidates c ON cr.candidate_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE cr.election_result_id = ?
      ORDER BY cr.votes DESC
    `, [result.id]);
    
    return res.status(200).json({ ...result, candidates: candidateResults });
  } catch (error) {
    console.error('Get result by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Generate election results
async function generateResults(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    // Only superadmin can generate results
    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const { election_id, constituency_id } = req.body;
    
    if (!election_id) {
      return res.status(400).json({ message: 'Election ID is required' });
    }
    
    const db = await openDB();
    
    // Check if election exists and is completed
    const election = await db.get(
      'SELECT * FROM elections WHERE id = ? AND status = ?', 
      [election_id, 'Completed']
    );
    
    if (!election) {
      return res.status(400).json({ message: 'Election not found or not completed' });
    }
    
    // Generate results for specific constituency or all constituencies
    let constituencies = [];
    
    if (constituency_id) {
      // Single constituency
      const constituency = await db.get(
        'SELECT * FROM constituencies WHERE id = ?',
        [constituency_id]
      );
      
      if (!constituency) {
        return res.status(400).json({ message: 'Constituency not found' });
      }
      
      constituencies = [constituency];
    } else {
      // All constituencies for this election
      constituencies = await db.all(
        `SELECT DISTINCT c.* 
        FROM constituencies c
        JOIN candidates ca ON c.id = ca.constituency_id
        WHERE ca.election_id = ?`,
        [election_id]
      );
    }
    
    if (constituencies.length === 0) {
      return res.status(400).json({ message: 'No constituencies found for this election' });
    }
    
    // Generate results for each constituency
    const generatedResults = [];
    
    for (const constituency of constituencies) {
      // Count votes for each candidate
      const candidateVotes = await db.all(
        `SELECT 
          c.id, 
          c.user_id, 
          COUNT(v.id) as vote_count
        FROM candidates c
        LEFT JOIN votes v ON c.id = v.candidate_id AND v.is_valid = 1
        WHERE c.election_id = ? AND c.constituency_id = ?
        GROUP BY c.id
        ORDER BY vote_count DESC`,
        [election_id, constituency.id]
      );
      
      if (candidateVotes.length === 0) {
        continue; // Skip if no candidates
      }
      
      // Find winner (candidate with most votes)
      const winner = candidateVotes[0];
      const totalVotes = candidateVotes.reduce((sum, cv) => sum + cv.vote_count, 0);
      
      // Check if result already exists
      const existingResult = await db.get(
        'SELECT * FROM election_results WHERE election_id = ? AND constituency_id = ?',
        [election_id, constituency.id]
      );
      
      let electionResultId;
      
      if (existingResult) {
        // Update existing result
        await db.run(
          `UPDATE election_results SET 
          winner_id = ?, 
          total_votes = ?, 
          updated_at = datetime('now') 
          WHERE id = ?`,
          [winner.id, totalVotes, existingResult.id]
        );
        
        electionResultId = existingResult.id;
        
        // Delete old candidate results
        await db.run(
          'DELETE FROM candidate_results WHERE election_result_id = ?',
          [existingResult.id]
        );
      } else {
        // Create new result
        const result = await db.run(
          `INSERT INTO election_results 
          (election_id, constituency_id, winner_id, total_votes, published, created_at, updated_at)
          VALUES (?, ?, ?, ?, 0, datetime('now'), datetime('now'))`,
          [election_id, constituency.id, winner.id, totalVotes]
        );
        
        electionResultId = result.lastID;
      }
      
      // Create candidate results
      for (const candidateVote of candidateVotes) {
        const votePercentage = totalVotes > 0 
          ? (candidateVote.vote_count / totalVotes) * 100 
          : 0;
          
        await db.run(
          `INSERT INTO candidate_results 
          (election_result_id, candidate_id, votes, vote_percentage, created_at, updated_at)
          VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [electionResultId, candidateVote.id, candidateVote.vote_count, votePercentage]
        );
      }
      
      // Get the complete result with candidate details
      const completeResult = await getCompleteResult(db, electionResultId);
      generatedResults.push(completeResult);
    }
    
    return res.status(200).json({ 
      message: 'Results generated successfully',
      results: generatedResults
    });
  } catch (error) {
    console.error('Generate results error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get complete result with all details
async function getCompleteResult(db: any, resultId: number) {
  const result = await db.get(`
    SELECT er.*, e.name as election_name, c.name as constituency_name
    FROM election_results er
    JOIN elections e ON er.election_id = e.id
    JOIN constituencies c ON er.constituency_id = c.id
    WHERE er.id = ?
  `, [resultId]);
  
  const candidateResults = await db.all(`
    SELECT cr.*, c.user_id, u.name, u.photoUrl, c.party, c.symbol
    FROM candidate_results cr
    JOIN candidates c ON cr.candidate_id = c.id
    JOIN users u ON c.user_id = u.id
    WHERE cr.election_result_id = ?
    ORDER BY cr.votes DESC
  `, [resultId]);
  
  return { ...result, candidates: candidateResults };
}

// Publish/unpublish election result
async function publishResult(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    // Only superadmin can publish results
    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const { id } = req.query;
    const { published } = req.body;
    
    if (published === undefined) {
      return res.status(400).json({ message: 'Published status is required' });
    }
    
    const db = await openDB();
    
    // Check if result exists
    const result = await db.get('SELECT * FROM election_results WHERE id = ?', [id]);
    
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    
    // Update published status
    await db.run(
      'UPDATE election_results SET published = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [published ? 1 : 0, id]
    );
    
    const updatedResult = await db.get('SELECT * FROM election_results WHERE id = ?', [id]);
    
    return res.status(200).json({
      message: published ? 'Result published' : 'Result unpublished',
      result: updatedResult
    });
  } catch (error) {
    console.error('Publish result error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
