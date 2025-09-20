// Dashboard Module

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

// Initialize dashboard
function initializeDashboard() {
    // Dashboard will be loaded when the page is shown
}

// Load dashboard data
async function loadDashboard() {
    if (!currentUser) {
        showToast('Anda harus login terlebih dahulu', 'error');
        showPage('login');
        return;
    }

    try {
        showLoading();
        
        // Load dashboard summary
        const summaryResponse = await apiRequest('/api/dashboard/summary');
        if (summaryResponse.success) {
            updateDashboardSummary(summaryResponse.data);
        }

        // Load recent transactions
        const recentResponse = await apiRequest('/api/dashboard/recent-transactions?limit=5');
        if (recentResponse.success) {
            updateRecentTransactions(recentResponse.data.transactions);
        }

        // Load charts data
        if (typeof loadCharts === 'function') {
            loadCharts();
        }

        // Show admin panel button for operators and admins
        showAdminPanelButton();

    } catch (error) {
        console.error('Dashboard load error:', error);
        showToast('Gagal memuat data dashboard', 'error');
    } finally {
        hideLoading();
    }
}

// Update dashboard summary
function updateDashboardSummary(data) {
    // Update dashboard labels based on user role
    if (currentUser && (currentUser.role === 'operator' || currentUser.role === 'admin')) {
        // Update labels for operators/admins
        const summaryCards = document.querySelectorAll('.summary-card h3');
        if (summaryCards.length >= 3) {
            summaryCards[0].textContent = 'Total Penghasilan';
            summaryCards[1].textContent = 'Total Transaksi';
            summaryCards[2].textContent = 'Transaksi Pending';
        }
    }

    // Update total earnings
    const totalEarningsElement = document.getElementById('total-earnings');
    if (totalEarningsElement) {
        totalEarningsElement.textContent = formatCurrency(data.totalEarnings || 0);
    }

    // Update total deposits/transactions based on user role
    const totalDepositsElement = document.getElementById('total-deposits');
    if (totalDepositsElement) {
        if (currentUser && (currentUser.role === 'operator' || currentUser.role === 'admin')) {
            // For operators/admins, show total transactions
            totalDepositsElement.textContent = data.totalTransactions || 0;
        } else {
            // For customers, show total deposits
            totalDepositsElement.textContent = data.totalDeposits || 0;
        }
    }

    // Update last transaction date
    const lastTransactionElement = document.getElementById('last-transaction');
    if (lastTransactionElement) {
        if (currentUser && (currentUser.role === 'operator' || currentUser.role === 'admin')) {
            // For operators/admins, show pending transactions
            lastTransactionElement.textContent = data.pendingTransactions || 0;
        } else {
            // For customers, show last transaction date
            if (data.lastTransactionDate) {
                lastTransactionElement.textContent = formatDate(data.lastTransactionDate);
            } else {
                lastTransactionElement.textContent = 'Belum ada transaksi';
            }
        }
    }
}

// Update recent transactions
function updateRecentTransactions(transactions) {
    const container = document.getElementById('recent-transactions-list');
    if (!container) return;

    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<p class="no-data">Belum ada transaksi</p>';
        return;
    }

    const transactionsHTML = transactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <h3>${transaction.waste_type_name}</h3>
                <div class="transaction-details">
                    <div class="transaction-detail">
                        <label>Berat</label>
                        <span>${transaction.weight} kg</span>
                    </div>
                    <div class="transaction-detail">
                        <label>Harga</label>
                        <span>${formatCurrency(transaction.total_amount)}</span>
                    </div>
                    <div class="transaction-detail">
                        <label>Tanggal</label>
                        <span>${formatDate(transaction.created_at)}</span>
                    </div>
                </div>
            </div>
            <div class="transaction-status">
                <span class="transaction-status status-${transaction.status}">
                    ${getStatusText(transaction.status)}
                </span>
            </div>
        </div>
    `).join('');

    container.innerHTML = transactionsHTML;
}

// Get status text in Indonesian
function getStatusText(status) {
    const statusMap = {
        'pending': 'Menunggu',
        'completed': 'Selesai',
        'cancelled': 'Dibatalkan'
    };
    return statusMap[status] || status;
}

// Load dashboard when page is shown
window.addEventListener('hashchange', function() {
    if (window.location.hash === '#dashboard') {
        loadDashboard();
    }
});

// Show admin panel button for operators and admins
function showAdminPanelButton() {
    const adminPanelBtn = document.getElementById('admin-panel-btn');
    if (adminPanelBtn && currentUser) {
        if (currentUser.role === 'admin' || currentUser.role === 'operator') {
            adminPanelBtn.style.display = 'inline-block';
            adminPanelBtn.textContent = currentUser.role === 'operator' ? 'Panel Operator' : 'Panel Admin';
        } else {
            adminPanelBtn.style.display = 'none';
        }
    }
}

// Export functions
window.loadDashboard = loadDashboard;
window.showAdminPanelButton = showAdminPanelButton;
