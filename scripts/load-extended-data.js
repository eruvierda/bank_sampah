const fs = require('fs');
const path = require('path');
const database = require('../config/database');

async function loadExtendedData() {
    try {
        console.log('Loading extended sample data...');
        
        // Connect to database
        await database.connect();
        
        // Execute the SQL file directly
        const sqlFilePath = path.join(__dirname, '..', 'database', 'extended-sample-data.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        // Execute the entire SQL content
        try {
            await database.exec(sqlContent);
            console.log('✅ Extended sample data SQL executed successfully');
        } catch (error) {
            console.log('⚠️  Some statements may have been skipped (likely already exist):', error.message);
        }
        
        // Verify the data
        const userCount = await database.get('SELECT COUNT(*) as count FROM users');
        const transactionCount = await database.get('SELECT COUNT(*) as count FROM transactions');
        const totalEarnings = await database.get('SELECT SUM(total_amount) as total FROM transactions WHERE status = "completed"');
        
        console.log('\n📊 Data Summary:');
        console.log(`- Total Users: ${userCount.count}`);
        console.log(`- Total Transactions: ${transactionCount.count}`);
        console.log(`- Total Earnings: Rp ${(totalEarnings.total || 0).toLocaleString('id-ID')}`);
        
        // Show sample of recent transactions
        const recentTransactions = await database.all(`
            SELECT 
                t.created_at,
                u.first_name || ' ' || u.last_name as customer_name,
                wt.name as waste_type,
                t.weight,
                t.total_amount,
                t.status
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            JOIN waste_types wt ON t.waste_type_id = wt.id
            ORDER BY t.created_at DESC
            LIMIT 5
        `);
        
        console.log('\n📋 Recent Transactions:');
        recentTransactions.forEach(tx => {
            console.log(`- ${tx.customer_name}: ${tx.waste_type} (${tx.weight}kg) - ${tx.status} - Rp ${tx.total_amount.toLocaleString('id-ID')}`);
        });
        
        console.log('\n✅ Extended sample data loaded successfully!');
        console.log('\n🎯 Test Credentials:');
        console.log('Admin: admin@banksampah.com / admin123');
        console.log('Operator: operator@banksampah.com / operator123');
        console.log('Customer: customer1@example.com / customer123');
        console.log('Customer: sari@example.com / customer123');
        console.log('Customer: bambang@example.com / customer123');
        
    } catch (error) {
        console.error('Error loading extended sample data:', error);
    } finally {
        // Close database connection
        if (database.close) {
            database.close();
        }
    }
}

// Run the script
loadExtendedData();
