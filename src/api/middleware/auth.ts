
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { openDB } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function verifyToken(req: NextApiRequest, res?: NextApiResponse) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (res) {
        res.status(401).json({ message: 'Unauthorized' });
      }
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      
      const db = await openDB();
      const user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.id]);
      
      if (!user) {
        if (res) {
          res.status(401).json({ message: 'User not found' });
        }
        return null;
      }
      
      return user;
    } catch (error) {
      if (res) {
        res.status(401).json({ message: 'Invalid token' });
      }
      return null;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (res) {
      res.status(500).json({ message: 'Internal server error' });
    }
    return null;
  }
}

export function withAuth(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await verifyToken(req, res);
    if (!user) {
      return;
    }
    
    return handler(req, res, user);
  };
}

export function withRole(handler: any, allowedRoles: string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await verifyToken(req, res);
    if (!user) {
      return;
    }
    
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    return handler(req, res, user);
  };
}
