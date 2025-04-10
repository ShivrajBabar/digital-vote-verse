
import { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../database/schema';
import { openDB } from '../db';
import { verifyToken } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Verify token for all requests except some public endpoints
  const user = await verifyToken(req, res);
  if (!user) {
    return;
  }

  switch (method) {
    case 'GET':
      if (req.query.id) {
        return await getUserById(req, res, user);
      }
      return await getAllUsers(req, res, user);
    case 'POST':
      return await createUser(req, res, user);
    case 'PUT':
      return await updateUser(req, res, user);
    case 'PATCH':
      if (req.url?.includes('/status')) {
        return await updateUserStatus(req, res, user);
      }
      return res.status(405).json({ message: 'Method not allowed' });
    case 'DELETE':
      return await deleteUser(req, res, user);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all users
async function getAllUsers(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { role, status, constituency_id } = req.query;
    const db = await openDB();
    
    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];
    
    // Filter by role if provided
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    
    // Filter by status if provided
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    // Filter by constituency if provided
    if (constituency_id) {
      query += ' AND constituency_id = ?';
      params.push(constituency_id);
    }
    
    // Role-based restrictions
    if (user.role === 'admin') {
      // Admins can only see voters in their constituency
      query += ' AND role = ? AND constituency_id = ?';
      params.push('voter', user.constituency_id);
    } else if (user.role === 'superadmin') {
      // Superadmins can see admins and voters but not other superadmins
      if (!role) {
        query += ' AND role != ?';
        params.push('superadmin');
      }
    } else {
      // Voters can only see themselves
      query += ' AND id = ?';
      params.push(user.id);
    }
    
    // Hide passwords
    query = query.replace('SELECT *', 'SELECT id, name, email, role, status, photoUrl, constituency_id, voter_id, phone, created_at, updated_at');
    
    // Order by creation date
    query += ' ORDER BY created_at DESC';
    
    const users = await db.all(query, params);
    
    // Get constituency info for each user
    const usersWithConstituency = await Promise.all(
      users.map(async (userItem) => {
        if (userItem.constituency_id) {
          const constituency = await db.get(
            'SELECT name, state, district FROM constituencies WHERE id = ?',
            [userItem.constituency_id]
          );
          
          return {
            ...userItem,
            constituency: constituency || null
          };
        }
        
        return userItem;
      })
    );
    
    return res.status(200).json(usersWithConstituency);
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get user by ID
async function getUserById(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    const db = await openDB();
    
    // Role-based restrictions
    if (user.role === 'voter' && user.id !== id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    if (user.role === 'admin') {
      // Admins can only view voters in their constituency
      const targetUser = await db.get(
        'SELECT role, constituency_id FROM users WHERE id = ?',
        [id]
      );
      
      if (!targetUser || 
          targetUser.role !== 'voter' || 
          targetUser.constituency_id !== user.constituency_id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }
    
    // Get user without password
    const foundUser = await db.get(
      `SELECT id, name, email, role, status, photoUrl, constituency_id, 
      voter_id, phone, created_at, updated_at 
      FROM users WHERE id = ?`,
      [id]
    );
    
    if (!foundUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get constituency info
    if (foundUser.constituency_id) {
      const constituency = await db.get(
        'SELECT name, state, district FROM constituencies WHERE id = ?',
        [foundUser.constituency_id]
      );
      
      if (constituency) {
        foundUser.constituency = constituency;
      }
    }
    
    return res.status(200).json(foundUser);
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Create user
async function createUser(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const {
      name,
      email,
      password,
      role,
      constituency_id,
      voter_id,
      phone,
      photoUrl
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Role-based permissions
    if (user.role === 'voter') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    if (user.role === 'admin' && role !== 'voter') {
      return res.status(403).json({ message: 'Admins can only create voters' });
    }
    
    if (user.role === 'admin' && constituency_id !== user.constituency_id) {
      return res.status(403).json({ message: 'Admins can only create voters in their constituency' });
    }
    
    if (user.role === 'superadmin' && role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot create more superadmins' });
    }
    
    const db = await openDB();
    
    // Check if email already exists
    const emailExists = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (emailExists) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Check if voter_id already exists (if provided)
    if (voter_id) {
      const voterIdExists = await db.get('SELECT id FROM users WHERE voter_id = ?', [voter_id]);
      if (voterIdExists) {
        return res.status(400).json({ message: 'Voter ID already in use' });
      }
    }
    
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
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate UUID for user ID
    const id = uuidv4();
    
    // Set status based on role
    const status = role === 'voter' ? 'Pending' : 'Active';
    
    // Insert user
    await db.run(
      `INSERT INTO users 
      (id, name, email, password, role, status, photoUrl, constituency_id, voter_id, phone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, name, email, hashedPassword, role, status, photoUrl, constituency_id, voter_id, phone]
    );
    
    // Get created user without password
    const createdUser = await db.get(
      `SELECT id, name, email, role, status, photoUrl, constituency_id, 
      voter_id, phone, created_at, updated_at 
      FROM users WHERE id = ?`,
      [id]
    );
    
    return res.status(201).json(createdUser);
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update user
async function updateUser(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    const {
      name,
      email,
      password,
      constituency_id,
      voter_id,
      phone,
      photoUrl
    } = req.body;
    
    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const db = await openDB();
    
    // Get target user
    const targetUser = await db.get<User>('SELECT * FROM users WHERE id = ?', [id]);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Role-based permissions
    if (user.role === 'voter' && user.id !== id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    if (user.role === 'admin') {
      // Admins can only update voters in their constituency
      if (targetUser.role !== 'voter' || targetUser.constituency_id !== user.constituency_id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Admins cannot change voter's constituency
      if (constituency_id && constituency_id !== user.constituency_id) {
        return res.status(403).json({ message: 'Cannot change to a different constituency' });
      }
    }
    
    // Check if email already exists (if changing)
    if (email && email !== targetUser.email) {
      const emailExists = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Check if voter_id already exists (if changing)
    if (voter_id && voter_id !== targetUser.voter_id) {
      const voterIdExists = await db.get('SELECT id FROM users WHERE voter_id = ? AND id != ?', [voter_id, id]);
      if (voterIdExists) {
        return res.status(400).json({ message: 'Voter ID already in use' });
      }
    }
    
    // Check if constituency exists (if changing)
    if (constituency_id && constituency_id !== targetUser.constituency_id) {
      const constituencyExists = await db.get(
        'SELECT id FROM constituencies WHERE id = ?',
        [constituency_id]
      );
      if (!constituencyExists) {
        return res.status(400).json({ message: 'Constituency not found' });
      }
    }
    
    // Build update query
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (constituency_id !== undefined) updates.constituency_id = constituency_id;
    if (voter_id !== undefined) updates.voter_id = voter_id;
    if (phone !== undefined) updates.phone = phone;
    if (photoUrl !== undefined) updates.photoUrl = photoUrl;
    
    // Hash password if provided
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    // Add update timestamp
    updates.updated_at = new Date().toISOString();
    
    // Build SQL query
    const setClauses = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    // Update user
    await db.run(
      `UPDATE users SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`,
      [...values, id]
    );
    
    // Get updated user without password
    const updatedUser = await db.get(
      `SELECT id, name, email, role, status, photoUrl, constituency_id, 
      voter_id, phone, created_at, updated_at 
      FROM users WHERE id = ?`,
      [id]
    );
    
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update user status
async function updateUserStatus(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    const { status } = req.body;
    
    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    if (!status || !['Active', 'Inactive', 'Pending'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required (Active, Inactive, Pending)' });
    }
    
    const db = await openDB();
    
    // Get target user
    const targetUser = await db.get<User>('SELECT * FROM users WHERE id = ?', [id]);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Role-based permissions
    if (user.role === 'voter') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    if (user.role === 'admin') {
      // Admins can only update voters in their constituency
      if (targetUser.role !== 'voter' || targetUser.constituency_id !== user.constituency_id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }
    
    if (user.role === 'superadmin' && targetUser.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot update superadmin status' });
    }
    
    // Update status
    await db.run(
      'UPDATE users SET status = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [status, id]
    );
    
    // Get updated user without password
    const updatedUser = await db.get(
      `SELECT id, name, email, role, status, photoUrl, constituency_id, 
      voter_id, phone, created_at, updated_at 
      FROM users WHERE id = ?`,
      [id]
    );
    
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete user
async function deleteUser(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    if (id === user.id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    
    const db = await openDB();
    
    // Get target user
    const targetUser = await db.get<User>('SELECT * FROM users WHERE id = ?', [id]);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Role-based permissions
    if (user.role === 'voter') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    if (user.role === 'admin') {
      // Admins can only delete voters in their constituency
      if (targetUser.role !== 'voter' || targetUser.constituency_id !== user.constituency_id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }
    
    if (user.role === 'superadmin' && targetUser.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot delete superadmin' });
    }
    
    // Delete user
    await db.run('DELETE FROM users WHERE id = ?', [id]);
    
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
