// Authentication controller: handles login and profile operations
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      skills: user.skills,
      seniority: user.seniority,
      maxCapacity: user.maxCapacity,
      department: user.department
    };

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const register = async (req, res) => {
  try {
    const { email, password, name, role, skills, seniority, maxCapacity, department } = req.body;
    
    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({ message: 'Missing required fields: email, password, name, role' });
    }
    // Validate role
    if (!['engineer', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be "engineer" or "manager".' });
    }
    // Optionally: restrict manager creation
    // e.g., if (role === 'manager' && !req.userIsAdmin) return 403...

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Build user object
    const userData = {
      email: email.toLowerCase(),
      name: name.trim(),
      passwordHash,
      role,
    };
    if (role === 'engineer') {
      // For engineer, allow skills/seniority/maxCapacity/department
      userData.skills = Array.isArray(skills) ? skills.map(s => s.trim()) : [];
      userData.seniority = seniority && ['junior','mid','senior'].includes(seniority) 
        ? seniority 
        : 'mid';
      // maxCapacity: default 100, or accept provided if valid 1-100
      if (maxCapacity !== undefined) {
        const capNum = Number(maxCapacity);
        if (isNaN(capNum) || capNum < 1 || capNum > 100) {
          return res.status(400).json({ message: 'maxCapacity must be a number between 1 and 100' });
        }
        userData.maxCapacity = capNum;
      } else {
        userData.maxCapacity = 100;
      }
      if (department) {
        userData.department = department.trim();
      }
    } else {
      // role === 'manager'
      // We may ignore engineer-specific fields
      userData.skills = [];
      userData.seniority = undefined;
      userData.maxCapacity = undefined;
      userData.department = department ? department.trim() : undefined;
    }

    const newUser = new User(userData);
    await newUser.save();

    // Generate JWT token
    const tokenPayload = {
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Prepare user response (omit passwordHash)
    const userResponse = {
      _id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      skills: newUser.skills,
      seniority: newUser.seniority,
      maxCapacity: newUser.maxCapacity,
      department: newUser.department
    };

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Register error:', error);
    // Duplicate key error (email)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  login,
  getProfile,
  register
};
