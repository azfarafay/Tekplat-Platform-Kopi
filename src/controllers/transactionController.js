const pool = require('../config/db');

/**
 * Create transaction - Pesanan dari coffee_shop ke roastery
 * POST /api/transactions
 * Body: { product_id, quantity }
 * coffee_shop_id diambil otomatis dari req.user.id
 */
const createTransaction = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { product_id, quantity } = req.body;
    const coffee_shop_id = req.user.id;

    // Validasi input
    if (!product_id || !quantity) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'product_id and quantity are required',
      });
    }

    if (quantity <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'quantity must be greater than 0',
      });
    }

    // Check product dan stock availability
    const [products] = await connection.query(
      'SELECT id, roastery_id, price, stock FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const product = products[0];

    if (product.stock < quantity) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.stock} kg, Requested: ${quantity} kg`,
      });
    }

    // Hitung total_price dengan diskon jika quantity > 10 kg
    const unit_price = product.price;
    let total_price = unit_price * quantity;
    let discount_applied = false;

    if (quantity > 10) {
      const discount_amount = total_price * 0.1; // 10% discount
      total_price = total_price - discount_amount;
      discount_applied = true;
    }

    // Update stock di products
    const new_stock = product.stock - quantity;
    await connection.query(
      'UPDATE products SET stock = ? WHERE id = ?',
      [new_stock, product_id]
    );

    // Insert transaction
    const [result] = await connection.query(
      'INSERT INTO transactions (coffee_shop_id, product_id, roastery_id, quantity, unit_price, total_price, discount_applied, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [coffee_shop_id, product_id, product.roastery_id, quantity, unit_price, total_price, discount_applied, 'pending']
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        id: result.insertId,
        coffee_shop_id,
        product_id,
        roastery_id: product.roastery_id,
        quantity,
        unit_price,
        total_price,
        discount_applied,
        discount_amount: discount_applied ? unit_price * quantity * 0.1 : 0,
        status: 'pending',
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * Get my transactions - Riwayat pesanan coffee_shop
 * GET /api/transactions/my
 * Mengambil transaksi milik coffee_shop yang login
 */
const getMyTransactions = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const coffee_shop_id = req.user.id;

    const [transactions] = await connection.query(
      `SELECT 
        t.id,
        t.coffee_shop_id,
        t.product_id,
        t.roastery_id,
        p.name AS product_name,
        p.origin,
        p.roast_level,
        t.quantity,
        t.unit_price,
        t.total_price,
        t.discount_applied,
        CASE WHEN t.discount_applied THEN (t.unit_price * t.quantity * 0.1) ELSE 0 END AS discount_amount,
        t.status,
        t.created_at,
        t.updated_at
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.coffee_shop_id = ?
      ORDER BY t.created_at DESC`,
      [coffee_shop_id]
    );

    res.status(200).json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: transactions,
      total: transactions.length,
    });
  } catch (error) {
    console.error('Get my transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * Get transaction by ID
 * GET /api/transactions/:id
 */
const getById = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [transactions] = await connection.query(
      `SELECT 
        t.id,
        t.coffee_shop_id,
        t.product_id,
        t.roastery_id,
        p.name AS product_name,
        p.origin,
        p.roast_level,
        t.quantity,
        t.unit_price,
        t.total_price,
        t.discount_applied,
        CASE WHEN t.discount_applied THEN (t.unit_price * t.quantity * 0.1) ELSE 0 END AS discount_amount,
        t.status,
        t.created_at,
        t.updated_at
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.id = ? AND (t.coffee_shop_id = ? OR t.roastery_id = ?)`,
      [id, userId, userId]
    );

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or you do not have access',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction retrieved successfully',
      data: transactions[0],
    });
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * Get all transactions (roastery dapat melihat pesanan mereka)
 * GET /api/transactions/roastery/list
 */
const getByRoastery = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const roastery_id = req.user.id;

    const [transactions] = await connection.query(
      `SELECT 
        t.id,
        t.coffee_shop_id,
        cs.name AS coffee_shop_name,
        t.product_id,
        t.roastery_id,
        p.name AS product_name,
        p.origin,
        p.roast_level,
        t.quantity,
        t.unit_price,
        t.total_price,
        t.discount_applied,
        CASE WHEN t.discount_applied THEN (t.unit_price * t.quantity * 0.1) ELSE 0 END AS discount_amount,
        t.status,
        t.created_at,
        t.updated_at
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN users cs ON t.coffee_shop_id = cs.id
      WHERE t.roastery_id = ?
      ORDER BY t.created_at DESC`,
      [roastery_id]
    );

    res.status(200).json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: transactions,
      total: transactions.length,
    });
  } catch (error) {
    console.error('Get roastery transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  createTransaction,
  getMyTransactions,
  getById,
  getByRoastery,
};
