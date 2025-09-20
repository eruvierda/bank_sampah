const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const transactionValidation = [
    body('wasteTypeId').isInt({ min: 1 }).withMessage('Valid waste type is required'),
    body('weight').isFloat({ min: 0.001 }).withMessage('Weight must be greater than 0'),
    body('pricePerKg').isFloat({ min: 0 }).withMessage('Valid price per kg is required'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
];

// Get all transactions (with filters)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            search = '', 
            wasteTypeId = '', 
            status = '',
            startDate = '',
            endDate = ''
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let params = [];

        // Role-based filtering
        if (req.user.role === 'customer') {
            whereConditions.push('t.user_id = ?');
            params.push(req.user.id);
        }

        // Search filter
        if (search) {
            whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR wt.name LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Waste type filter
        if (wasteTypeId) {
            whereConditions.push('t.waste_type_id = ?');
            params.push(wasteTypeId);
        }

        // Status filter
        if (status) {
            whereConditions.push('t.status = ?');
            params.push(status);
        }

        // Date range filter
        if (startDate) {
            whereConditions.push('DATE(t.created_at) >= ?');
            params.push(startDate);
        }

        if (endDate) {
            whereConditions.push('DATE(t.created_at) <= ?');
            params.push(endDate);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get transactions
        const transactions = await database.all(`
            SELECT 
                t.id,
                t.weight,
                t.price_per_kg,
                t.total_amount,
                t.status,
                t.notes,
                t.created_at,
                t.updated_at,
                u.first_name,
                u.last_name,
                u.email,
                wt.name as waste_type_name,
                wt.description as waste_type_description,
                op.first_name as operator_first_name,
                op.last_name as operator_last_name
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            JOIN waste_types wt ON t.waste_type_id = wt.id
            LEFT JOIN users op ON t.operator_id = op.id
            ${whereClause}
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);

        // Get total count
        const countResult = await database.get(`
            SELECT COUNT(*) as total
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            JOIN waste_types wt ON t.waste_type_id = wt.id
            ${whereClause}
        `, params);

        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transactions'
        });
    }
});

// Get single transaction
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        let whereClause = 't.id = ?';
        let params = [id];

        // Role-based access
        if (req.user.role === 'customer') {
            whereClause += ' AND t.user_id = ?';
            params.push(req.user.id);
        }

        const transaction = await database.get(`
            SELECT 
                t.id,
                t.weight,
                t.price_per_kg,
                t.total_amount,
                t.status,
                t.notes,
                t.created_at,
                t.updated_at,
                u.first_name,
                u.last_name,
                u.email,
                wt.name as waste_type_name,
                wt.description as waste_type_description,
                op.first_name as operator_first_name,
                op.last_name as operator_last_name
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            JOIN waste_types wt ON t.waste_type_id = wt.id
            LEFT JOIN users op ON t.operator_id = op.id
            WHERE ${whereClause}
        `, params);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            data: { transaction }
        });

    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transaction'
        });
    }
});

// Create new transaction
router.post('/', authenticateToken, requireRole(['operator', 'admin']), transactionValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { wasteTypeId, weight, pricePerKg, notes } = req.body;
        const totalAmount = weight * pricePerKg;

        // Verify waste type exists and is active
        const wasteType = await database.get(
            'SELECT id, name, price_per_kg FROM waste_types WHERE id = ? AND is_active = 1',
            [wasteTypeId]
        );

        if (!wasteType) {
            return res.status(400).json({
                success: false,
                message: 'Invalid waste type'
            });
        }

        // Use current price if not provided
        const finalPricePerKg = pricePerKg || wasteType.price_per_kg;
        const finalTotalAmount = weight * finalPricePerKg;

        // Create transaction
        const result = await database.run(`
            INSERT INTO transactions (user_id, waste_type_id, weight, price_per_kg, total_amount, status, operator_id, notes)
            VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
        `, [req.user.id, wasteTypeId, weight, finalPricePerKg, finalTotalAmount, req.user.id, notes || null]);

        // Get the created transaction
        const transaction = await database.get(`
            SELECT 
                t.id,
                t.weight,
                t.price_per_kg,
                t.total_amount,
                t.status,
                t.notes,
                t.created_at,
                wt.name as waste_type_name
            FROM transactions t
            JOIN waste_types wt ON t.waste_type_id = wt.id
            WHERE t.id = ?
        `, [result.id]);

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: { transaction }
        });

    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create transaction'
        });
    }
});

// Update transaction
router.put('/:id', authenticateToken, requireRole(['operator', 'admin']), transactionValidation, async (req, res) => {
    try {
        const { id } = req.params;
        const { wasteTypeId, weight, pricePerKg, notes, status } = req.body;

        // Check if transaction exists
        const existingTransaction = await database.get(
            'SELECT * FROM transactions WHERE id = ?',
            [id]
        );

        if (!existingTransaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Only allow updates to pending transactions
        if (existingTransaction.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending transactions can be updated'
            });
        }

        // Calculate new total if weight or price changed
        let finalTotalAmount = existingTransaction.total_amount;
        if (weight && pricePerKg) {
            finalTotalAmount = weight * pricePerKg;
        } else if (weight) {
            finalTotalAmount = weight * existingTransaction.price_per_kg;
        } else if (pricePerKg) {
            finalTotalAmount = existingTransaction.weight * pricePerKg;
        }

        // Update transaction
        await database.run(`
            UPDATE transactions 
            SET waste_type_id = COALESCE(?, waste_type_id),
                weight = COALESCE(?, weight),
                price_per_kg = COALESCE(?, price_per_kg),
                total_amount = ?,
                notes = COALESCE(?, notes),
                status = COALESCE(?, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [wasteTypeId, weight, pricePerKg, finalTotalAmount, notes, status, id]);

        // Get updated transaction
        const transaction = await database.get(`
            SELECT 
                t.id,
                t.weight,
                t.price_per_kg,
                t.total_amount,
                t.status,
                t.notes,
                t.created_at,
                t.updated_at,
                wt.name as waste_type_name
            FROM transactions t
            JOIN waste_types wt ON t.waste_type_id = wt.id
            WHERE t.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Transaction updated successfully',
            data: { transaction }
        });

    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update transaction'
        });
    }
});

// Complete transaction (update status to completed and update user balance)
router.patch('/:id/complete', authenticateToken, requireRole(['operator', 'admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Start transaction
        await database.beginTransaction();

        try {
            // Get transaction
            const transaction = await database.get(
                'SELECT * FROM transactions WHERE id = ? AND status = "pending"',
                [id]
            );

            if (!transaction) {
                throw new Error('Transaction not found or already processed');
            }

            // Update transaction status
            await database.run(
                'UPDATE transactions SET status = "completed", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );

            // Update user balance
            await database.run(`
                INSERT INTO user_balances (user_id, total_earnings, total_deposits, last_transaction_date)
                VALUES (?, ?, 1, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    total_earnings = total_earnings + ?,
                    total_deposits = total_deposits + 1,
                    last_transaction_date = CURRENT_TIMESTAMP
            `, [transaction.user_id, transaction.total_amount, transaction.total_amount]);

            // Commit transaction
            await database.commit();

            res.json({
                success: true,
                message: 'Transaction completed successfully'
            });

        } catch (error) {
            // Rollback on error
            await database.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Complete transaction error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to complete transaction'
        });
    }
});

// Delete transaction
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if transaction exists
        const transaction = await database.get(
            'SELECT * FROM transactions WHERE id = ?',
            [id]
        );

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Only allow deletion of pending transactions
        if (transaction.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending transactions can be deleted'
            });
        }

        // Delete transaction
        await database.run('DELETE FROM transactions WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Transaction deleted successfully'
        });

    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete transaction'
        });
    }
});

module.exports = router;
