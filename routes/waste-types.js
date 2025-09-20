const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const wasteTypeValidation = [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('pricePerKg').isFloat({ min: 0 }).withMessage('Price per kg must be a positive number'),
    body('unit').optional().trim().isLength({ max: 20 }).withMessage('Unit must be less than 20 characters')
];

// Get all waste types
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { active = 'true' } = req.query;
        
        let whereClause = '';
        let params = [];

        if (active === 'true') {
            whereClause = 'WHERE is_active = 1';
        }

        const wasteTypes = await database.all(`
            SELECT id, name, description, price_per_kg, unit, is_active, created_at, updated_at
            FROM waste_types
            ${whereClause}
            ORDER BY name ASC
        `, params);

        res.json({
            success: true,
            data: { wasteTypes }
        });

    } catch (error) {
        console.error('Get waste types error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get waste types'
        });
    }
});

// Get single waste type
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const wasteType = await database.get(
            'SELECT id, name, description, price_per_kg, unit, is_active, created_at, updated_at FROM waste_types WHERE id = ?',
            [id]
        );

        if (!wasteType) {
            return res.status(404).json({
                success: false,
                message: 'Waste type not found'
            });
        }

        res.json({
            success: true,
            data: { wasteType }
        });

    } catch (error) {
        console.error('Get waste type error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get waste type'
        });
    }
});

// Create new waste type (admin only)
router.post('/', authenticateToken, requireRole(['admin']), wasteTypeValidation, async (req, res) => {
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

        const { name, description, pricePerKg, unit = 'kg' } = req.body;

        // Check if waste type already exists
        const existingWasteType = await database.get(
            'SELECT id FROM waste_types WHERE name = ?',
            [name]
        );

        if (existingWasteType) {
            return res.status(400).json({
                success: false,
                message: 'Waste type with this name already exists'
            });
        }

        // Create waste type
        const result = await database.run(`
            INSERT INTO waste_types (name, description, price_per_kg, unit)
            VALUES (?, ?, ?, ?)
        `, [name, description || null, pricePerKg, unit]);

        // Get the created waste type
        const wasteType = await database.get(
            'SELECT id, name, description, price_per_kg, unit, is_active, created_at FROM waste_types WHERE id = ?',
            [result.id]
        );

        res.status(201).json({
            success: true,
            message: 'Waste type created successfully',
            data: { wasteType }
        });

    } catch (error) {
        console.error('Create waste type error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create waste type'
        });
    }
});

// Update waste type (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), wasteTypeValidation, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, pricePerKg, unit, isActive } = req.body;

        // Check if waste type exists
        const existingWasteType = await database.get(
            'SELECT id FROM waste_types WHERE id = ?',
            [id]
        );

        if (!existingWasteType) {
            return res.status(404).json({
                success: false,
                message: 'Waste type not found'
            });
        }

        // Check if name is already taken by another waste type
        if (name) {
            const duplicateWasteType = await database.get(
                'SELECT id FROM waste_types WHERE name = ? AND id != ?',
                [name, id]
            );

            if (duplicateWasteType) {
                return res.status(400).json({
                    success: false,
                    message: 'Waste type with this name already exists'
                });
            }
        }

        // Update waste type
        await database.run(`
            UPDATE waste_types 
            SET name = COALESCE(?, name),
                description = COALESCE(?, description),
                price_per_kg = COALESCE(?, price_per_kg),
                unit = COALESCE(?, unit),
                is_active = COALESCE(?, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [name, description, pricePerKg, unit, isActive, id]);

        // Get updated waste type
        const wasteType = await database.get(
            'SELECT id, name, description, price_per_kg, unit, is_active, created_at, updated_at FROM waste_types WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Waste type updated successfully',
            data: { wasteType }
        });

    } catch (error) {
        console.error('Update waste type error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update waste type'
        });
    }
});

// Delete waste type (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if waste type exists
        const wasteType = await database.get(
            'SELECT id, name FROM waste_types WHERE id = ?',
            [id]
        );

        if (!wasteType) {
            return res.status(404).json({
                success: false,
                message: 'Waste type not found'
            });
        }

        // Check if waste type is used in transactions
        const transactionCount = await database.get(
            'SELECT COUNT(*) as count FROM transactions WHERE waste_type_id = ?',
            [id]
        );

        if (transactionCount.count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete waste type that is used in transactions. Deactivate it instead.'
            });
        }

        // Delete waste type
        await database.run('DELETE FROM waste_types WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Waste type deleted successfully'
        });

    } catch (error) {
        console.error('Delete waste type error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete waste type'
        });
    }
});

// Toggle waste type active status (admin only)
router.patch('/:id/toggle', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Get current status
        const wasteType = await database.get(
            'SELECT id, is_active FROM waste_types WHERE id = ?',
            [id]
        );

        if (!wasteType) {
            return res.status(404).json({
                success: false,
                message: 'Waste type not found'
            });
        }

        // Toggle status
        const newStatus = wasteType.is_active ? 0 : 1;
        await database.run(
            'UPDATE waste_types SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newStatus, id]
        );

        res.json({
            success: true,
            message: `Waste type ${newStatus ? 'activated' : 'deactivated'} successfully`
        });

    } catch (error) {
        console.error('Toggle waste type error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle waste type status'
        });
    }
});

module.exports = router;
