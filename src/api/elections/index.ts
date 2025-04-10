
import { NextApiRequest, NextApiResponse } from 'next';
import { Election } from '../../database/schema';
import { openDB } from '../db';
import { verifyToken } from '../middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Verify token for all requests
  const user = await verifyToken(req, res);
  if (!user) {
    return;
  }

  switch (method) {
    case 'GET':
      if (req.query.id) {
        return await getElectionById(req, res, user);
      }
      return await getAllElections(req, res, user);
    case 'POST':
      return await createElection(req, res, user);
    case 'PUT':
      return await updateElection(req, res, user);
    case 'DELETE':
      return await deleteElection(req, res, user);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all elections
async function getAllElections(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { status, type, state, district, constituency_id } = req.query;
    const db = await openDB();
    
    let query = `
      SELECT e.*, c.name as constituency_name
      FROM elections e
      LEFT JOIN constituencies c ON e.constituency_id = c.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // Apply filters
    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }
    
    if (type) {
      query += ' AND e.type = ?';
      params.push(type);
    }
    
    if (state) {
      query += ' AND e.state = ?';
      params.push(state);
    }
    
    if (district) {
      query += ' AND e.district = ?';
      params.push(district);
    }
    
    if (constituency_id) {
      query += ' AND e.constituency_id = ?';
      params.push(constituency_id);
    }
    
    // Role-based restrictions
    if (user.role === 'admin' && user.constituency_id) {
      // Admins can see elections for their constituency
      query += ' AND (e.constituency_id = ? OR e.constituency_id IS NULL)';
      params.push(user.constituency_id);
    } else if (user.role === 'voter' && user.constituency_id) {
      // Voters can see elections for their constituency
      query += ' AND (e.constituency_id = ? OR e.constituency_id IS NULL)';
      params.push(user.constituency_id);
      
      // Voters can only see ongoing or upcoming elections
      query += ' AND e.status IN (?, ?)';
      params.push('Ongoing', 'Upcoming');
    }
    
    // Order by election date
    query += ' ORDER BY e.election_date DESC';
    
    const elections = await db.all(query, params);
    
    return res.status(200).json(elections);
  } catch (error) {
    console.error('Get all elections error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get election by ID
async function getElectionById(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    const db = await openDB();
    
    let query = `
      SELECT e.*, c.name as constituency_name, c.state as constituency_state, c.district as constituency_district
      FROM elections e
      LEFT JOIN constituencies c ON e.constituency_id = c.id
      WHERE e.id = ?
    `;
    
    const params: any[] = [id];
    
    // Role-based restrictions
    if (user.role === 'voter') {
      // Voters can only see ongoing or upcoming elections
      query += ' AND e.status IN (?, ?)';
      params.push('Ongoing', 'Upcoming');
    }
    
    const election = await db.get(query, params);
    
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    
    // Get candidates for this election
    const candidates = await db.all(`
      SELECT c.*, u.name, u.email, u.photoUrl
      FROM candidates c
      JOIN users u ON c.user_id = u.id
      WHERE c.election_id = ?
    `, [id]);
    
    // Include candidates in the response
    election.candidates = candidates;
    
    return res.status(200).json(election);
  } catch (error) {
    console.error('Get election by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Create election
async function createElection(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    // Only superadmin can create elections
    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const {
      name,
      election_date,
      nomination_start,
      nomination_end,
      campaign_end,
      voting_start,
      voting_end,
      type,
      state,
      district,
      constituency_id
    } = req.body;
    
    // Validate required fields
    if (!name || !election_date || !nomination_start || !nomination_end ||
        !campaign_end || !voting_start || !voting_end || !type) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    const db = await openDB();
    
    // Check if constituency exists (if provided)
    if (constituency_id) {
      const constituencyExists = await db.get(
        'SELECT id FROM constituencies WHERE id = ?',
        [constituency_id]
      );
      if (!constituencyExists) {
        return res.status(400).json({ message: 'Constituency not found' });
      }
    }
    
    // Determine initial status based on dates
    const now = new Date();
    const votingStart = new Date(voting_start);
    const votingEnd = new Date(voting_end);
    const nominationStart = new Date(nomination_start);
    
    let status = 'Upcoming';
    
    if (now >= votingStart && now <= votingEnd) {
      status = 'Ongoing';
    } else if (now > votingEnd) {
      status = 'Completed';
    } else if (now < nominationStart) {
      status = 'Upcoming';
    }
    
    // Insert election
    const result = await db.run(`
      INSERT INTO elections 
      (name, election_date, nomination_start, nomination_end, campaign_end, 
       voting_start, voting_end, type, status, result_published, 
       state, district, constituency_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      name, election_date, nomination_start, nomination_end, campaign_end,
      voting_start, voting_end, type, status, 0,
      state || null, district || null, constituency_id || null
    ]);
    
    const electionId = result.lastID;
    
    // Get created election
    const createdElection = await db.get('SELECT * FROM elections WHERE id = ?', [electionId]);
    
    return res.status(201).json(createdElection);
  } catch (error) {
    console.error('Create election error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update election
async function updateElection(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    
    // Only superadmin can update elections
    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    if (!id) {
      return res.status(400).json({ message: 'Election ID is required' });
    }
    
    const {
      name,
      election_date,
      nomination_start,
      nomination_end,
      campaign_end,
      voting_start,
      voting_end,
      type,
      status,
      state,
      district,
      constituency_id
    } = req.body;
    
    const db = await openDB();
    
    // Check if election exists
    const election = await db.get<Election>('SELECT * FROM elections WHERE id = ?', [id]);
    
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    
    // Check if constituency exists (if changing)
    if (constituency_id && constituency_id !== election.constituency_id) {
      const constituencyExists = await db.get(
        'SELECT id FROM constituencies WHERE id = ?',
        [constituency_id]
      );
      if (!constituencyExists) {
        return res.status(400).json({ message: 'Constituency not found' });
      }
    }
    
    // Build update object
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (election_date !== undefined) updates.election_date = election_date;
    if (nomination_start !== undefined) updates.nomination_start = nomination_start;
    if (nomination_end !== undefined) updates.nomination_end = nomination_end;
    if (campaign_end !== undefined) updates.campaign_end = campaign_end;
    if (voting_start !== undefined) updates.voting_start = voting_start;
    if (voting_end !== undefined) updates.voting_end = voting_end;
    if (type !== undefined) updates.type = type;
    if (status !== undefined) updates.status = status;
    if (state !== undefined) updates.state = state;
    if (district !== undefined) updates.district = district;
    if (constituency_id !== undefined) updates.constituency_id = constituency_id;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    // Build SQL query
    const setClauses = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    // Update election
    await db.run(
      `UPDATE elections SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`,
      [...values, id]
    );
    
    // Get updated election
    const updatedElection = await db.get('SELECT * FROM elections WHERE id = ?', [id]);
    
    return res.status(200).json(updatedElection);
  } catch (error) {
    console.error('Update election error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete election
async function deleteElection(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    
    // Only superadmin can delete elections
    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    if (!id) {
      return res.status(400).json({ message: 'Election ID is required' });
    }
    
    const db = await openDB();
    
    // Check if election exists
    const election = await db.get('SELECT * FROM elections WHERE id = ?', [id]);
    
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    
    // Check if there are any votes for this election
    const votes = await db.get('SELECT COUNT(*) as count FROM votes WHERE election_id = ?', [id]);
    
    if (votes.count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete election with registered votes. Change status to cancelled instead.' 
      });
    }
    
    // Delete candidates first (foreign key constraint)
    await db.run('DELETE FROM candidates WHERE election_id = ?', [id]);
    
    // Delete election
    await db.run('DELETE FROM elections WHERE id = ?', [id]);
    
    return res.status(200).json({ message: 'Election deleted successfully' });
  } catch (error) {
    console.error('Delete election error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
