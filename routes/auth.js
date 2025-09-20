const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { generateToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').trim().isLength({ min: 2 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Last name is required'),
    body('phone').optional().isMobilePhone('id-ID').withMessage('Valid phone number is required'),
    body('address').optional().trim().isLength({ min: 5 }).withMessage('Address must be at least 5 characters')
];

const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

// Register new user
router.post('/register', registerValidation, async (req, res) => {
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

        const { email, password, firstName, lastName, phone, address } = req.body;

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

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const result = await database.run(
            `INSERT INTO users (email, password_hash, first_name, last_name, phone, address, role) 
             VALUES (?, ?, ?, ?, ?, ?, 'customer')`,
            [email, passwordHash, firstName, lastName, phone || null, address || null]
        );

        // Initialize user balance
        await database.run(
            'INSERT INTO user_balances (user_id, total_earnings, total_deposits) VALUES (?, 0, 0)',
            [result.id]
        );

        // Generate tokens
        const token = generateToken(result.id);
        const refreshToken = generateRefreshToken(result.id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: result.id,
                    email,
                    firstName,
                    lastName,
                    role: 'customer'
                },
                token,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});

// Login user
router.post('/login', loginValidation, async (req, res) => {
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

        const { email, password } = req.body;

        // Get user from database
        const user = await database.get(
            'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = ?',
            [email]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate tokens
        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role
                },
                token,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await database.get(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.address, u.role, u.created_at,
                    ub.total_earnings, ub.total_deposits, ub.last_transaction_date
             FROM users u
             LEFT JOIN user_balances ub ON u.id = ub.user_id
             WHERE u.id = ?`,
            [req.user.id]
        );

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
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile'
        });
    }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

// Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        
        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Verify user still exists and is active
        const user = await database.get(
            'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = ? AND is_active = 1',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        // Generate new tokens
        const newToken = generateToken(user.id);
        const newRefreshToken = generateRefreshToken(user.id);

        res.json({
            success: true,
            data: {
                token: newToken,
                refreshToken: newRefreshToken
            }
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
});

module.exports = router;
