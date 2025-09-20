const express = require('express');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// Get dashboard summary
router.get('/summary', authenticateToken, cacheMiddleware(2 * 60 * 1000), async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let summaryData = {};

        if (userRole === 'customer') {
            // Customer dashboard
            const userBalance = await database.get(
                'SELECT total_earnings, total_deposits, last_transaction_date FROM user_balances WHERE user_id = ?',
                [userId]
            );

            summaryData = {
                totalEarnings: userBalance?.total_earnings || 0,
                totalDeposits: userBalance?.total_deposits || 0,
                lastTransactionDate: userBalance?.last_transaction_date || null
            };

        } else if (userRole === 'operator' || userRole === 'admin') {
            // Operator/Admin dashboard
            const [
                totalTransactions,
                totalUsers,
                totalEarnings,
                pendingTransactions,
                recentTransactions
            ] = await Promise.all([
                // Total transactions
                database.get('SELECT COUNT(*) as count FROM transactions'),
                
                // Total users
                database.get('SELECT COUNT(*) as count FROM users WHERE role = "customer" AND is_active = 1'),
                
                // Total earnings
                database.get('SELECT COALESCE(SUM(total_amount), 0) as total FROM transactions WHERE status = "completed"'),
                
                // Pending transactions
                database.get('SELECT COUNT(*) as count FROM transactions WHERE status = "pending"'),
                
                // Recent transactions (last 7 days)
                database.get(`
                    SELECT COUNT(*) as count 
                    FROM transactions 
                    WHERE created_at >= datetime('now', '-7 days')
                `)
            ]);

            summaryData = {
                totalTransactions: totalTransactions?.count || 0,
                totalUsers: totalUsers?.count || 0,
                totalEarnings: totalEarnings?.total || 0,
                pendingTransactions: pendingTransactions?.count || 0,
                recentTransactions: recentTransactions?.count || 0
            };
        }

        res.json({
            success: true,
            data: summaryData
        });

    } catch (error) {
        console.error('Dashboard summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard summary'
        });
    }
});

// Get recent transactions
router.get('/recent-transactions', authenticateToken, cacheMiddleware(1 * 60 * 1000), async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        let whereClause = '';
        let params = [parseInt(limit)];

        if (userRole === 'customer') {
            whereClause = 'WHERE t.user_id = ?';
            params.unshift(userId);
        }

        const transactions = await database.all(`
            SELECT 
                t.id,
                t.weight,
                t.price_per_kg,
                t.total_amount,
                t.status,
                t.created_at,
                wt.name as waste_type_name,
                u.first_name,
                u.last_name
            FROM transactions t
            JOIN waste_types wt ON t.waste_type_id = wt.id
            JOIN users u ON t.user_id = u.id
            ${whereClause}
            ORDER BY t.created_at DESC
            LIMIT ?
        `, params);

        res.json({
            success: true,
            data: { transactions }
        });

    } catch (error) {
        console.error('Recent transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recent transactions'
        });
    }
});

// Get chart data
router.get('/charts', authenticateToken, cacheMiddleware(5 * 60 * 1000), async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const userId = req.user.id;
        const userRole = req.user.role;

        let whereClause = `WHERE t.created_at >= datetime('now', '-${parseInt(period)} days') AND t.status = 'completed'`;
        let params = [];

        if (userRole === 'customer') {
            whereClause += ' AND t.user_id = ?';
            params.push(userId);
        }

        // Daily earnings chart
        const dailyEarnings = await database.all(`
            SELECT 
                DATE(t.created_at) as date,
                SUM(t.total_amount) as total
            FROM transactions t
            ${whereClause}
            GROUP BY DATE(t.created_at)
            ORDER BY date ASC
        `, params);

        // Waste type distribution
        const wasteTypeDistribution = await database.all(`
            SELECT 
                wt.name as waste_type,
                COUNT(t.id) as transaction_count,
                SUM(t.total_amount) as total_amount,
                SUM(t.weight) as total_weight
            FROM transactions t
            JOIN waste_types wt ON t.waste_type_id = wt.id
            ${whereClause}
            GROUP BY wt.id, wt.name
            ORDER BY total_amount DESC
        `, params);

        // Monthly comparison (current vs previous month)
        const monthlyComparison = await database.all(`
            SELECT 
                strftime('%Y-%m', t.created_at) as month,
                SUM(t.total_amount) as total,
                COUNT(t.id) as count
            FROM transactions t
            ${whereClause.replace(`datetime('now', '-${parseInt(period)} days')`, `datetime('now', '-60 days')`)}
            GROUP BY strftime('%Y-%m', t.created_at)
            ORDER BY month DESC
            LIMIT 2
        `, params);

        res.json({
            success: true,
            data: {
                dailyEarnings,
                wasteTypeDistribution,
                monthlyComparison
            }
        });

    } catch (error) {
        console.error('Charts data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get charts data'
        });
    }
});

// Get statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let stats = {};

        if (userRole === 'customer') {
            // Customer statistics
            const [
                totalTransactions,
                totalWeight,
                averageTransaction,
                favoriteWasteType
            ] = await Promise.all([
                database.get('SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND status = "completed"', [userId]),
                database.get('SELECT SUM(weight) as total FROM transactions WHERE user_id = ? AND status = "completed"', [userId]),
                database.get('SELECT AVG(total_amount) as avg FROM transactions WHERE user_id = ? AND status = "completed"', [userId]),
                database.get(`
                    SELECT wt.name, COUNT(t.id) as count
                    FROM transactions t
                    JOIN waste_types wt ON t.waste_type_id = wt.id
                    WHERE t.user_id = ? AND t.status = 'completed'
                    GROUP BY wt.id, wt.name
                    ORDER BY count DESC
                    LIMIT 1
                `, [userId])
            ]);

            stats = {
                totalTransactions: totalTransactions.count,
                totalWeight: totalWeight.total || 0,
                averageTransaction: averageTransaction.avg || 0,
                favoriteWasteType: favoriteWasteType?.name || 'N/A'
            };

        } else if (userRole === 'operator' || userRole === 'admin') {
            // System statistics
            const [
                totalTransactions,
                totalUsers,
                totalWeight,
                averageTransaction,
                topWasteType,
                topCustomer
            ] = await Promise.all([
                database.get('SELECT COUNT(*) as count FROM transactions WHERE status = "completed"'),
                database.get('SELECT COUNT(*) as count FROM users WHERE role = "customer" AND is_active = 1'),
                database.get('SELECT SUM(weight) as total FROM transactions WHERE status = "completed"'),
                database.get('SELECT AVG(total_amount) as avg FROM transactions WHERE status = "completed"'),
                database.get(`
                    SELECT wt.name, COUNT(t.id) as count, SUM(t.total_amount) as total
                    FROM transactions t
                    JOIN waste_types wt ON t.waste_type_id = wt.id
                    WHERE t.status = 'completed'
                    GROUP BY wt.id, wt.name
                    ORDER BY count DESC
                    LIMIT 1
                `),
                database.get(`
                    SELECT u.first_name, u.last_name, COUNT(t.id) as count, SUM(t.total_amount) as total
                    FROM transactions t
                    JOIN users u ON t.user_id = u.id
                    WHERE t.status = 'completed'
                    GROUP BY u.id, u.first_name, u.last_name
                    ORDER BY count DESC
                    LIMIT 1
                `)
            ]);

            stats = {
                totalTransactions: totalTransactions.count,
                totalUsers: totalUsers.count,
                totalWeight: totalWeight.total || 0,
                averageTransaction: averageTransaction.avg || 0,
                topWasteType: topWasteType?.name || 'N/A',
                topCustomer: topCustomer ? `${topCustomer.first_name} ${topCustomer.last_name}` : 'N/A'
            };
        }

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics'
        });
    }
});

module.exports = router;
