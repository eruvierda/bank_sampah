const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, '..', 'database', 'bank_sampah.db');
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
const sampleDataPath = path.join(__dirname, '..', 'database', 'sample-data.sql');

// Create database directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
function initDatabase() {
    console.log('Initializing Bank Sampah Database...');
    
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
            return;
        }
        console.log('Connected to SQLite database.');
    });

    // Read and execute schema
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error creating schema:', err.message);
        } else {
            console.log('Database schema created successfully.');
        }
    });

    // Read and execute sample data
    const sampleData = fs.readFileSync(sampleDataPath, 'utf8');
    db.exec(sampleData, (err) => {
        if (err) {
            console.error('Error inserting sample data:', err.message);
        } else {
            console.log('Sample data inserted successfully.');
        }
    });

    // Verify tables were created
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error('Error listing tables:', err.message);
        } else {
            console.log('Tables created:', tables.map(t => t.name).join(', '));
        }
        
        // Close database connection
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database initialization completed.');
                console.log('Database file location:', dbPath);
            }
        });
    });
}

// Run initialization
initDatabase();
