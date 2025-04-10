
import { NextApiRequest, NextApiResponse } from 'next';
import { openDB } from '../db';
import { verifyToken } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Verify token for all requests
  const user = await verifyToken(req, res);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Only admin and superadmin can access voter management
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  switch (method) {
    case 'GET':
      if (req.query.id) {
        return await getVoterById(req, res, user);
      }
      return await getAllVoters(req, res, user);
    case 'POST':
      return await createVoter(req, res, user);
    case 'PUT':
      return await updateVoter(req, res, user);
    case 'DELETE':
      return await deleteVoter(req, res, user);
    case 'PATCH':
      if (req.url?.includes('/status')) {
        return await updateVoterStatus(req, res, user);
      }
      return res.status(405).json({ message: 'Method not allowed' });
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all voters
async function getAllVoters(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { search, status, constituency_id } = req.query;
    const db = await openDB();
    
    let query = `
      SELECT u.*, c.name as constituency_name, b.name as booth_name
      FROM users u
      LEFT JOIN constituencies c ON u.constituency_id = c.id
      LEFT JOIN booths b ON u.booth_id = b.id
      WHERE u.role = 'voter'
    `;
    
    const params: any[] = [];
    
    // Add search filter if provided
    if (search) {
      query += ` AND (u.name LIKE ? OR u.voter_id LIKE ? OR u.email LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    // Add status filter if provided
    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }
    
    // Admin can only see voters from their constituency
    if (user.role === 'admin' && user.constituency_id) {
      query += ` AND u.constituency_id = ?`;
      params.push(user.constituency_id);
    }
    // Superadmin can filter by constituency
    else if (constituency_id && user.role === 'superadmin') {
      query += ` AND u.constituency_id = ?`;
      params.push(constituency_id);
    }
    
    // Order by name
    query += ` ORDER BY u.name ASC`;
    
    const voters = await db.all(query, params);
    
    // Remove sensitive information
    const sanitizedVoters = voters.map(voter => {
      const { password, ...voterWithoutPassword } = voter;
      return {
        ...voterWithoutPassword,
        booth: voter.booth_name // Set booth name for frontend display
      };
    });
    
    return res.status(200).json(sanitizedVoters);
  } catch (error) {
    console.error('Get all voters error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get voter by ID
async function getVoterById(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    const db = await openDB();
    
    let query = `
      SELECT u.*, c.name as constituency_name, b.name as booth_name
      FROM users u
      LEFT JOIN constituencies c ON u.constituency_id = c.id
      LEFT JOIN booths b ON u.booth_id = b.id
      WHERE u.id = ? AND u.role = 'voter'
    `;
    
    const params: any[] = [id];
    
    // Admin can only see voters from their constituency
    if (user.role === 'admin' && user.constituency_id) {
      query += ` AND u.constituency_id = ?`;
      params.push(user.constituency_id);
    }
    
    const voter = await db.get(query, params);
    
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }
    
    // Remove sensitive information
    const { password, ...voterWithoutPassword } = voter;
    
    return res.status(200).json({
      ...voterWithoutPassword,
      booth: voter.booth_name // Set booth name for frontend display
    });
  } catch (error) {
    console.error('Get voter by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Create new voter
async function createVoter(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const {
      name,
      email,
      phone,
      voter_id,
      constituency_id,
      booth_id,
      password,
      status = 'Pending'
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !voter_id) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    const db = await openDB();
    
    // Check if email already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Check if voter ID already exists
    const existingVoterId = await db.get('SELECT * FROM users WHERE voter_id = ?', [voter_id]);
    if (existingVoterId) {
      return res.status(400).json({ message: 'Voter ID already registered' });
    }
    
    // Admin can only create voters for their constituency
    if (user.role === 'admin' && user.constituency_id) {
      if (constituency_id && constituency_id !== user.constituency_id) {
        return res.status(403).json({ message: 'You can only create voters for your constituency' });
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate UUID for user ID
    const id = uuidv4();
    
    // Insert new voter
    await db.run(`
      INSERT INTO users (
        id, name, email, password, role, status, voter_id, phone,
        constituency_id, booth_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, name, email, hashedPassword, 'voter', status, voter_id, phone || null,
      constituency_id || null, booth_id || null
    ]);
    
    // Get created voter
    const createdVoter = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    
    // Remove sensitive information
    const { password: pwd, ...voterWithoutPassword } = createdVoter;
    
    return res.status(201).json(voterWithoutPassword);
  } catch (error) {
    console.error('Create voter error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update voter
async function updateVoter(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    const {
      name,
      email,
      phone,
      voter_id,
      constituency_id,
      booth_id,
      password,
      status
    } = req.body;
    
    if (!id) {
      return res.status(400).json({ message: 'Voter ID is required' });
    }
    
    const db = await openDB();
    
    // Check if voter exists
    let query = 'SELECT * FROM users WHERE id = ? AND role = ?';
    const params = [id, 'voter'];
    
    // Admin can only update voters from their constituency
    if (user.role === 'admin' && user.constituency_id) {
      query += ' AND constituency_id = ?';
      params.push(user.constituency_id);
    }
    
    const voter = await db.get(query, params);
    
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }
    
    // Admin can only update voters to their constituency
    if (user.role === 'admin' && user.constituency_id) {
      if (constituency_id && constituency_id !== user.constituency_id) {
        return res.status(403).json({ message: 'You can only update voters to your constituency' });
      }
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== voter.email) {
      const existingEmail = await db.get('SELECT * FROM users WHERE email = ? AND id != ?', [email, id]);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }
    
    // Check if voter_id is being changed and if it already exists
    if (voter_id && voter_id !== voter.voter_id) {
      const existingVoterId = await db.get('SELECT * FROM users WHERE voter_id = ? AND id != ?', [voter_id, id]);
      if (existingVoterId) {
        return res.status(400).json({ message: 'Voter ID already registered' });
      }
    }
    
    // Build update object
    const updates: Record<string, any> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone || null;
    if (voter_id) updates.voter_id = voter_id;
    if (constituency_id !== undefined) updates.constituency_id = constituency_id || null;
    if (booth_id !== undefined) updates.booth_id = booth_id || null;
    if (status) updates.status = status;
    
    // Hash password if provided
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }
    
    updates.updated_at = 'datetime(\'now\')';
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    // Build SQL query
    const setClauses = Object.entries(updates)
      .map(([key, value]) => {
        if (value === 'datetime(\'now\')') {
          return `${key} = datetime('now')`;
        }
        return `${key} = ?`;
      })
      .join(', ');
    
    const values = Object.entries(updates)
      .filter(([key, value]) => value !== 'datetime(\'now\')')
      .map(([key, value]) => value);
    
    // Update voter
    await db.run(
      `UPDATE users SET ${setClauses} WHERE id = ?`,
      [...values, id]
    );
    
    // Get updated voter
    const updatedVoter = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    
    // Remove sensitive information
    const { password: pwd, ...voterWithoutPassword } = updatedVoter;
    
    return res.status(200).json(voterWithoutPassword);
  } catch (error) {
    console.error('Update voter error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete voter
async function deleteVoter(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'Voter ID is required' });
    }
    
    const db = await openDB();
    
    // Check if voter exists
    let query = 'SELECT * FROM users WHERE id = ? AND role = ?';
    const params = [id, 'voter'];
    
    // Admin can only delete voters from their constituency
    if (user.role === 'admin' && user.constituency_id) {
      query += ' AND constituency_id = ?';
      params.push(user.constituency_id);
    }
    
    const voter = await db.get(query, params);
    
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }
    
    // Check if voter has already voted
    const hasVoted = await db.get('SELECT * FROM votes WHERE voter_id = ?', [id]);
    
    if (hasVoted) {
      return res.status(400).json({ message: 'Cannot delete voter with registered votes' });
    }
    
    // Delete voter
    await db.run('DELETE FROM users WHERE id = ?', [id]);
    
    return res.status(200).json({ message: 'Voter deleted successfully' });
  } catch (error) {
    console.error('Delete voter error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update voter status
async function updateVoterStatus(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    const { status } = req.body;
    
    if (!id || !status) {
      return res.status(400).json({ message: 'Voter ID and status are required' });
    }
    
    if (!['Active', 'Inactive', 'Pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const db = await openDB();
    
    // Check if voter exists
    let query = 'SELECT * FROM users WHERE id = ? AND role = ?';
    const params = [id, 'voter'];
    
    // Admin can only update voters from their constituency
    if (user.role === 'admin' && user.constituency_id) {
      query += ' AND constituency_id = ?';
      params.push(user.constituency_id);
    }
    
    const voter = await db.get(query, params);
    
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }
    
    // Update status
    await db.run(
      'UPDATE users SET status = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [status, id]
    );
    
    // Get updated voter
    const updatedVoter = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    
    // Remove sensitive information
    const { password, ...voterWithoutPassword } = updatedVoter;
    
    return res.status(200).json({
      message: 'Voter status updated successfully',
      voter: voterWithoutPassword
    });
  } catch (error) {
    console.error('Update voter status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
