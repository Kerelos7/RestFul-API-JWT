const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const auth = require('../middleware/auth'); // Import the auth middleware

const router = express.Router();

// SignUp endpoint
router.post('/signup', async (req, res) => {
  const { name, username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO Users (name, username, password) VALUES (?, ?, ?)',
      [name, username, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(400).json({ message: 'Error registering user.', error: err.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await db.execute('SELECT * FROM Users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '10m' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in.', error: err.message });
  }
});

// Update user details (Protected route)
router.put('/users/:id', auth, async (req, res) => {
  const { name, password } = req.body;
  const userId = req.params.id;

  try {
    // Check if the user is authorized to update their own details
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Unauthorized to update this user.' });
    }

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const [result] = await db.execute(
      'UPDATE Users SET name = ?, password = ? WHERE id = ?',
      [name || req.user.name, hashedPassword || req.user.password, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'User updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user.', error: err.message });
  }
});

module.exports = router;