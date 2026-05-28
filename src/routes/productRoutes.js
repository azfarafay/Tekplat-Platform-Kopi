const express = require('express');
const { getAll, getById, create, update, deleteProduct } = require('../controllers/productController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * GET /api/products
 * Get all products
 * Auth: Required
 */
router.get('/', verifyToken, getAll);

/**
 * GET /api/products/:id
 * Get product by ID
 * Auth: Required
 */
router.get('/:id', verifyToken, getById);

/**
 * POST /api/products
 * Create new product
 * Auth: Required, Role: roastery
 * Body: { name, origin, roast_level, price, stock }
 */
router.post('/', verifyToken, authorizeRole('roastery'), create);

/**
 * PUT /api/products/:id
 * Update product
 * Auth: Required, Role: roastery
 * Body: { name, origin, roast_level, price, stock }
 */
router.put('/:id', verifyToken, authorizeRole('roastery'), update);

/**
 * DELETE /api/products/:id
 * Delete product
 * Auth: Required, Role: roastery
 */
router.delete('/:id', verifyToken, authorizeRole('roastery'), deleteProduct);

module.exports = router;
