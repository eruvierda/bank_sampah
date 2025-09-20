-- Sample Data for Bank Sampah System
-- Insert initial data for testing and development

-- Insert sample waste types
INSERT OR IGNORE INTO waste_types (name, description, price_per_kg, unit) VALUES
('Botol Plastik', 'Botol plastik bekas minuman', 3000.00, 'kg'),
('Kardus', 'Kardus bekas kemasan', 2500.00, 'kg'),
('Kaleng Aluminium', 'Kaleng minuman aluminium', 8000.00, 'kg'),
('Kertas', 'Kertas bekas dan koran', 2000.00, 'kg'),
('Plastik Lembaran', 'Plastik kemasan dan kantong', 1500.00, 'kg'),
('Besi', 'Besi bekas dan logam', 5000.00, 'kg'),
('Kaca', 'Botol kaca dan gelas bekas', 1000.00, 'kg'),
('Elektronik', 'Barang elektronik bekas', 10000.00, 'kg');

-- Insert admin user (password: admin123)
INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, phone, address, role) VALUES
('admin@banksampah.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'System', '081234567890', 'Jl. Admin No. 1', 'admin');

-- Insert operator user (password: operator123)
INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, phone, address, role) VALUES
('operator@banksampah.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Operator', 'Bank Sampah', '081234567891', 'Jl. Operator No. 1', 'operator');

-- Insert sample customers (password: customer123)
INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, phone, address, role) VALUES
('customer1@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ahmad', 'Suryadi', '081234567892', 'Jl. Merdeka No. 10', 'customer'),
('customer2@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Siti', 'Rahayu', '081234567893', 'Jl. Sudirman No. 20', 'customer'),
('customer3@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Budi', 'Santoso', '081234567894', 'Jl. Gatot Subroto No. 30', 'customer');

-- Initialize user balances for sample customers
INSERT OR IGNORE INTO user_balances (user_id, total_earnings, total_deposits) VALUES
(3, 0.00, 0.00),
(4, 0.00, 0.00),
(5, 0.00, 0.00);

-- Insert sample transactions
INSERT OR IGNORE INTO transactions (user_id, waste_type_id, weight, price_per_kg, total_amount, status, operator_id, notes) VALUES
(3, 1, 2.5, 3000.00, 7500.00, 'completed', 2, 'Botol plastik dari rumah tangga'),
(3, 2, 1.0, 2500.00, 2500.00, 'completed', 2, 'Kardus kemasan'),
(4, 1, 3.0, 3000.00, 9000.00, 'completed', 2, 'Botol plastik berbagai ukuran'),
(4, 3, 0.5, 8000.00, 4000.00, 'completed', 2, 'Kaleng minuman'),
(5, 2, 2.0, 2500.00, 5000.00, 'completed', 2, 'Kardus bekas'),
(5, 4, 1.5, 2000.00, 3000.00, 'completed', 2, 'Kertas dan koran bekas');

-- Update user balances based on sample transactions
UPDATE user_balances SET 
    total_earnings = 10000.00,
    total_deposits = 2,
    last_transaction_date = (SELECT MAX(created_at) FROM transactions WHERE user_id = 3)
WHERE user_id = 3;

UPDATE user_balances SET 
    total_earnings = 13000.00,
    total_deposits = 2,
    last_transaction_date = (SELECT MAX(created_at) FROM transactions WHERE user_id = 4)
WHERE user_id = 4;

UPDATE user_balances SET 
    total_earnings = 8000.00,
    total_deposits = 2,
    last_transaction_date = (SELECT MAX(created_at) FROM transactions WHERE user_id = 5)
WHERE user_id = 5;
