const pool = require('../config/db');

/**
 * Get all products
 * GET /api/products
 */
const getAll = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const [products] = await connection.query(
      'SELECT id, roastery_id, name, origin, roast_level, price, stock, created_at FROM products ORDER BY created_at DESC'
    );

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      total: products.length,
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * Get product by ID
 * GET /api/products/:id
 */
const getById = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    const [products] = await connection.query(
      'SELECT id, roastery_id, name, origin, roast_level, price, stock, created_at FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: products[0],
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * Create product
 * POST /api/products
 * Body: { name, origin, roast_level, price, stock }
 * roastery_id diambil otomatis dari req.user.id
 */
const create = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { name, origin, roast_level, price, stock } = req.body;
    const roastery_id = req.user.id;

    // Validasi input
    if (!name || !origin || !roast_level || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'name, origin, roast_level, price, and stock are required',
      });
    }

    // Validasi roast_level
    if (!['light', 'medium', 'dark'].includes(roast_level)) {
      return res.status(400).json({
        success: false,
        message: 'roast_level must be one of: light, medium, dark',
      });
    }

    // Validasi price dan stock
    if (price < 0 || stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'price and stock cannot be negative',
      });
    }

    // Insert product
    const [result] = await connection.query(
      'INSERT INTO products (roastery_id, name, origin, roast_level, price, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [roastery_id, name, origin, roast_level, price, stock]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: result.insertId,
        roastery_id,
        name,
        origin,
        roast_level,
        price,
        stock,
      },
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * Update product
 * PUT /api/products/:id
 * Body: { name, origin, roast_level, price, stock }
 * Hanya roastery yang membuat produk yang bisa update
 */
const update = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { name, origin, roast_level, price, stock } = req.body;
    const userId = req.user.id;

    // Check if product exists and belongs to the user
    const [products] = await connection.query(
      'SELECT roastery_id FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (products[0].roastery_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own products',
      });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (origin !== undefined) updateData.origin = origin;
    if (roast_level !== undefined) {
      if (!['light', 'medium', 'dark'].includes(roast_level)) {
        return res.status(400).json({
          success: false,
          message: 'roast_level must be one of: light, medium, dark',
        });
      }
      updateData.roast_level = roast_level;
    }
    if (price !== undefined) {
      if (price < 0) {
        return res.status(400).json({
          success: false,
          message: 'price cannot be negative',
        });
      }
      updateData.price = price;
    }
    if (stock !== undefined) {
      if (stock < 0) {
        return res.status(400).json({
          success: false,
          message: 'stock cannot be negative',
        });
      }
      updateData.stock = stock;
    }

    // Build dynamic update query
    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field to update is required',
      });
    }

    const placeholders = fields.map((field) => `${field} = ?`).join(', ');
    const values = fields.map((field) => updateData[field]);
    values.push(id);

    await connection.query(
      `UPDATE products SET ${placeholders} WHERE id = ?`,
      values
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        id: parseInt(id),
        ...updateData,
      },
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * Delete product
 * DELETE /api/products/:id
 * Hanya roastery yang membuat produk yang bisa delete
 */
const deleteProduct = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if product exists and belongs to the user
    const [products] = await connection.query(
      'SELECT roastery_id FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (products[0].roastery_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own products',
      });
    }

    // Delete product
    await connection.query('DELETE FROM products WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {
        id: parseInt(id),
      },
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteProduct,
};
