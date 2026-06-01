const pool = require("../config/db");

/**
 * Get all products
 * GET /api/products
 */
const getAll = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const [products] = await connection.query(
      `SELECT p.id, p.roastery_id, p.name, p.origin, p.roast_level, p.price, p.stock, p.created_at
       FROM products p
       INNER JOIN (
         SELECT MAX(id) as max_id
         FROM products
         GROUP BY name, origin
       ) sub ON p.id = sub.max_id
       ORDER BY p.created_at DESC`,
    );

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: products,
      total: products.length,
    });
  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve products",
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
      "SELECT id, roastery_id, name, origin, roast_level, price, stock, created_at FROM products WHERE id = ?",
      [id],
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: products[0],
    });
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve product",
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
    if (
      !name ||
      !origin ||
      !roast_level ||
      price === undefined ||
      stock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "name, origin, roast_level, price, and stock are required",
      });
    }

    // Validasi roast_level
    if (!["light", "medium", "dark"].includes(roast_level)) {
      return res.status(400).json({
        success: false,
        message: "roast_level must be one of: light, medium, dark",
      });
    }

    // Validasi price dan stock
    if (price < 0 || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "price and stock cannot be negative",
      });
    }

    // Insert product
    const [result] = await connection.query(
      "INSERT INTO products (roastery_id, name, origin, roast_level, price, stock) VALUES (?, ?, ?, ?, ?, ?)",
      [roastery_id, name, origin, roast_level, price, stock],
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
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
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * Update product stock
 * PUT /api/products/:id
 * Body: { stock }
 * Roastery hanya bisa memperbarui jumlah stok produk miliknya sendiri.
 * Field name, origin, roast_level, dan price bersifat fixed master data.
 */
const update = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const { stock } = req.body;
    const userId = req.user.id;

    // Validasi stock wajib ada
    if (stock === undefined || stock === null) {
      return res.status(400).json({
        success: false,
        message: "stock is required",
      });
    }

    if (stock < 0) {
      return res.status(400).json({
        success: false,
        message: "stock cannot be negative",
      });
    }

    // Check if product exists and belongs to the roastery
    const [products] = await connection.query(
      "SELECT roastery_id FROM products WHERE id = ?",
      [id],
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (products[0].roastery_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own products",
      });
    }

    // Hanya update kolom stock, master data lainnya tidak dapat diubah
    await connection.query(
      "UPDATE products SET stock = ? WHERE id = ? AND roastery_id = ?",
      [stock, id, userId],
    );

    res.status(200).json({
      success: true,
      message: "Product stock updated successfully",
      data: {
        id: parseInt(id),
        stock,
      },
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
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
      "SELECT roastery_id FROM products WHERE id = ?",
      [id],
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (products[0].roastery_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own products",
      });
    }

    // Delete product
    await connection.query("DELETE FROM products WHERE id = ?", [id]);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: {
        id: parseInt(id),
      },
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
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
