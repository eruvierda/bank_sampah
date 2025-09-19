# Product Requirements Document (PRD)
## Bank Sampah Transaction System

### 1. Executive Summary

**Product Name:** Bank Sampah Transaction System  
**Version:** 1.0  
**Date:** December 2024  
**Target Users:** Waste bank operators, customers, and administrators  

The Bank Sampah Transaction System is a web-based application designed to manage waste bank transactions, allowing users to deposit various types of recyclable materials (bottles, cardboard, cans, etc.) and track their transactions through a user dashboard.

### 2. Product Overview

#### 2.1 Problem Statement
- Manual tracking of waste bank transactions is inefficient and error-prone
- Customers need better visibility into their transaction history
- Waste bank operators need a streamlined system to manage deposits and payments
- Lack of standardized pricing and transaction recording

#### 2.2 Solution
A web-based transaction management system that:
- Records waste deposits by type and weight (per kg pricing)
- Provides user authentication and personal dashboards
- Tracks transaction history and balances
- Manages different waste categories with standardized pricing

### 3. User Stories

#### 3.1 Customer (Waste Depositor)
- As a customer, I want to create an account so I can track my waste deposits
- As a customer, I want to view my transaction history so I can see my earnings
- As a customer, I want to see my current balance so I know how much I've earned
- As a customer, I want to see pricing for different waste types so I know what to bring

#### 3.2 Waste Bank Operator
- As an operator, I want to record new transactions so I can track deposits
- As an operator, I want to manage waste type pricing so I can update rates
- As an operator, I want to view all transactions so I can monitor business
- As an operator, I want to authenticate users so I can ensure security

#### 3.3 Administrator
- As an admin, I want to manage user accounts so I can control access
- As an admin, I want to view system reports so I can analyze performance
- As an admin, I want to configure system settings so I can customize the application

### 4. Functional Requirements

#### 4.1 User Authentication
- **FR-001:** User registration with email and password
- **FR-002:** User login with email/password authentication
- **FR-003:** Password reset functionality
- **FR-004:** User profile management
- **FR-005:** Session management and logout

#### 4.2 Transaction Management
- **FR-006:** Create new waste deposit transactions
- **FR-007:** Record waste type, weight, and price per kg
- **FR-008:** Calculate total transaction value automatically
- **FR-009:** Edit pending transactions (before finalization)
- **FR-010:** Delete transactions (with proper authorization)
- **FR-011:** Transaction status tracking (pending, completed, cancelled)

#### 4.3 Waste Type Management
- **FR-012:** Define waste categories (bottles, cardboard, cans, plastic, paper, etc.)
- **FR-013:** Set pricing per kg for each waste type
- **FR-014:** Update pricing with effective dates
- **FR-015:** Archive discontinued waste types

#### 4.4 Dashboard and Reporting
- **FR-016:** Personal dashboard showing transaction summary
- **FR-017:** Transaction history with filtering and search
- **FR-018:** Balance tracking and earnings summary
- **FR-019:** Export transaction data (CSV/PDF)
- **FR-020:** Visual charts for transaction trends

#### 4.5 User Management
- **FR-021:** User role management (Customer, Operator, Admin)
- **FR-022:** User account activation/deactivation
- **FR-023:** Bulk user operations
- **FR-024:** User activity logging

### 5. Technical Requirements

#### 5.1 Technology Stack
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js with Express.js (for API endpoints)
- **Database:** SQLite
- **Authentication:** JWT (JSON Web Tokens)
- **File Storage:** Local file system for exports

#### 5.2 Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

#### 5.3 Performance Requirements
- Page load time: < 3 seconds
- Transaction processing: < 2 seconds
- Support for 100+ concurrent users
- Database response time: < 500ms

#### 5.4 Security Requirements
- Password encryption (bcrypt)
- HTTPS enforcement
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

### 6. Database Schema

#### 6.1 Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role ENUM('customer', 'operator', 'admin') DEFAULT 'customer',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 6.2 Waste Types Table
```sql
CREATE TABLE waste_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_per_kg DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'kg',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 6.3 Transactions Table
```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    waste_type_id INTEGER NOT NULL,
    weight DECIMAL(10,3) NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    operator_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (waste_type_id) REFERENCES waste_types(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
);
```

#### 6.4 User Balances Table
```sql
CREATE TABLE user_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    total_deposits DECIMAL(10,2) DEFAULT 0,
    last_transaction_date DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 7. User Interface Requirements

#### 7.1 Login Page
- Clean, responsive design
- Email and password input fields
- "Remember me" checkbox
- "Forgot password" link
- Registration link for new users

#### 7.2 Registration Page
- Form with: First name, Last name, Email, Password, Confirm Password, Phone, Address
- Form validation with real-time feedback
- Terms and conditions checkbox
- Submit button with loading state

#### 7.3 Dashboard (Customer)
- **Header:** User name, logout button, navigation menu
- **Summary Cards:** Total earnings, total deposits, last transaction date
- **Quick Actions:** New transaction button, view history button
- **Recent Transactions:** Table with last 5 transactions
- **Charts:** Monthly earnings trend, waste type distribution

#### 7.4 Transaction Page
- **New Transaction Form:**
  - User selection (dropdown/search)
  - Waste type selection (dropdown)
  - Weight input (with unit display)
  - Price per kg (auto-filled, editable)
  - Total amount (auto-calculated)
  - Notes field
  - Submit button

#### 7.5 Transaction History Page
- **Filters:** Date range, waste type, status
- **Search:** By user name or transaction ID
- **Table:** Sortable columns (date, user, waste type, weight, amount, status)
- **Pagination:** 20 records per page
- **Actions:** View details, edit (if pending), export

#### 7.6 Admin Panel
- **User Management:** List, create, edit, deactivate users
- **Waste Type Management:** Add, edit, delete waste types and pricing
- **System Reports:** Transaction summaries, user statistics
- **Settings:** System configuration, backup/restore

### 8. API Endpoints

#### 8.1 Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Password reset request

#### 8.2 Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

#### 8.3 Transactions
- `GET /api/transactions` - List transactions (with filters)
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/export` - Export transactions

#### 8.4 Waste Types
- `GET /api/waste-types` - List waste types
- `POST /api/waste-types` - Create waste type (admin only)
- `PUT /api/waste-types/:id` - Update waste type (admin only)
- `DELETE /api/waste-types/:id` - Delete waste type (admin only)

#### 8.5 Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/dashboard/charts` - Get chart data
- `GET /api/dashboard/recent-transactions` - Get recent transactions

### 9. Non-Functional Requirements

#### 9.1 Usability
- Intuitive navigation with clear labels
- Responsive design for mobile and desktop
- Accessibility compliance (WCAG 2.1 AA)
- Multi-language support (Indonesian, English)

#### 9.2 Reliability
- 99.5% uptime
- Data backup every 24 hours
- Error handling with user-friendly messages
- Transaction rollback on failures

#### 9.3 Scalability
- Support for 1000+ users
- Database optimization for large datasets
- Efficient query performance
- Caching for frequently accessed data

### 10. Implementation Phases

#### Phase 1: Core Functionality (Weeks 1-2)
- User authentication system
- Basic transaction recording
- Simple dashboard
- SQLite database setup

#### Phase 2: Enhanced Features (Weeks 3-4)
- Transaction history and filtering
- User management
- Waste type management
- Basic reporting

#### Phase 3: Advanced Features (Weeks 5-6)
- Advanced dashboard with charts
- Export functionality
- Admin panel
- Performance optimization

#### Phase 4: Testing and Deployment (Week 7)
- Comprehensive testing
- Bug fixes
- Documentation
- Deployment setup

### 11. Success Metrics

#### 11.1 User Adoption
- Number of registered users
- Daily active users
- Transaction volume per day

#### 11.2 System Performance
- Average page load time
- Transaction processing time
- System uptime percentage

#### 11.3 User Satisfaction
- User feedback scores
- Support ticket volume
- Feature usage statistics

### 12. Risk Assessment

#### 12.1 Technical Risks
- **Database performance:** Mitigated by proper indexing and query optimization
- **Browser compatibility:** Mitigated by testing across major browsers
- **Security vulnerabilities:** Mitigated by security best practices and regular audits

#### 12.2 Business Risks
- **User adoption:** Mitigated by user-friendly design and training
- **Data loss:** Mitigated by regular backups and data validation
- **Scalability issues:** Mitigated by performance monitoring and optimization

### 13. Future Enhancements

#### 13.1 Short-term (3-6 months)
- Mobile app development
- SMS notifications
- Barcode scanning for waste types
- Integration with payment systems

#### 13.2 Long-term (6-12 months)
- Multi-location support
- Advanced analytics and reporting
- Integration with external waste management systems
- API for third-party integrations

### 14. Conclusion

The Bank Sampah Transaction System will provide a comprehensive solution for managing waste bank operations, improving efficiency, and providing better visibility for both operators and customers. The system is designed to be scalable, secure, and user-friendly while maintaining simplicity in implementation using standard web technologies.

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Next Review:** January 2025
