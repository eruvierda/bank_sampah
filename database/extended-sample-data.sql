-- Extended Sample Data for Bank Sampah System
-- More comprehensive data for 2 months with varied transactions

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM transactions;
-- DELETE FROM user_balances;
-- DELETE FROM users WHERE email != 'admin@banksampah.com' AND email != 'operator@banksampah.com';

-- Insert additional sample customers
INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, phone, address, role) VALUES
('sari@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sari', 'Wulandari', '081234567895', 'Jl. Diponegoro No. 45', 'customer'),
('bambang@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bambang', 'Prasetyo', '081234567896', 'Jl. Gatot Subroto No. 78', 'customer'),
('rina@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Rina', 'Sari', '081234567897', 'Jl. Sudirman No. 123', 'customer'),
('agus@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Agus', 'Santoso', '081234567898', 'Jl. Thamrin No. 67', 'customer'),
('dewi@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dewi', 'Kartika', '081234567899', 'Jl. Kebon Jeruk No. 89', 'customer'),
('joko@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Joko', 'Widodo', '081234567900', 'Jl. Senayan No. 34', 'customer'),
('lina@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lina', 'Maharani', '081234567901', 'Jl. Kuningan No. 56', 'customer'),
('tono@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Tono', 'Sutrisno', '081234567902', 'Jl. Menteng No. 78', 'customer'),
('maya@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Maya', 'Indira', '081234567903', 'Jl. Kemang No. 90', 'customer'),
('riko@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Riko', 'Pratama', '081234567904', 'Jl. Pondok Indah No. 12', 'customer');

-- Initialize user balances for new customers
INSERT OR IGNORE INTO user_balances (user_id, total_earnings, total_deposits) VALUES
(6, 0.00, 0.00),  -- sari@example.com
(7, 0.00, 0.00),  -- bambang@example.com
(8, 0.00, 0.00),  -- rina@example.com
(9, 0.00, 0.00),  -- agus@example.com
(10, 0.00, 0.00), -- dewi@example.com
(11, 0.00, 0.00), -- joko@example.com
(12, 0.00, 0.00), -- lina@example.com
(13, 0.00, 0.00), -- tono@example.com
(14, 0.00, 0.00), -- maya@example.com
(15, 0.00, 0.00); -- riko@example.com

-- Insert comprehensive transactions for 2 months (November 2024 - December 2024)
-- November 2024 transactions
INSERT OR IGNORE INTO transactions (user_id, waste_type_id, weight, price_per_kg, total_amount, status, operator_id, notes, created_at) VALUES
-- Week 1 November
(3, 1, 2.5, 3000.00, 7500.00, 'completed', 2, 'Botol plastik dari rumah tangga', '2024-11-01 09:30:00'),
(4, 2, 1.8, 2500.00, 4500.00, 'completed', 2, 'Kardus kemasan makanan', '2024-11-01 10:15:00'),
(5, 3, 0.6, 8000.00, 4800.00, 'completed', 2, 'Kaleng minuman ringan', '2024-11-01 11:00:00'),
(6, 4, 3.2, 2000.00, 6400.00, 'completed', 2, 'Kertas dan koran bekas', '2024-11-02 08:45:00'),
(7, 5, 1.5, 1500.00, 2250.00, 'completed', 2, 'Plastik kemasan', '2024-11-02 09:30:00'),
(8, 6, 2.1, 5000.00, 10500.00, 'completed', 2, 'Besi bekas konstruksi', '2024-11-02 10:20:00'),
(9, 7, 1.2, 1000.00, 1200.00, 'completed', 2, 'Botol kaca minuman', '2024-11-03 08:00:00'),
(10, 8, 0.8, 10000.00, 8000.00, 'completed', 2, 'Laptop bekas', '2024-11-03 09:15:00'),
(11, 1, 3.5, 3000.00, 10500.00, 'completed', 2, 'Botol plastik berbagai ukuran', '2024-11-03 10:30:00'),
(12, 2, 2.3, 2500.00, 5750.00, 'completed', 2, 'Kardus elektronik', '2024-11-04 08:30:00'),

-- Week 2 November
(3, 3, 1.2, 8000.00, 9600.00, 'completed', 2, 'Kaleng aluminium', '2024-11-05 09:00:00'),
(4, 4, 2.8, 2000.00, 5600.00, 'completed', 2, 'Kertas kantor', '2024-11-05 10:15:00'),
(5, 5, 2.0, 1500.00, 3000.00, 'completed', 2, 'Plastik kemasan makanan', '2024-11-06 08:45:00'),
(6, 6, 1.8, 5000.00, 9000.00, 'completed', 2, 'Besi pipa bekas', '2024-11-06 09:30:00'),
(7, 7, 0.9, 1000.00, 900.00, 'completed', 2, 'Gelas kaca', '2024-11-06 10:20:00'),
(8, 8, 1.5, 10000.00, 15000.00, 'completed', 2, 'Monitor komputer', '2024-11-07 08:00:00'),
(9, 1, 4.2, 3000.00, 12600.00, 'completed', 2, 'Botol air mineral', '2024-11-07 09:15:00'),
(10, 2, 3.1, 2500.00, 7750.00, 'completed', 2, 'Kardus pindahan', '2024-11-07 10:30:00'),
(11, 3, 0.7, 8000.00, 5600.00, 'completed', 2, 'Kaleng cat', '2024-11-08 08:30:00'),
(12, 4, 1.9, 2000.00, 3800.00, 'completed', 2, 'Majalah bekas', '2024-11-08 09:45:00'),

-- Week 3 November
(3, 5, 2.5, 1500.00, 3750.00, 'completed', 2, 'Plastik kemasan kosmetik', '2024-11-11 09:00:00'),
(4, 6, 3.2, 5000.00, 16000.00, 'completed', 2, 'Besi rangka bekas', '2024-11-11 10:15:00'),
(5, 7, 1.6, 1000.00, 1600.00, 'completed', 2, 'Botol obat', '2024-11-12 08:45:00'),
(6, 8, 2.1, 10000.00, 21000.00, 'completed', 2, 'Keyboard komputer', '2024-11-12 09:30:00'),
(7, 1, 2.8, 3000.00, 8400.00, 'completed', 2, 'Botol minuman ringan', '2024-11-12 10:20:00'),
(8, 2, 1.7, 2500.00, 4250.00, 'completed', 2, 'Kardus sepatu', '2024-11-13 08:00:00'),
(9, 3, 1.0, 8000.00, 8000.00, 'completed', 2, 'Kaleng susu', '2024-11-13 09:15:00'),
(10, 4, 2.4, 2000.00, 4800.00, 'completed', 2, 'Buku bekas', '2024-11-13 10:30:00'),
(11, 5, 1.8, 1500.00, 2700.00, 'completed', 2, 'Plastik kemasan snack', '2024-11-14 08:30:00'),
(12, 6, 2.6, 5000.00, 13000.00, 'completed', 2, 'Besi seng bekas', '2024-11-14 09:45:00'),

-- Week 4 November
(3, 7, 0.8, 1000.00, 800.00, 'completed', 2, 'Botol parfum', '2024-11-18 09:00:00'),
(4, 8, 1.3, 10000.00, 13000.00, 'completed', 2, 'Mouse komputer', '2024-11-18 10:15:00'),
(5, 1, 3.8, 3000.00, 11400.00, 'completed', 2, 'Botol minyak goreng', '2024-11-19 08:45:00'),
(6, 2, 2.9, 2500.00, 7250.00, 'completed', 2, 'Kardus peralatan', '2024-11-19 09:30:00'),
(7, 3, 1.4, 8000.00, 11200.00, 'completed', 2, 'Kaleng makanan', '2024-11-19 10:20:00'),
(8, 4, 3.5, 2000.00, 7000.00, 'completed', 2, 'Kertas dokumen', '2024-11-20 08:00:00'),
(9, 5, 2.2, 1500.00, 3300.00, 'completed', 2, 'Plastik kemasan obat', '2024-11-20 09:15:00'),
(10, 6, 1.9, 5000.00, 9500.00, 'completed', 2, 'Besi kawat bekas', '2024-11-20 10:30:00'),
(11, 7, 1.1, 1000.00, 1100.00, 'completed', 2, 'Botol kecap', '2024-11-21 08:30:00'),
(12, 8, 0.9, 10000.00, 9000.00, 'completed', 2, 'Speaker komputer', '2024-11-21 09:45:00'),

-- December 2024 transactions
-- Week 1 December
(3, 1, 4.5, 3000.00, 13500.00, 'completed', 2, 'Botol plastik besar', '2024-12-02 09:00:00'),
(4, 2, 3.2, 2500.00, 8000.00, 'completed', 2, 'Kardus elektronik besar', '2024-12-02 10:15:00'),
(5, 3, 1.8, 8000.00, 14400.00, 'completed', 2, 'Kaleng cat besar', '2024-12-02 11:00:00'),
(6, 4, 4.1, 2000.00, 8200.00, 'completed', 2, 'Kertas arsip kantor', '2024-12-03 08:45:00'),
(7, 5, 2.8, 1500.00, 4200.00, 'completed', 2, 'Plastik kemasan besar', '2024-12-03 09:30:00'),
(8, 6, 3.5, 5000.00, 17500.00, 'completed', 2, 'Besi konstruksi bekas', '2024-12-03 10:20:00'),
(9, 7, 2.1, 1000.00, 2100.00, 'completed', 2, 'Botol kaca besar', '2024-12-04 08:00:00'),
(10, 8, 2.8, 10000.00, 28000.00, 'completed', 2, 'CPU komputer', '2024-12-04 09:15:00'),
(11, 1, 3.2, 3000.00, 9600.00, 'completed', 2, 'Botol minuman besar', '2024-12-04 10:30:00'),
(12, 2, 2.7, 2500.00, 6750.00, 'completed', 2, 'Kardus furniture', '2024-12-05 08:30:00'),

-- Week 2 December
(3, 3, 2.1, 8000.00, 16800.00, 'completed', 2, 'Kaleng aluminium besar', '2024-12-09 09:00:00'),
(4, 4, 3.8, 2000.00, 7600.00, 'completed', 2, 'Kertas koran lama', '2024-12-09 10:15:00'),
(5, 5, 3.2, 1500.00, 4800.00, 'completed', 2, 'Plastik kemasan industri', '2024-12-09 11:00:00'),
(6, 6, 2.9, 5000.00, 14500.00, 'completed', 2, 'Besi pipa besar', '2024-12-10 08:45:00'),
(7, 7, 1.8, 1000.00, 1800.00, 'completed', 2, 'Gelas kaca besar', '2024-12-10 09:30:00'),
(8, 8, 3.2, 10000.00, 32000.00, 'completed', 2, 'Printer komputer', '2024-12-10 10:20:00'),
(9, 1, 5.1, 3000.00, 15300.00, 'completed', 2, 'Botol air galon', '2024-12-11 08:00:00'),
(10, 2, 4.3, 2500.00, 10750.00, 'completed', 2, 'Kardus pindahan besar', '2024-12-11 09:15:00'),
(11, 3, 1.6, 8000.00, 12800.00, 'completed', 2, 'Kaleng cat industri', '2024-12-11 10:30:00'),
(12, 4, 2.8, 2000.00, 5600.00, 'completed', 2, 'Buku teks bekas', '2024-12-12 08:30:00'),

-- Week 3 December
(3, 5, 3.5, 1500.00, 5250.00, 'completed', 2, 'Plastik kemasan kosmetik besar', '2024-12-16 09:00:00'),
(4, 6, 4.2, 5000.00, 21000.00, 'completed', 2, 'Besi rangka besar', '2024-12-16 10:15:00'),
(5, 7, 2.3, 1000.00, 2300.00, 'completed', 2, 'Botol obat besar', '2024-12-16 11:00:00'),
(6, 8, 2.8, 10000.00, 28000.00, 'completed', 2, 'Scanner komputer', '2024-12-17 08:45:00'),
(7, 1, 3.8, 3000.00, 11400.00, 'completed', 2, 'Botol minuman industri', '2024-12-17 09:30:00'),
(8, 2, 2.4, 2500.00, 6000.00, 'completed', 2, 'Kardus sepatu besar', '2024-12-17 10:20:00'),
(9, 3, 1.9, 8000.00, 15200.00, 'completed', 2, 'Kaleng susu besar', '2024-12-18 08:00:00'),
(10, 4, 3.2, 2000.00, 6400.00, 'completed', 2, 'Buku ensiklopedia', '2024-12-18 09:15:00'),
(11, 5, 2.6, 1500.00, 3900.00, 'completed', 2, 'Plastik kemasan snack besar', '2024-12-18 10:30:00'),
(12, 6, 3.1, 5000.00, 15500.00, 'completed', 2, 'Besi seng besar', '2024-12-19 08:30:00'),

-- Week 4 December
(3, 7, 1.4, 1000.00, 1400.00, 'completed', 2, 'Botol parfum besar', '2024-12-23 09:00:00'),
(4, 8, 1.8, 10000.00, 18000.00, 'completed', 2, 'Webcam komputer', '2024-12-23 10:15:00'),
(5, 1, 4.2, 3000.00, 12600.00, 'completed', 2, 'Botol minyak goreng besar', '2024-12-23 11:00:00'),
(6, 2, 3.6, 2500.00, 9000.00, 'completed', 2, 'Kardus peralatan besar', '2024-12-24 08:45:00'),
(7, 3, 2.2, 8000.00, 17600.00, 'completed', 2, 'Kaleng makanan besar', '2024-12-24 09:30:00'),
(8, 4, 4.5, 2000.00, 9000.00, 'completed', 2, 'Kertas dokumen arsip', '2024-12-24 10:20:00'),
(9, 5, 3.1, 1500.00, 4650.00, 'completed', 2, 'Plastik kemasan obat besar', '2024-12-26 08:00:00'),
(10, 6, 2.4, 5000.00, 12000.00, 'completed', 2, 'Besi kawat besar', '2024-12-26 09:15:00'),
(11, 7, 1.7, 1000.00, 1700.00, 'completed', 2, 'Botol kecap besar', '2024-12-26 10:30:00'),
(12, 8, 1.2, 10000.00, 12000.00, 'completed', 2, 'Speaker komputer besar', '2024-12-26 11:45:00'),

-- Some pending and cancelled transactions for variety
(3, 1, 2.0, 3000.00, 6000.00, 'pending', 2, 'Botol plastik - menunggu konfirmasi', '2024-12-27 09:00:00'),
(4, 2, 1.5, 2500.00, 3750.00, 'cancelled', 2, 'Kardus - dibatalkan customer', '2024-12-27 10:15:00'),
(5, 3, 0.8, 8000.00, 6400.00, 'pending', 2, 'Kaleng - menunggu pickup', '2024-12-28 08:45:00'),
(6, 4, 2.2, 2000.00, 4400.00, 'cancelled', 2, 'Kertas - kondisi tidak sesuai', '2024-12-28 09:30:00');

-- Update user balances based on all transactions
UPDATE user_balances SET 
    total_earnings = (
        SELECT COALESCE(SUM(total_amount), 0) 
        FROM transactions 
        WHERE user_id = user_balances.user_id AND status = 'completed'
    ),
    total_deposits = (
        SELECT COUNT(*) 
        FROM transactions 
        WHERE user_id = user_balances.user_id AND status = 'completed'
    ),
    last_transaction_date = (
        SELECT MAX(created_at) 
        FROM transactions 
        WHERE user_id = user_balances.user_id AND status = 'completed'
    )
WHERE user_id IN (3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
