const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const userValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('firstName').trim().isLength({ min: 2 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Last name is required'),
    body('phone').optional().isMobilePhone('id-ID').withMessage('Valid phone number is required'),
    body('address').optional().trim().isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),
    body('role').optional().isIn(['customer', 'operator', 'admin']).withMessage('Invalid role')
];

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await database.get(`
            SELECT 
                u.id, u.email, u.first_name, u.last_name, u.phone, u.address, u.role, u.is_active, u.created_at,
                ub.total_earnings, ub.total_deposits, ub.last_transaction_date
            FROM users u
            LEFT JOIN user_balances ub ON u.id = ub.user_id
            WHERE u.id = ?
        `, [req.user.id]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    phone: user.phone,
                    address: user.address,
                    role: user.role,
                    isActive: user.is_active,
                    createdAt: user.created_at,
                    balance: {
                        totalEarnings: user.total_earnings || 0,
                        totalDeposits: user.total_deposits || 0,
                        lastTransactionDate: user.last_transaction_date
                    }
                }
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile'
        });
    }
});

// Update user profile
router.put('/profile', authenticateToken, userValidation, async (req, res) => {
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

        const { firstName, lastName, phone, address } = req.body;

        // Update user profile
        await database.run(`
            UPDATE users 
            SET first_name = ?, last_name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [firstName, lastName, phone || null, address || null, req.user.id]);

        // Get updated user
        const user = await database.get(`
            SELECT id, email, first_name, last_name, phone, address, role, created_at
            FROM users WHERE id = ?
        `, [req.user.id]);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

// Change password
router.put('/change-password', authenticateToken, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
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

        const { currentPassword, newPassword } = req.body;

        // Get current user with password hash
        const user = await database.get(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await database.run(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newPasswordHash, req.user.id]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
});

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', role = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let params = [];

        // Search filter
        if (search) {
            whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Role filter
        if (role) {
            whereConditions.push('u.role = ?');
            params.push(role);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get users
        const users = await database.all(`
            SELECT 
                u.id, u.email, u.first_name, u.last_name, u.phone, u.address, u.role, u.is_active, u.created_at,
                ub.total_earnings, ub.total_deposits
            FROM users u
            LEFT JOIN user_balances ub ON u.id = ub.user_id
            ${whereClause}
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);

        // Get total count
        const countResult = await database.get(`
            SELECT COUNT(*) as total
            FROM users u
            ${whereClause}
        `, params);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users'
        });
    }
});

// Create user (admin only)
router.post('/', authenticateToken, requireRole(['admin']), userValidation, async (req, res) => {
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

        const { email, firstName, lastName, phone, address, role = 'customer', password } = req.body;

        // Check if user already exists
        const existingUser = await database.get(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Generate default password if not provided
        const defaultPassword = password || 'password123';
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

        // Create user
        const result = await database.run(`
            INSERT INTO users (email, password_hash, first_name, last_name, phone, address, role)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [email, passwordHash, firstName, lastName, phone || null, address || null, role]);

        // Initialize user balance for customers
        if (role === 'customer') {
            await database.run(
                'INSERT INTO user_balances (user_id, total_earnings, total_deposits) VALUES (?, 0, 0)',
                [result.id]
            );
        }

        // Get created user
        const user = await database.get(
            'SELECT id, email, first_name, last_name, phone, address, role, created_at FROM users WHERE id = ?',
            [result.id]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { user }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user'
        });
    }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), userValidation, async (req, res) => {
    try {
        const { id } = req.params;
        const { email, firstName, lastName, phone, address, role, isActive } = req.body;

        // Check if user exists
        const existingUser = await database.get(
            'SELECT id FROM users WHERE id = ?',
            [id]
        );

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is already taken by another user
        if (email) {
            const duplicateUser = await database.get(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, id]
            );

            if (duplicateUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already taken by another user'
                });
            }
        }

        // Update user
        await database.run(`
            UPDATE users 
            SET email = COALESCE(?, email),
                first_name = COALESCE(?, first_name),
                last_name = COALESCE(?, last_name),
                phone = COALESCE(?, phone),
                address = COALESCE(?, address),
                role = COALESCE(?, role),
                is_active = COALESCE(?, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [email, firstName, lastName, phone, address, role, isActive, id]);

        // Get updated user
        const user = await database.get(`
            SELECT id, email, first_name, last_name, phone, address, role, is_active, created_at, updated_at
            FROM users WHERE id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'User updated successfully',
            data: { user }
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user'
        });
    }
});

// Toggle user active status (admin only)
router.patch('/:id/toggle', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Get current status
        const user = await database.get(
            'SELECT id, is_active FROM users WHERE id = ?',
            [id]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Toggle status
        const newStatus = user.is_active ? 0 : 1;
        await database.run(
            'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newStatus, id]
        );

        res.json({
            success: true,
            message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`
        });

    } catch (error) {
        console.error('Toggle user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle user status'
        });
    }
});

module.exports = router;
