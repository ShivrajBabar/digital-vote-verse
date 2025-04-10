
import { NextApiRequest, NextApiResponse } from 'next';
import { Candidate } from '../../database/schema';
import { openDB } from '../db';
import { verifyToken } from '../middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Verify token for all requests
  const user = await verifyToken(req, res);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Check role permissions
  if (user.role !== 'superadmin' && user.role !== 'admin' && method !== 'GET') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  switch (method) {
    case 'GET':
      if (req.query.id) {
        return await getCandidateById(req, res, user);
      }
      return await getAllCandidates(req, res, user);
    case 'POST':
      return await createCandidate(req, res, user);
    case 'PUT':
      return await updateCandidate(req, res, user);
    case 'PATCH':
      if (req.url?.includes('/status')) {
        return await updateCandidateStatus(req, res, user);
      }
      return res.status(405).json({ message: 'Method not allowed' });
    case 'DELETE':
      return await deleteCandidate(req, res, user);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all candidates
async function getAllCandidates(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const db = await openDB();
    let query = `
      SELECT c.*, u.name, u.email, u.photoUrl, co.name as constituency_name, e.name as election_name
      FROM candidates c
      JOIN users u ON c.user_id = u.id
      JOIN constituencies co ON c.constituency_id = co.id
      JOIN elections e ON c.election_id = e.id
    `;
    
    const params: any[] = [];
    
    // Filter by constituency for admin users
    if (user.role === 'admin' && user.constituency_id) {
      query += ' WHERE c.constituency_id = ?';
      params.push(user.constituency_id);
    }
    
    // Additional filters
    const { election_id, constituency_id, status, party } = req.query;
    
    if (election_id) {
      query += params.length ? ' AND c.election_id = ?' : ' WHERE c.election_id = ?';
      params.push(election_id);
    }
    
    if (constituency_id) {
      query += params.length ? ' AND c.constituency_id = ?' : ' WHERE c.constituency_id = ?';
      params.push(constituency_id);
    }
    
    if (status) {
      query += params.length ? ' AND c.status = ?' : ' WHERE c.status = ?';
      params.push(status);
    }
    
    if (party) {
      query += params.length ? ' AND c.party = ?' : ' WHERE c.party = ?';
      params.push(party);
    }
    
    // Add ordering
    query += ' ORDER BY c.created_at DESC';
    
    const candidates = await db.all(query, params);
    
    return res.status(200).json(candidates);
  } catch (error) {
    console.error('Get all candidates error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get candidate by id
async function getCandidateById(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    const db = await openDB();
    
    let query = `
      SELECT c.*, u.name, u.email, u.photoUrl, co.name as constituency_name, e.name as election_name
      FROM candidates c
      JOIN users u ON c.user_id = u.id
      JOIN constituencies co ON c.constituency_id = co.id
      JOIN elections e ON c.election_id = e.id
      WHERE c.id = ?
    `;
    
    const params: any[] = [id];
    
    // Filter by constituency for admin users
    if (user.role === 'admin' && user.constituency_id) {
      query += ' AND c.constituency_id = ?';
      params.push(user.constituency_id);
    }
    
    const candidate = await db.get(query, params);
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    return res.status(200).json(candidate);
  } catch (error) {
    console.error('Get candidate by id error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Create candidate
async function createCandidate(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { user_id, election_id, constituency_id, party, symbol, symbol_image, age } = req.body;
    
    if (!user_id || !election_id || !constituency_id || !party || !symbol || !age) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Only superadmin can create candidates
    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const db = await openDB();
    
    // Check if user exists
    const userExists = await db.get('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!userExists) {
      return res.status(400).json({ message: 'User does not exist' });
    }
    
    // Check if election exists
    const electionExists = await db.get('SELECT id FROM elections WHERE id = ?', [election_id]);
    if (!electionExists) {
      return res.status(400).json({ message: 'Election does not exist' });
    }
    
    // Check if constituency exists
    const constituencyExists = await db.get('SELECT id FROM constituencies WHERE id = ?', [constituency_id]);
    if (!constituencyExists) {
      return res.status(400).json({ message: 'Constituency does not exist' });
    }
    
    // Check if candidate already registered for this election
    const candidateExists = await db.get(
      'SELECT id FROM candidates WHERE user_id = ? AND election_id = ?',
      [user_id, election_id]
    );
    if (candidateExists) {
      return res.status(400).json({ message: 'Candidate already registered for this election' });
    }
    
    const result = await db.run(`
      INSERT INTO candidates 
      (user_id, election_id, constituency_id, party, symbol, symbol_image, age, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [user_id, election_id, constituency_id, party, symbol, symbol_image, age, 'Pending']);
    
    const newCandidate = await db.get('SELECT * FROM candidates WHERE id = ?', [result.lastID]);
    
    return res.status(201).json(newCandidate);
  } catch (error) {
    console.error('Create candidate error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update candidate
async function updateCandidate(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    const { party, symbol, symbol_image, age } = req.body;
    
    if (!id) {
      return res.status(400).json({ message: 'Candidate ID is required' });
    }
    
    // Only superadmin can update candidates
    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const db = await openDB();
    
    // Check if candidate exists
    const candidate = await db.get<Candidate>('SELECT * FROM candidates WHERE id = ?', [id]);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    // Update fields
    const updatedFields: Partial<Candidate> = {};
    if (party !== undefined) updatedFields.party = party;
    if (symbol !== undefined) updatedFields.symbol = symbol;
    if (symbol_image !== undefined) updatedFields.symbol_image = symbol_image;
    if (age !== undefined) updatedFields.age = age;
    
    // Build update query
    const fields = Object.keys(updatedFields)
      .map((field) => `${field} = ?`)
      .join(', ');
    
    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    await db.run(
      `UPDATE candidates SET ${fields}, updated_at = datetime('now') WHERE id = ?`,
      [...Object.values(updatedFields), id]
    );
    
    const updatedCandidate = await db.get('SELECT * FROM candidates WHERE id = ?', [id]);
    
    return res.status(200).json(updatedCandidate);
  } catch (error) {
    console.error('Update candidate error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update candidate status
async function updateCandidateStatus(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    const { status } = req.body;
    
    if (!id) {
      return res.status(400).json({ message: 'Candidate ID is required' });
    }
    
    if (!status || !['Approved', 'Pending', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required (Approved, Pending, Rejected)' });
    }
    
    // Only superadmin can update candidate status
    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const db = await openDB();
    
    // Check if candidate exists
    const candidate = await db.get<Candidate>('SELECT * FROM candidates WHERE id = ?', [id]);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    await db.run(
      'UPDATE candidates SET status = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [status, id]
    );
    
    const updatedCandidate = await db.get('SELECT * FROM candidates WHERE id = ?', [id]);
    
    return res.status(200).json(updatedCandidate);
  } catch (error) {
    console.error('Update candidate status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete candidate
async function deleteCandidate(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'Candidate ID is required' });
    }
    
    // Only superadmin can delete candidates
    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const db = await openDB();
    
    // Check if candidate exists
    const candidate = await db.get<Candidate>('SELECT * FROM candidates WHERE id = ?', [id]);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    await db.run('DELETE FROM candidates WHERE id = ?', [id]);
    
    return res.status(200).json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Delete candidate error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
