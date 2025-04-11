
export default async function handler(req, res) {
  const { method } = req;

  // Verify token for all requests
  const user = await verifyToken(req, res);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
    return;
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

// Get all results
async function getAllResults(req, res, user) {
  try {
    const { election_id, constituency_id, published } = req.query;
    const db = await openDB();
    
    let query = `
      SELECT r.*, e.name as election_name, e.type as election_type, 
      c.name as constituency_name, c.state, c.district
      FROM results r
      JOIN elections e ON r.election_id = e.id
      LEFT JOIN constituencies c ON r.constituency_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filter by election if provided
    if (election_id) {
      query += ` AND r.election_id = ?`;
      params.push(election_id);
    }
    
    // Filter by constituency if provided
    if (constituency_id) {
      query += ` AND r.constituency_id = ?`;
      params.push(constituency_id);
    }
    
    // Filter by published status
    if (published !== undefined) {
      const publishedValue = published === 'true' || published === true ? 1 : 0;
      query += ` AND r.published = ?`;
      params.push(publishedValue);
    }
    
    // Role-based restrictions
    if (user.role === 'voter') {
      // Voters can only see published results
      query += ` AND r.published = 1`;
    } else if (user.role === 'admin' && user.constituency_id) {
      // Admins can only see results for their constituency
      query += ` AND (r.constituency_id = ? OR r.constituency_id IS NULL)`;
      params.push(user.constituency_id);
    }
    
    // Order by completion date
    query += ` ORDER BY r.completed_date DESC`;
    
    const results = await db.all(query, params);
    
    // Get candidate results for each result
    const resultsWithCandidates = await Promise.all(
      results.map(async (result) => {
        const candidates = await db.all(`
          SELECT cr.*, c.name, c.party, c.photo_url, c.symbol_url
          FROM candidate_results cr
          JOIN candidates c ON cr.candidate_id = c.id
          WHERE cr.result_id = ?
          ORDER BY cr.votes DESC
        `, [result.id]);
        
        return {
          ...result,
          candidates
        };
      })
    );
    
    return res.status(200).json(resultsWithCandidates);
  } catch (error) {
    console.error('Get all results error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get result by ID
async function getResultById(req, res, user) {
  try {
    const { id } = req.query;
    const db = await openDB();
    
    const result = await db.get(`
      SELECT r.*, e.name as election_name, e.type as election_type, 
      c.name as constituency_name, c.state, c.district
      FROM results r
      JOIN elections e ON r.election_id = e.id
      LEFT JOIN constituencies c ON r.constituency_id = c.id
      WHERE r.id = ?
    `, [id]);
    
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    
    // Role-based restrictions
    if (user.role === 'voter' && result.published !== 1) {
      return res.status(403).json({ message: 'Result not published yet' });
    }
    
    if (user.role === 'admin' && user.constituency_id) {
      if (result.constituency_id && result.constituency_id !== user.constituency_id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }
    
    // Get candidate results
    const candidates = await db.all(`
      SELECT cr.*, c.name, c.party, c.photo_url, c.symbol_url
      FROM candidate_results cr
      JOIN candidates c ON cr.candidate_id = c.id
      WHERE cr.result_id = ?
      ORDER BY cr.votes DESC
    `, [id]);
    
    const resultWithCandidates = {
      ...result,
      candidates
    };
    
    return res.status(200).json(resultWithCandidates);
  } catch (error) {
    console.error('Get result by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Generate results for an election
async function generateResults(req, res, user) {
  try {
    const { election_id, constituency_id } = req.body;
    
    if (!election_id) {
      return res.status(400).json({ message: 'Election ID is required' });
    }
    
    // Only superadmin can generate results
    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can generate results' });
    }
    
    const db = await openDB();
    
    // Check if election exists and is completed
    const election = await db.get('SELECT * FROM elections WHERE id = ?', [election_id]);
    
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    
    if (election.status !== 'Completed') {
      return res.status(400).json({ message: 'Results can only be generated for completed elections' });
    }
    
    // Check if results already exist
    const existingResults = await db.get(
      'SELECT id FROM results WHERE election_id = ? AND constituency_id IS ?',
      [election_id, constituency_id || null]
    );
    
    if (existingResults) {
      return res.status(400).json({ message: 'Results already generated for this election' });
    }
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Get total votes and voter turnout
      let votesQuery = `
        SELECT COUNT(*) as total_votes
        FROM votes
        WHERE election_id = ?
      `;
      
      const params = [election_id];
      
      if (constituency_id) {
        votesQuery += ` AND booth_id IN (SELECT id FROM booths WHERE constituency_id = ?)`;
        params.push(constituency_id);
      }
      
      const votesResult = await db.get(votesQuery, params);
      const totalVotes = votesResult ? votesResult.total_votes : 0;
      
      // Calculate voter turnout (would need total registered voters data)
      // For now, we'll use a default or placeholder value
      const voterTurnout = 65.0; // Placeholder
      
      // Insert result record
      const resultInsert = await db.run(`
        INSERT INTO results (
          election_id, constituency_id, total_votes, voter_turnout,
          completed_date, published, published_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, datetime('now'), 0, NULL, datetime('now'), datetime('now'))
      `, [election_id, constituency_id, totalVotes, voterTurnout]);
      
      const resultId = resultInsert.lastID;
      
      // Get vote counts for each candidate
      let candidateQuery = `
        SELECT v.candidate_id, COUNT(*) as vote_count
        FROM votes v
        WHERE v.election_id = ?
      `;
      
      const candidateParams = [election_id];
      
      if (constituency_id) {
        candidateQuery += ` AND v.booth_id IN (SELECT id FROM booths WHERE constituency_id = ?)`;
        candidateParams.push(constituency_id);
      }
      
      candidateQuery += ` GROUP BY v.candidate_id`;
      
      const candidateVotes = await db.all(candidateQuery, candidateParams);
      
      // Insert candidate results
      for (const cv of candidateVotes) {
        const percentage = totalVotes > 0 ? (cv.vote_count / totalVotes) * 100 : 0;
        
        await db.run(`
          INSERT INTO candidate_results (result_id, candidate_id, votes, percentage)
          VALUES (?, ?, ?, ?)
        `, [resultId, cv.candidate_id, cv.vote_count, percentage.toFixed(2)]);
      }
      
      // Commit transaction
      await db.run('COMMIT');
      
      // Get the generated result with candidates
      const generatedResult = await getResultById({ query: { id: resultId } }, { status: () => ({ json: () => ({}) }) }, user);
      
      return res.status(201).json(generatedResult);
    } catch (error) {
      // Rollback on error
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Generate results error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Publish or unpublish result
async function publishResult(req, res, user) {
  try {
    const { id } = req.query;
    const { published } = req.body;
    
    if (!id) {
      return res.status(400).json({ message: 'Result ID is required' });
    }
    
    if (published === undefined) {
      return res.status(400).json({ message: 'Published status is required' });
    }
    
    // Only superadmin can publish/unpublish results
    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can publish/unpublish results' });
    }
    
    const db = await openDB();
    
    // Check if result exists
    const result = await db.get('SELECT * FROM results WHERE id = ?', [id]);
    
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    
    // Update published status
    const publishedValue = published ? 1 : 0;
    const publishedDate = published ? 'datetime(\'now\')' : 'NULL';
    
    await db.run(`
      UPDATE results
      SET published = ?, published_date = ${publishedDate}, updated_at = datetime('now')
      WHERE id = ?
    `, [publishedValue, id]);
    
    // Get updated result
    const updatedResult = await getResultById({ query: { id } }, { status: () => ({ json: () => ({}) }) }, user);
    
    return res.status(200).json({
      message: published ? 'Result published successfully' : 'Result unpublished successfully',
      result: updatedResult
    });
  } catch (error) {
    console.error('Publish result error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
