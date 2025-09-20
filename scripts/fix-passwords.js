const bcrypt = require('bcryptjs');
const database = require('../config/database');

async function fixPasswords() {
    try {
        console.log('Fixing password hashes...');
        
        // Connect to database
        await database.connect();
        
        // Define the correct passwords and their corresponding users
        const passwordUpdates = [
            { email: 'admin@banksampah.com', password: 'admin123' },
            { email: 'operator@banksampah.com', password: 'operator123' },
            { email: 'customer1@example.com', password: 'customer123' },
            { email: 'customer2@example.com', password: 'customer123' },
            { email: 'customer3@example.com', password: 'customer123' }
        ];
        
        // Update each user's password
        for (const update of passwordUpdates) {
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(update.password, saltRounds);
            
            const result = await database.run(
                'UPDATE users SET password_hash = ? WHERE email = ?',
                [passwordHash, update.email]
            );
            
            if (result.changes > 0) {
                console.log(`✅ Updated password for ${update.email}`);
            } else {
                console.log(`❌ User not found: ${update.email}`);
            }
        }
        
        console.log('Password fixes completed!');
        console.log('\nTest credentials:');
        console.log('Admin: admin@banksampah.com / admin123');
        console.log('Operator: operator@banksampah.com / operator123');
        console.log('Customer: customer1@example.com / customer123');
        
    } catch (error) {
        console.error('Error fixing passwords:', error);
    } finally {
        // Close database connection
        if (database.close) {
            database.close();
        }
    }
}

// Run the script
fixPasswords();
