const express = require('express');
const database = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get system overview report
router.get('/overview', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let dateFilter = '';
        let params = [];
        
        if (startDate && endDate) {
            dateFilter = 'WHERE DATE(t.created_at) BETWEEN ? AND ?';
            params = [startDate, endDate];
        }

        // Get comprehensive system statistics
        const [
            totalUsers,
            activeUsers,
            totalTransactions,
            completedTransactions,
            totalEarnings,
            totalWeight,
            averageTransactionValue,
            topWasteTypes,
            topCustomers,
            recentActivity
        ] = await Promise.all([
            // Total users
            database.get('SELECT COUNT(*) as count FROM users'),
            
            // Active users
            database.get('SELECT COUNT(*) as count FROM users WHERE is_active = 1'),
            
            // Total transactions
            database.get(`SELECT COUNT(*) as count FROM transactions ${dateFilter}`, params),
            
            // Completed transactions
            database.get(`SELECT COUNT(*) as count FROM transactions WHERE status = 'completed' ${dateFilter.replace('WHERE', 'AND')}`, params),
            
            // Total earnings
            database.get(`SELECT SUM(total_amount) as total FROM transactions WHERE status = 'completed' ${dateFilter.replace('WHERE', 'AND')}`, params),
            
            // Total weight
            database.get(`SELECT SUM(weight) as total FROM transactions WHERE status = 'completed' ${dateFilter.replace('WHERE', 'AND')}`, params),
            
            // Average transaction value
            database.get(`SELECT AVG(total_amount) as avg FROM transactions WHERE status = 'completed' ${dateFilter.replace('WHERE', 'AND')}`, params),
            
            // Top waste types
            database.all(`
                SELECT 
                    wt.name,
                    COUNT(t.id) as transaction_count,
                    SUM(t.total_amount) as total_amount,
                    SUM(t.weight) as total_weight
                FROM transactions t
                JOIN waste_types wt ON t.waste_type_id = wt.id
                WHERE t.status = 'completed' ${dateFilter.replace('WHERE', 'AND')}
                GROUP BY wt.id, wt.name
                ORDER BY total_amount DESC
                LIMIT 5
            `, params),
            
            // Top customers
            database.all(`
                SELECT 
                    u.first_name,
                    u.last_name,
                    u.email,
                    COUNT(t.id) as transaction_count,
                    SUM(t.total_amount) as total_amount,
                    SUM(t.weight) as total_weight
                FROM transactions t
                JOIN users u ON t.user_id = u.id
                WHERE t.status = 'completed' ${dateFilter.replace('WHERE', 'AND')}
                GROUP BY u.id, u.first_name, u.last_name, u.email
                ORDER BY total_amount DESC
                LIMIT 10
            `, params),
            
            // Recent activity
            database.all(`
                SELECT 
                    t.id,
                    t.total_amount,
                    t.weight,
                    t.created_at,
                    u.first_name,
                    u.last_name,
                    wt.name as waste_type_name
                FROM transactions t
                JOIN users u ON t.user_id = u.id
                JOIN waste_types wt ON t.waste_type_id = wt.id
                ${dateFilter}
                ORDER BY t.created_at DESC
                LIMIT 20
            `, params)
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers: totalUsers.count,
                    activeUsers: activeUsers.count,
                    totalTransactions: totalTransactions.count,
                    completedTransactions: completedTransactions.count,
                    totalEarnings: totalEarnings.total || 0,
                    totalWeight: totalWeight.total || 0,
                    averageTransactionValue: averageTransactionValue.avg || 0
                },
                topWasteTypes,
                topCustomers,
                recentActivity
            }
        });

    } catch (error) {
        console.error('Overview report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate overview report'
        });
    }
});

// Get financial report
router.get('/financial', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'month' } = req.query;
        
        let dateFilter = '';
        let params = [];
        
        if (startDate && endDate) {
            dateFilter = 'WHERE DATE(t.created_at) BETWEEN ? AND ?';
            params = [startDate, endDate];
        }

        let groupByClause = '';
        switch (groupBy) {
            case 'day':
                groupByClause = 'DATE(t.created_at)';
                break;
            case 'week':
                groupByClause = 'strftime("%Y-%W", t.created_at)';
                break;
            case 'month':
                groupByClause = 'strftime("%Y-%m", t.created_at)';
                break;
            case 'year':
                groupByClause = 'strftime("%Y", t.created_at)';
                break;
            default:
                groupByClause = 'strftime("%Y-%m", t.created_at)';
        }

        // Get financial data grouped by period
        const financialData = await database.all(`
            SELECT 
                ${groupByClause} as period,
                COUNT(t.id) as transaction_count,
                SUM(t.total_amount) as total_amount,
                SUM(t.weight) as total_weight,
                AVG(t.total_amount) as average_amount
            FROM transactions t
            WHERE t.status = 'completed' ${dateFilter.replace('WHERE', 'AND')}
            GROUP BY ${groupByClause}
            ORDER BY period DESC
        `, params);

        // Get waste type breakdown
        const wasteTypeBreakdown = await database.all(`
            SELECT 
                wt.name,
                wt.price_per_kg,
                COUNT(t.id) as transaction_count,
                SUM(t.total_amount) as total_amount,
                SUM(t.weight) as total_weight,
                AVG(t.total_amount) as average_amount
            FROM transactions t
            JOIN waste_types wt ON t.waste_type_id = wt.id
            WHERE t.status = 'completed' ${dateFilter.replace('WHERE', 'AND')}
            GROUP BY wt.id, wt.name, wt.price_per_kg
            ORDER BY total_amount DESC
        `, params);

        res.json({
            success: true,
            data: {
                financialData,
                wasteTypeBreakdown,
                summary: {
                    totalPeriods: financialData.length,
                    totalAmount: financialData.reduce((sum, item) => sum + item.total_amount, 0),
                    totalTransactions: financialData.reduce((sum, item) => sum + item.transaction_count, 0),
                    totalWeight: financialData.reduce((sum, item) => sum + item.total_weight, 0)
                }
            }
        });

    } catch (error) {
        console.error('Financial report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate financial report'
        });
    }
});

// Get user activity report
router.get('/user-activity', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, limit = 50 } = req.query;
        
        let dateFilter = '';
        let params = [];
        
        if (startDate && endDate) {
            dateFilter = 'AND DATE(t.created_at) BETWEEN ? AND ?';
            params = [startDate, endDate];
        }

        // Get user activity data
        const userActivity = await database.all(`
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.role,
                u.created_at as registration_date,
                ub.total_earnings,
                ub.total_deposits,
                ub.last_transaction_date,
                COUNT(t.id) as transaction_count,
                SUM(CASE WHEN t.status = 'completed' THEN t.total_amount ELSE 0 END) as completed_amount,
                SUM(CASE WHEN t.status = 'completed' THEN t.weight ELSE 0 END) as completed_weight
            FROM users u
            LEFT JOIN user_balances ub ON u.id = ub.user_id
            LEFT JOIN transactions t ON u.id = t.user_id ${dateFilter}
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, u.created_at, ub.total_earnings, ub.total_deposits, ub.last_transaction_date
            ORDER BY completed_amount DESC
            LIMIT ?
        `, [...params, parseInt(limit)]);

        // Get user registration trends
        const registrationTrends = await database.all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as registrations
            FROM users
            WHERE created_at >= datetime('now', '-30 days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        res.json({
            success: true,
            data: {
                userActivity,
                registrationTrends,
                summary: {
                    totalUsers: userActivity.length,
                    activeUsers: userActivity.filter(u => u.transaction_count > 0).length,
                    totalEarnings: userActivity.reduce((sum, u) => sum + (u.completed_amount || 0), 0),
                    totalTransactions: userActivity.reduce((sum, u) => sum + u.transaction_count, 0)
                }
            }
        });

    } catch (error) {
        console.error('User activity report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate user activity report'
        });
    }
});

// Get waste type performance report
router.get('/waste-types', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let dateFilter = '';
        let params = [];
        
        if (startDate && endDate) {
            dateFilter = 'AND DATE(t.created_at) BETWEEN ? AND ?';
            params = [startDate, endDate];
        }

        // Get waste type performance
        const wasteTypePerformance = await database.all(`
            SELECT 
                wt.id,
                wt.name,
                wt.description,
                wt.price_per_kg,
                wt.is_active,
                COUNT(t.id) as transaction_count,
                SUM(CASE WHEN t.status = 'completed' THEN t.total_amount ELSE 0 END) as total_amount,
                SUM(CASE WHEN t.status = 'completed' THEN t.weight ELSE 0 END) as total_weight,
                AVG(CASE WHEN t.status = 'completed' THEN t.total_amount ELSE NULL END) as average_amount,
                MIN(t.created_at) as first_transaction,
                MAX(t.created_at) as last_transaction
            FROM waste_types wt
            LEFT JOIN transactions t ON wt.id = t.waste_type_id ${dateFilter}
            GROUP BY wt.id, wt.name, wt.description, wt.price_per_kg, wt.is_active
            ORDER BY total_amount DESC
        `, params);

        // Get price history (if we had a price_history table)
        const priceAnalysis = await database.all(`
            SELECT 
                wt.name,
                wt.price_per_kg,
                COUNT(t.id) as transaction_count,
                AVG(t.total_amount / t.weight) as actual_avg_price
            FROM waste_types wt
            LEFT JOIN transactions t ON wt.id = t.waste_type_id AND t.status = 'completed' ${dateFilter}
            GROUP BY wt.id, wt.name, wt.price_per_kg
            HAVING transaction_count > 0
            ORDER BY transaction_count DESC
        `, params);

        res.json({
            success: true,
            data: {
                wasteTypePerformance,
                priceAnalysis,
                summary: {
                    totalWasteTypes: wasteTypePerformance.length,
                    activeWasteTypes: wasteTypePerformance.filter(wt => wt.is_active).length,
                    totalTransactions: wasteTypePerformance.reduce((sum, wt) => sum + wt.transaction_count, 0),
                    totalAmount: wasteTypePerformance.reduce((sum, wt) => sum + (wt.total_amount || 0), 0)
                }
            }
        });

    } catch (error) {
        console.error('Waste type report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate waste type report'
        });
    }
});

// Export transactions to CSV
router.get('/export/transactions', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { startDate, endDate, format = 'csv' } = req.query;
        
        let dateFilter = '';
        let params = [];
        
        if (startDate && endDate) {
            dateFilter = 'WHERE DATE(t.created_at) BETWEEN ? AND ?';
            params = [startDate, endDate];
        }

        const transactions = await database.all(`
            SELECT 
                t.id,
                t.created_at,
                u.first_name,
                u.last_name,
                u.email,
                wt.name as waste_type,
                t.weight,
                t.price_per_kg,
                t.total_amount,
                t.status,
                t.notes
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            JOIN waste_types wt ON t.waste_type_id = wt.id
            ${dateFilter}
            ORDER BY t.created_at DESC
        `, params);

        if (format === 'csv') {
            // Generate CSV
            const csvHeader = 'ID,Tanggal,Pelanggan,Email,Jenis Sampah,Berat (kg),Harga per kg,Total,Status,Catatan\n';
            const csvData = transactions.map(t => 
                `${t.id},"${t.created_at}","${t.first_name} ${t.last_name}","${t.email}","${t.waste_type}",${t.weight},${t.price_per_kg},${t.total_amount},"${t.status}","${t.notes || ''}"`
            ).join('\n');
            
            const csv = csvHeader + csvData;
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
            res.send(csv);
        } else {
            res.json({
                success: true,
                data: transactions
            });
        }

    } catch (error) {
        console.error('Export transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export transactions'
        });
    }
});

// Get system health report
router.get('/system-health', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        // Get database statistics
        const [
            dbSize,
            tableStats,
            recentErrors,
            systemStats
        ] = await Promise.all([
            // Database size (approximate)
            database.get("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'"),
            
            // Table statistics
            database.all(`
                SELECT 
                    name,
                    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name = m.name) as exists
                FROM sqlite_master m
                WHERE type='table'
            `),
            
            // Recent activity (last 24 hours)
            database.get(`
                SELECT COUNT(*) as count 
                FROM transactions 
                WHERE created_at >= datetime('now', '-1 day')
            `),
            
            // System statistics
            database.get(`
                SELECT 
                    COUNT(DISTINCT user_id) as active_users,
                    COUNT(*) as total_transactions
                FROM transactions 
                WHERE created_at >= datetime('now', '-7 days')
            `)
        ]);

        // Calculate health metrics
        const healthMetrics = {
            database: {
                tables: dbSize.count,
                status: 'healthy'
            },
            activity: {
                transactionsLast24h: recentErrors.count,
                activeUsersLast7d: systemStats.active_users,
                totalTransactionsLast7d: systemStats.total_transactions
            },
            performance: {
                status: 'good',
                responseTime: '< 100ms'
            }
        };

        res.json({
            success: true,
            data: healthMetrics
        });

    } catch (error) {
        console.error('System health report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate system health report'
        });
    }
});

// ===== OPERATOR REPORTS =====
// These reports are accessible by both admin and operator roles

// Get transaction summary for operators
router.get('/operator/transactions', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        
        let dateFilter = '';
        let statusFilter = '';
        let params = [];
        
        if (startDate && endDate) {
            dateFilter = 'AND DATE(t.created_at) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        
        if (status) {
            statusFilter = 'AND t.status = ?';
            params.push(status);
        }

        // Get transaction summary
        const transactionSummary = await database.get(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_transactions,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_transactions,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_transactions,
                SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as total_earnings,
                SUM(CASE WHEN status = 'completed' THEN weight ELSE 0 END) as total_weight,
                AVG(CASE WHEN status = 'completed' THEN total_amount ELSE NULL END) as average_transaction_value
            FROM transactions t
            WHERE 1=1 ${dateFilter} ${statusFilter}
        `, params);

        // Get transactions by waste type
        const transactionsByWasteType = await database.all(`
            SELECT 
                wt.name as waste_type,
                COUNT(t.id) as transaction_count,
                SUM(CASE WHEN t.status = 'completed' THEN t.weight ELSE 0 END) as total_weight,
                SUM(CASE WHEN t.status = 'completed' THEN t.total_amount ELSE 0 END) as total_earnings,
                AVG(CASE WHEN t.status = 'completed' THEN t.total_amount ELSE NULL END) as average_value
            FROM waste_types wt
            LEFT JOIN transactions t ON wt.id = t.waste_type_id
            WHERE 1=1 ${dateFilter} ${statusFilter}
            GROUP BY wt.id, wt.name
            ORDER BY total_earnings DESC
        `, params);

        // Get recent transactions
        const recentTransactions = await database.all(`
            SELECT 
                t.id,
                t.created_at,
                u.first_name || ' ' || u.last_name as customer_name,
                wt.name as waste_type,
                t.weight,
                t.total_amount,
                t.status,
                t.notes
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            JOIN waste_types wt ON t.waste_type_id = wt.id
            WHERE 1=1 ${dateFilter} ${statusFilter}
            ORDER BY t.created_at DESC
            LIMIT 20
        `, params);

        res.json({
            success: true,
            data: {
                summary: transactionSummary,
                byWasteType: transactionsByWasteType,
                recentTransactions: recentTransactions
            }
        });

    } catch (error) {
        console.error('Error getting operator transaction report:', error);
        res.status(500).json({ success: false, message: 'Failed to get transaction report' });
    }
});

// Get monthly report for operators
router.get('/operator/monthly', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;
        
        // Get monthly transaction data
        const monthlyData = await database.all(`
            SELECT 
                strftime('%m', created_at) as month,
                strftime('%Y-%m', created_at) as year_month,
                COUNT(*) as total_transactions,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_transactions,
                SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as total_earnings,
                SUM(CASE WHEN status = 'completed' THEN weight ELSE 0 END) as total_weight,
                AVG(CASE WHEN status = 'completed' THEN total_amount ELSE NULL END) as average_transaction_value
            FROM transactions
            WHERE strftime('%Y', created_at) = ?
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY year_month ASC
        `, [year.toString()]);

        // Get monthly waste type breakdown
        const monthlyWasteTypeData = await database.all(`
            SELECT 
                strftime('%Y-%m', t.created_at) as year_month,
                wt.name as waste_type,
                COUNT(t.id) as transaction_count,
                SUM(CASE WHEN t.status = 'completed' THEN t.weight ELSE 0 END) as total_weight,
                SUM(CASE WHEN t.status = 'completed' THEN t.total_amount ELSE 0 END) as total_earnings
            FROM transactions t
            JOIN waste_types wt ON t.waste_type_id = wt.id
            WHERE strftime('%Y', t.created_at) = ? AND t.status = 'completed'
            GROUP BY strftime('%Y-%m', t.created_at), wt.id, wt.name
            ORDER BY year_month ASC, total_earnings DESC
        `, [year.toString()]);

        // Get year comparison
        const yearComparison = await database.all(`
            SELECT 
                strftime('%Y', created_at) as year,
                COUNT(*) as total_transactions,
                SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as total_earnings,
                SUM(CASE WHEN status = 'completed' THEN weight ELSE 0 END) as total_weight
            FROM transactions
            WHERE strftime('%Y', created_at) >= strftime('%Y', 'now', '-2 years')
            GROUP BY strftime('%Y', created_at)
            ORDER BY year DESC
        `);

        res.json({
            success: true,
            data: {
                monthlyData,
                monthlyWasteTypeData,
                yearComparison,
                selectedYear: year
            }
        });

    } catch (error) {
        console.error('Error getting operator monthly report:', error);
        res.status(500).json({ success: false, message: 'Failed to get monthly report' });
    }
});

// Get user transaction report for operators
router.get('/operator/user-transactions', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { startDate, endDate, userId } = req.query;
        console.log('User transaction report request:', { startDate, endDate, userId });
        
        let dateFilter = '';
        let userFilter = '';
        let params = [];
        
        if (startDate && endDate) {
            dateFilter = 'AND DATE(t.created_at) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        
        if (userId) {
            userFilter = 'AND t.user_id = ?';
            params.push(userId);
        }

        // Get user transaction summary
        const userSummaryQuery = `
            SELECT 
                u.id,
                u.first_name || ' ' || u.last_name as customer_name,
                u.email,
                u.phone,
                COUNT(t.id) as total_transactions,
                SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_transactions,
                SUM(CASE WHEN t.status = 'completed' THEN t.total_amount ELSE 0 END) as total_earnings,
                SUM(CASE WHEN t.status = 'completed' THEN t.weight ELSE 0 END) as total_weight,
                AVG(CASE WHEN t.status = 'completed' THEN t.total_amount ELSE NULL END) as average_transaction_value,
                MAX(t.created_at) as last_transaction_date,
                MIN(t.created_at) as first_transaction_date
            FROM users u
            LEFT JOIN transactions t ON u.id = t.user_id ${dateFilter}
            WHERE u.role = 'customer' ${userFilter}
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone
            HAVING total_transactions > 0
            ORDER BY total_earnings DESC
        `;
        
        console.log('User summary query:', userSummaryQuery);
        console.log('Query params:', params);
        
        const userSummary = await database.all(userSummaryQuery, params);

        // Get detailed transactions for each user (if userId is specified)
        let userTransactions = [];
        if (userId) {
            userTransactions = await database.all(`
                SELECT 
                    t.id,
                    t.created_at,
                    wt.name as waste_type,
                    t.weight,
                    t.price_per_kg,
                    t.total_amount,
                    t.status,
                    t.notes
                FROM transactions t
                JOIN waste_types wt ON t.waste_type_id = wt.id
                WHERE t.user_id = ? ${dateFilter}
                ORDER BY t.created_at DESC
            `, [userId, ...params]);
        }

        // Get top customers by transaction count
        const topCustomers = await database.all(`
            SELECT 
                u.id,
                u.first_name || ' ' || u.last_name as customer_name,
                u.email,
                COUNT(t.id) as transaction_count,
                SUM(CASE WHEN t.status = 'completed' THEN t.total_amount ELSE 0 END) as total_earnings
            FROM users u
            JOIN transactions t ON u.id = t.user_id
            WHERE u.role = 'customer' ${dateFilter}
            GROUP BY u.id, u.first_name, u.last_name, u.email
            ORDER BY transaction_count DESC
            LIMIT 10
        `, params);

        res.json({
            success: true,
            data: {
                userSummary,
                userTransactions,
                topCustomers
            }
        });

    } catch (error) {
        console.error('Error getting operator user transaction report:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get user transaction report',
            error: error.message 
        });
    }
});

// Export operator reports to CSV
router.get('/operator/export/transactions', authenticateToken, requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { startDate, endDate, format = 'csv' } = req.query;
        
        let dateFilter = '';
        let params = [];
        
        if (startDate && endDate) {
            dateFilter = 'AND DATE(t.created_at) BETWEEN ? AND ?';
            params = [startDate, endDate];
        }

        const transactions = await database.all(`
            SELECT 
                t.id as transaction_id,
                t.created_at as transaction_date,
                u.first_name || ' ' || u.last_name as customer_name,
                u.email as customer_email,
                u.phone as customer_phone,
                wt.name as waste_type,
                t.weight,
                t.price_per_kg,
                t.total_amount,
                t.status,
                t.notes
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            JOIN waste_types wt ON t.waste_type_id = wt.id
            WHERE 1=1 ${dateFilter}
            ORDER BY t.created_at DESC
        `, params);

        if (transactions.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No transactions found for the specified date range.' 
            });
        }

        if (format === 'csv') {
            const headers = Object.keys(transactions[0]).join(',');
            const csvRows = transactions.map(row => 
                Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
            );
            const csv = [headers, ...csvRows].join('\n');

            res.header('Content-Type', 'text/csv');
            res.attachment(`operator_transactions_${startDate || 'all'}_${endDate || 'all'}.csv`);
            res.send(csv);
        } else {
            res.json({
                success: true,
                data: transactions
            });
        }

    } catch (error) {
        console.error('Error exporting operator transactions:', error);
        res.status(500).json({ success: false, message: 'Failed to export transactions' });
    }
});

module.exports = router;
