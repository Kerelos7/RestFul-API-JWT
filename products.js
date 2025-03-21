const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db/db');

const router = express.Router();

// Add a new product (Protected route)
router.post('/', auth, async (req, res) => {
  const { pname, description, price, stock } = req.body;

  try {
    const [result] = await db.execute(
      'INSERT INTO Products (pname, description, price, stock) VALUES (?, ?, ?, ?)',
      [pname, description, price, stock]
    );
    const product = { pid: result.insertId, pname, description, price, stock };
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: 'Error adding product.', error: err.message });
  }
});

// Retrieve all products (Protected route)
router.get('/', auth, async (req, res) => {
  try {
    const [products] = await db.execute('SELECT * FROM Products');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving products.', error: err.message });
  }
});

// Retrieve a single product by ID (Protected route)
router.get('/:pid', auth, async (req, res) => {
  try {
    const [products] = await db.execute('SELECT * FROM Products WHERE pid = ?', [req.params.pid]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json(products[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving product.', error: err.message });
  }
});

// Update product details (Protected route)
router.put('/:pid', auth, async (req, res) => {
  const { pname, description, price, stock } = req.body;

  try {
    const [result] = await db.execute(
      'UPDATE Products SET pname = ?, description = ?, price = ?, stock = ? WHERE pid = ?',
      [pname, description, price, stock, req.params.pid]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json({ pid: req.params.pid, pname, description, price, stock });
  } catch (err) {
    res.status(400).json({ message: 'Error updating product.', error: err.message });
  }
});

// Delete a product (Protected route)
router.delete('/:pid', auth, async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM Products WHERE pid = ?', [req.params.pid]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product.', error: err.message });
  }
});

module.exports = router;