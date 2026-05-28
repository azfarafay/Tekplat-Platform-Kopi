const express = require('express');
const { createTransaction, getMyTransactions, getById, getByRoastery } = require('../controllers/transactionController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * POST /api/transactions
 * Create new transaction (order from coffee_shop)
 * Auth: Required, Role: coffee_shop
 * Body: { product_id, quantity }
 */
router.post('/', verifyToken, authorizeRole('coffee_shop'), createTransaction);

/**
 * GET /api/transactions/my
 * Get my transactions (coffee_shop sees their orders)
 * Auth: Required, Role: coffee_shop
 */
router.get('/my', verifyToken, authorizeRole('coffee_shop'), getMyTransactions);

/**
 * GET /api/transactions/roastery/list
 * Get roastery's transactions (roastery sees orders they received)
 * Auth: Required, Role: roastery
 */
router.get('/roastery/list', verifyToken, authorizeRole('roastery'), getByRoastery);

/**
 * GET /api/transactions/:id
 * Get transaction detail (both coffee_shop and roastery can view)
 * Auth: Required
 */
router.get('/:id', verifyToken, getById);

module.exports = router;
