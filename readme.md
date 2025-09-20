# Bank Sampah Transaction System

Sistem manajemen transaksi Bank Sampah yang memungkinkan pengguna untuk mendepositkan berbagai jenis sampah dan melacak transaksi mereka melalui dashboard pribadi.

## 🚀 Fitur Utama

- **Autentikasi Pengguna**: Registrasi, login, dan manajemen profil dengan JWT
- **Manajemen Transaksi**: Pencatatan transaksi sampah dengan perhitungan otomatis
- **Dashboard Pribadi**: Tracking penghasilan dan riwayat transaksi dengan visualisasi data
- **Manajemen Jenis Sampah**: Pengaturan harga per kg untuk berbagai jenis sampah
- **Role-based Access**: Customer, Operator, dan Admin dengan permission yang berbeda
- **Sistem Laporan**: Laporan transaksi, bulanan, dan per pengguna untuk operator
- **Export Data**: Export data transaksi ke format CSV
- **Responsive Design**: Dapat diakses dari desktop dan mobile
- **Performance Optimization**: Caching system dan query optimization

## 🛠️ Teknologi yang Digunakan

- **Frontend**: HTML5, CSS3, JavaScript (ES6+) - No frameworks
- **Backend**: Node.js dengan Express.js
- **Database**: SQLite dengan indexing dan optimization
- **Authentication**: JWT (JSON Web Tokens) dengan bcrypt
- **Security**: Helmet, rate limiting, CSP, input validation
- **Performance**: In-memory caching, compression, query optimization
- **Charts**: CSS-based data visualization

## 📋 Prasyarat

- Node.js (versi 14 atau lebih baru)
- npm atau yarn

## 🚀 Instalasi dan Menjalankan

### 1. Clone Repository
```bash
git clone <repository-url>
cd bank_sampah
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Inisialisasi Database
```bash
npm run init-db
```

### 3.1 Load Extended Sample Data (Optional)
```bash
# Load comprehensive sample data for 2 months
node scripts/load-extended-data.js
```

### 4. Jalankan Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Akses Aplikasi
Buka browser dan akses: `http://localhost:3000`

## 👥 Akun Default

Setelah inisialisasi database, tersedia akun default:

### Admin
- **Email**: admin@banksampah.com
- **Password**: admin123

### Operator
- **Email**: operator@banksampah.com
- **Password**: operator123

### Customer (Sample)
- **Email**: customer1@example.com
- **Password**: customer123

### Extended Sample Data
Sistem dilengkapi dengan data sample yang komprehensif:
- **10 Customer**: Berbagai nama dan profil pengguna
- **96 Transaksi**: Data transaksi selama 2 bulan (November-Desember 2024)
- **8 Jenis Sampah**: Botol plastik, kardus, kaleng, kertas, dll.
- **Status Bervariasi**: Completed, pending, dan cancelled transactions

## 📊 Struktur Database

### Tabel Utama
- **users**: Data pengguna (customer, operator, admin)
- **waste_types**: Jenis-jenis sampah dan harga per kg
- **transactions**: Transaksi deposit sampah
- **user_balances**: Saldo dan statistik pengguna

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Registrasi pengguna baru
- `POST /api/auth/login` - Login pengguna
- `GET /api/auth/profile` - Get profil pengguna
- `POST /api/auth/logout` - Logout

### Transactions
- `GET /api/transactions` - List transaksi (dengan filter)
- `POST /api/transactions` - Buat transaksi baru
- `GET /api/transactions/:id` - Detail transaksi
- `PUT /api/transactions/:id` - Update transaksi
- `PATCH /api/transactions/:id/complete` - Selesaikan transaksi

### Waste Types
- `GET /api/waste-types` - List jenis sampah
- `POST /api/waste-types` - Tambah jenis sampah (admin)
- `PUT /api/waste-types/:id` - Update jenis sampah (admin)

### Dashboard
- `GET /api/dashboard/summary` - Ringkasan dashboard
- `GET /api/dashboard/recent-transactions` - Transaksi terbaru
- `GET /api/dashboard/charts` - Data untuk chart

### Reports
- `GET /api/reports/overview` - Laporan ringkasan (admin)
- `GET /api/reports/financial` - Laporan keuangan (admin)
- `GET /api/reports/user-activity` - Laporan aktivitas pengguna (admin)
- `GET /api/reports/waste-performance` - Laporan performa jenis sampah (admin)
- `GET /api/reports/operator/transactions` - Laporan transaksi operator
- `GET /api/reports/operator/monthly` - Laporan bulanan operator
- `GET /api/reports/operator/user-transactions` - Laporan transaksi per pengguna
- `GET /api/reports/operator/export/transactions` - Export data operator

## 🎯 Cara Penggunaan

### Untuk Customer
1. **Registrasi**: Daftar akun baru atau gunakan akun sample
2. **Login**: Masuk ke sistem
3. **Dashboard**: Lihat ringkasan penghasilan dan transaksi
4. **Riwayat**: Lihat semua transaksi yang pernah dilakukan

### Untuk Operator
1. **Login**: Masuk dengan akun operator
2. **Transaksi Baru**: Buat transaksi untuk customer
3. **Kelola Transaksi**: Lihat dan selesaikan transaksi pending
4. **Laporan**: Akses laporan transaksi, bulanan, dan per pengguna
5. **Export Data**: Export data transaksi ke CSV

### Untuk Admin
1. **Login**: Masuk dengan akun admin
2. **Kelola Jenis Sampah**: Tambah/edit harga sampah
3. **Kelola Pengguna**: Lihat dan kelola semua pengguna
4. **Laporan**: Akses laporan dan statistik sistem lengkap
5. **Export Data**: Export data dalam berbagai format

## 📱 Responsive Design

Aplikasi dirancang untuk dapat diakses dari berbagai perangkat:
- **Desktop**: Layout penuh dengan sidebar dan grid
- **Tablet**: Layout adaptif dengan navigasi yang dioptimalkan
- **Mobile**: Layout vertikal dengan hamburger menu

## 🔒 Keamanan

- **Password Hashing**: Menggunakan bcrypt dengan salt rounds
- **JWT Authentication**: Token-based authentication dengan refresh
- **Input Validation**: Validasi input di frontend dan backend
- **SQL Injection Protection**: Menggunakan parameterized queries
- **Rate Limiting**: Pembatasan request per IP (100 req/15min)
- **Security Headers**: Helmet middleware dengan CSP
- **XSS Protection**: Input sanitization dan output encoding
- **CSRF Protection**: Token-based CSRF protection

## 🚧 Development

### Struktur Project
```
bank_sampah/
├── config/          # Konfigurasi database
├── database/        # Schema dan sample data
├── middleware/      # Authentication middleware
├── public/          # Frontend files
│   ├── css/        # Stylesheets
│   ├── js/         # JavaScript modules
│   └── index.html  # Main HTML file
├── routes/          # API routes
├── scripts/         # Database initialization
├── server.js        # Main server file
└── package.json     # Dependencies
```

### Scripts Available
- `npm start` - Jalankan server production
- `npm run dev` - Jalankan server development (dengan nodemon)
- `npm run init-db` - Inisialisasi database
- `node scripts/fix-passwords.js` - Fix password hashes untuk sample users
- `node scripts/load-extended-data.js` - Load extended sample data

## 🐛 Troubleshooting

### Database Issues
```bash
# Reset database
rm database/bank_sampah.db
npm run init-db
```

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Dependencies Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📈 Roadmap

### ✅ Phase 1-3 COMPLETED
- [x] Core functionality (authentication, transactions, dashboard)
- [x] Enhanced features (user management, waste types, filtering)
- [x] Advanced features (reporting, charts, export, performance optimization)
- [x] Operator reporting system
- [x] Extended sample data (2 months)

### Phase 4 (Testing & Deployment) - READY TO START
- [ ] Unit testing dan integration testing
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Bug fixes dan optimization
- [ ] Documentation completion
- [ ] Deployment setup

### Future Enhancements
- [ ] Mobile app (PWA)
- [ ] Barcode scanning
- [ ] Multi-location support
- [ ] Advanced analytics
- [ ] Email/SMS notifications

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

Jika mengalami masalah atau memiliki pertanyaan:
- Buat issue di repository
- Email: support@banksampah.com

---

**Bank Sampah Transaction System** - Mengelola sampah dengan teknologi modern 🏦♻️
