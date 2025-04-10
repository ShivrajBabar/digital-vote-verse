
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

  // Only superadmin can access admin management
  if (user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  switch (method) {
    case 'GET':
      if (req.query.id) {
        return await getAdminById(req, res);
      }
      return await getAllAdmins(req, res);
    case 'POST':
      return await createAdmin(req, res);
    case 'PUT':
      return await updateAdmin(req, res);
    case 'DELETE':
      return await deleteAdmin(req, res);
    case 'PATCH':
      if (req.url?.includes('/status')) {
        return await updateAdminStatus(req, res);
      }
      return res.status(405).json({ message: 'Method not allowed' });
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all admins
async function getAllAdmins(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { search, status, state } = req.query;
    const db = await openDB();
    
    let query = `
      SELECT u.*, c.name as constituency_name, c.state, c.district
      FROM users u
      LEFT JOIN constituencies c ON u.constituency_id = c.id
      WHERE u.role = 'admin'
    `;
    
    const params: any[] = [];
    
    // Add search filter if provided
    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }
    
    // Add status filter if provided
    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }
    
    // Add state filter if provided
    if (state) {
      query += ` AND c.state = ?`;
      params.push(state);
    }
    
    // Order by name
    query += ` ORDER BY u.name ASC`;
    
    const admins = await db.all(query, params);
    
    // Remove sensitive information
    const sanitizedAdmins = admins.map(admin => {
      const { password, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    });
    
    return res.status(200).json(sanitizedAdmins);
  } catch (error) {
    console.error('Get all admins error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Get admin by ID
async function getAdminById(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const db = await openDB();
    
    const query = `
      SELECT u.*, c.name as constituency_name, c.state, c.district
      FROM users u
      LEFT JOIN constituencies c ON u.constituency_id = c.id
      WHERE u.id = ? AND u.role = 'admin'
    `;
    
    const admin = await db.get(query, [id]);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Remove sensitive information
    const { password, ...adminWithoutPassword } = admin;
    
    return res.status(200).json(adminWithoutPassword);
  } catch (error) {
    console.error('Get admin by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Create new admin
async function createAdmin(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      name,
      email,
      phone,
      constituency_id,
      password,
      status = 'Active'
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    const db = await openDB();
    
    // Check if email already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
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
    
    // Insert new admin
    await db.run(`
      INSERT INTO users (
        id, name, email, password, role, status, phone,
        constituency_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      id, name, email, hashedPassword, 'admin', status, phone || null,
      constituency_id || null
    ]);
    
    // Get created admin with constituency details
    const createdAdmin = await db.get(`
      SELECT u.*, c.name as constituency_name
      FROM users u
      LEFT JOIN constituencies c ON u.constituency_id = c.id
      WHERE u.id = ?
    `, [id]);
    
    // Remove sensitive information
    const { password: pwd, ...adminWithoutPassword } = createdAdmin;
    
    return res.status(201).json(adminWithoutPassword);
  } catch (error) {
    console.error('Create admin error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update admin
async function updateAdmin(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const {
      name,
      email,
      phone,
      constituency_id,
      password,
      status
    } = req.body;
    
    if (!id) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }
    
    const db = await openDB();
    
    // Check if admin exists
    const admin = await db.get('SELECT * FROM users WHERE id = ? AND role = ?', [id, 'admin']);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== admin.email) {
      const existingEmail = await db.get('SELECT * FROM users WHERE email = ? AND id != ?', [email, id]);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }
    
    // Check if constituency exists (if changing)
    if (constituency_id && constituency_id !== admin.constituency_id) {
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
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone || null;
    if (constituency_id !== undefined) updates.constituency_id = constituency_id || null;
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
    
    // Update admin
    await db.run(
      `UPDATE users SET ${setClauses} WHERE id = ?`,
      [...values, id]
    );
    
    // Get updated admin with constituency details
    const updatedAdmin = await db.get(`
      SELECT u.*, c.name as constituency_name
      FROM users u
      LEFT JOIN constituencies c ON u.constituency_id = c.id
      WHERE u.id = ?
    `, [id]);
    
    // Remove sensitive information
    const { password: pwd, ...adminWithoutPassword } = updatedAdmin;
    
    return res.status(200).json(adminWithoutPassword);
  } catch (error) {
    console.error('Update admin error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete admin
async function deleteAdmin(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }
    
    const db = await openDB();
    
    // Check if admin exists
    const admin = await db.get('SELECT * FROM users WHERE id = ? AND role = ?', [id, 'admin']);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Delete admin
    await db.run('DELETE FROM users WHERE id = ?', [id]);
    
    return res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Update admin status
async function updateAdminStatus(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const { status } = req.body;
    
    if (!id || !status) {
      return res.status(400).json({ message: 'Admin ID and status are required' });
    }
    
    if (!['Active', 'Inactive', 'Pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const db = await openDB();
    
    // Check if admin exists
    const admin = await db.get('SELECT * FROM users WHERE id = ? AND role = ?', [id, 'admin']);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Update status
    await db.run(
      'UPDATE users SET status = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [status, id]
    );
    
    // Get updated admin
    const updatedAdmin = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    
    // Remove sensitive information
    const { password, ...adminWithoutPassword } = updatedAdmin;
    
    return res.status(200).json({
      message: 'Admin status updated successfully',
      admin: adminWithoutPassword
    });
  } catch (error) {
    console.error('Update admin status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
