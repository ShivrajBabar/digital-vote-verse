
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'POST':
      if (req.url?.includes('/login')) {
        return await login(req, res);
      } else if (req.url?.includes('/logout')) {
        return await logout(req, res);
      } else {
        return res.status(405).json({ message: 'Method not allowed' });
      }
    case 'GET':
      if (req.url?.includes('/me')) {
        return await getCurrentUser(req, res);
      } else {
        return res.status(405).json({ message: 'Method not allowed' });
      }
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Login handler
async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password and role are required' });
    }

    const db = await openDB();
    
    // Find user by email and role
    const user = await db.get(
      'SELECT * FROM users WHERE email = ? AND role = ?',
      [email, role]
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Don't return the password
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Logout handler
async function logout(req, res) {
  // Client-side should remove the token
  return res.status(200).json({ message: 'Logged out successfully' });
}

// Get current user handler
async function getCurrentUser(req, res) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const db = await openDB();
      const user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.id]);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Don't return the password
      const { password: _, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
