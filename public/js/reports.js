// Reports Module

let currentReportData = null;

// Initialize reports when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeReports();
});

// Initialize reports
function initializeReports() {
    // Reports functionality will be loaded when needed
}

// Load reports page
async function loadReports() {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'operator')) {
        showToast('Akses ditolak. Hanya admin dan operator yang dapat mengakses halaman ini.', 'error');
        showPage('dashboard');
        return;
    }

    try {
        showLoading();
        
        // Setup role-based report tabs
        setupReportTabsForRole();
        
        // Load appropriate default report based on role
        if (currentUser.role === 'operator') {
            await loadOperatorTransactionReport();
        } else {
            await loadOverviewReport();
        }
        
    } catch (error) {
        console.error('Reports load error:', error);
        showToast('Gagal memuat laporan', 'error');
    } finally {
        hideLoading();
    }
}

// Setup report tabs based on user role
function setupReportTabsForRole() {
    if (!currentUser) return;

    const reportTabs = document.querySelector('.report-tabs');
    if (!reportTabs) return;

    if (currentUser.role === 'operator') {
        // For operators, show only operator-specific reports
        reportTabs.innerHTML = `
            <button class="report-tab-btn active" data-report-tab="operator-transactions">Transaksi</button>
            <button class="report-tab-btn" data-report-tab="operator-monthly">Bulanan</button>
            <button class="report-tab-btn" data-report-tab="operator-user-transactions">By User</button>
        `;
    } else {
        // For admins, show all reports
        reportTabs.innerHTML = `
            <button class="report-tab-btn active" data-report-tab="overview">Overview</button>
            <button class="report-tab-btn" data-report-tab="financial">Keuangan</button>
            <button class="report-tab-btn" data-report-tab="user-activity">Aktivitas User</button>
        `;
    }
}

// Load overview report
async function loadOverviewReport() {
    try {
        const response = await apiRequest('/api/reports/overview');
        if (response.success) {
            currentReportData = response.data;
            displayOverviewReport(response.data);
        }
    } catch (error) {
        console.error('Overview report error:', error);
        showToast('Gagal memuat laporan overview', 'error');
    }
}

// Display overview report
function displayOverviewReport(data) {
    const container = document.getElementById('reports-content');
    if (!container) return;

    const { overview, topWasteTypes, topCustomers, recentActivity } = data;

    const reportHTML = `
        <div class="report-section">
            <h2>Laporan Overview Sistem</h2>
            <div class="report-summary">
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-icon">👥</div>
                        <div class="summary-content">
                            <h3>Total Pengguna</h3>
                            <p class="summary-value">${overview.totalUsers}</p>
                            <small>${overview.activeUsers} aktif</small>
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-icon">📊</div>
                        <div class="summary-content">
                            <h3>Total Transaksi</h3>
                            <p class="summary-value">${overview.totalTransactions}</p>
                            <small>${overview.completedTransactions} selesai</small>
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-icon">💰</div>
                        <div class="summary-content">
                            <h3>Total Penghasilan</h3>
                            <p class="summary-value">${formatCurrency(overview.totalEarnings)}</p>
                            <small>Rata-rata: ${formatCurrency(overview.averageTransactionValue)}</small>
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-icon">⚖️</div>
                        <div class="summary-content">
                            <h3>Total Berat</h3>
                            <p class="summary-value">${overview.totalWeight} kg</p>
                            <small>Rata-rata per transaksi</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="report-section">
            <h2>Top 5 Jenis Sampah</h2>
            <div class="top-waste-types">
                ${topWasteTypes.map((wasteType, index) => `
                    <div class="top-item">
                        <div class="rank">${index + 1}</div>
                        <div class="item-info">
                            <h4>${wasteType.name}</h4>
                            <p>${wasteType.transaction_count} transaksi</p>
                        </div>
                        <div class="item-stats">
                            <div class="stat">
                                <span class="stat-label">Total:</span>
                                <span class="stat-value">${formatCurrency(wasteType.total_amount)}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Berat:</span>
                                <span class="stat-value">${wasteType.total_weight} kg</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="report-section">
            <h2>Top 10 Pelanggan</h2>
            <div class="top-customers">
                ${topCustomers.map((customer, index) => `
                    <div class="top-item">
                        <div class="rank">${index + 1}</div>
                        <div class="item-info">
                            <h4>${customer.first_name} ${customer.last_name}</h4>
                            <p>${customer.email}</p>
                        </div>
                        <div class="item-stats">
                            <div class="stat">
                                <span class="stat-label">Transaksi:</span>
                                <span class="stat-value">${customer.transaction_count}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Total:</span>
                                <span class="stat-value">${formatCurrency(customer.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="report-section">
            <h2>Aktivitas Terbaru</h2>
            <div class="recent-activity-report">
                ${recentActivity.map(activity => `
                    <div class="activity-item">
                        <div class="activity-info">
                            <h4>${activity.first_name} ${activity.last_name}</h4>
                            <p>${activity.waste_type_name} - ${formatCurrency(activity.total_amount)}</p>
                            <small>${formatDate(activity.created_at)}</small>
                        </div>
                        <div class="activity-details">
                            <span class="weight">${activity.weight} kg</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.innerHTML = reportHTML;
}

// Load financial report
async function loadFinancialReport() {
    try {
        const startDate = document.getElementById('start-date')?.value;
        const endDate = document.getElementById('end-date')?.value;
        const groupBy = document.getElementById('group-by')?.value || 'month';

        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        params.append('groupBy', groupBy);

        const response = await apiRequest(`/api/reports/financial?${params.toString()}`);
        if (response.success) {
            displayFinancialReport(response.data);
        }
    } catch (error) {
        console.error('Financial report error:', error);
        showToast('Gagal memuat laporan keuangan', 'error');
    }
}

// Display financial report
function displayFinancialReport(data) {
    const container = document.getElementById('reports-content');
    if (!container) return;

    const { financialData, wasteTypeBreakdown, summary } = data;

    const reportHTML = `
        <div class="report-section">
            <h2>Laporan Keuangan</h2>
            <div class="financial-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <h3>Total Periode</h3>
                        <p>${summary.totalPeriods}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Total Penghasilan</h3>
                        <p>${formatCurrency(summary.totalAmount)}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Total Transaksi</h3>
                        <p>${summary.totalTransactions}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Total Berat</h3>
                        <p>${summary.totalWeight} kg</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="report-section">
            <h2>Data Keuangan per Periode</h2>
            <div class="financial-data">
                <div class="data-table">
                    <div class="table-header">
                        <div class="col">Periode</div>
                        <div class="col">Transaksi</div>
                        <div class="col">Total</div>
                        <div class="col">Berat</div>
                        <div class="col">Rata-rata</div>
                    </div>
                    ${financialData.map(item => `
                        <div class="table-row">
                            <div class="col">${item.period}</div>
                            <div class="col">${item.transaction_count}</div>
                            <div class="col">${formatCurrency(item.total_amount)}</div>
                            <div class="col">${item.total_weight} kg</div>
                            <div class="col">${formatCurrency(item.average_amount)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="report-section">
            <h2>Breakdown Jenis Sampah</h2>
            <div class="waste-type-breakdown">
                ${wasteTypeBreakdown.map(item => `
                    <div class="breakdown-item">
                        <div class="breakdown-info">
                            <h4>${item.name}</h4>
                            <p>Harga: ${formatCurrency(item.price_per_kg)}/kg</p>
                        </div>
                        <div class="breakdown-stats">
                            <div class="stat">
                                <span class="stat-label">Transaksi:</span>
                                <span class="stat-value">${item.transaction_count}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Total:</span>
                                <span class="stat-value">${formatCurrency(item.total_amount)}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Berat:</span>
                                <span class="stat-value">${item.total_weight} kg</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.innerHTML = reportHTML;
}

// Load user activity report
async function loadUserActivityReport() {
    try {
        const startDate = document.getElementById('start-date')?.value;
        const endDate = document.getElementById('end-date')?.value;
        const limit = document.getElementById('limit')?.value || 50;

        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        params.append('limit', limit);

        const response = await apiRequest(`/api/reports/user-activity?${params.toString()}`);
        if (response.success) {
            displayUserActivityReport(response.data);
        }
    } catch (error) {
        console.error('User activity report error:', error);
        showToast('Gagal memuat laporan aktivitas pengguna', 'error');
    }
}

// Display user activity report
function displayUserActivityReport(data) {
    const container = document.getElementById('reports-content');
    if (!container) return;

    const { userActivity, registrationTrends, summary } = data;

    const reportHTML = `
        <div class="report-section">
            <h2>Laporan Aktivitas Pengguna</h2>
            <div class="user-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <h3>Total Pengguna</h3>
                        <p>${summary.totalUsers}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Pengguna Aktif</h3>
                        <p>${summary.activeUsers}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Total Penghasilan</h3>
                        <p>${formatCurrency(summary.totalEarnings)}</p>
                    </div>
                    <div class="summary-card">
                        <h3>Total Transaksi</h3>
                        <p>${summary.totalTransactions}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="report-section">
            <h2>Data Aktivitas Pengguna</h2>
            <div class="user-activity-data">
                <div class="data-table">
                    <div class="table-header">
                        <div class="col">Nama</div>
                        <div class="col">Email</div>
                        <div class="col">Role</div>
                        <div class="col">Transaksi</div>
                        <div class="col">Total</div>
                        <div class="col">Berat</div>
                        <div class="col">Terakhir</div>
                    </div>
                    ${userActivity.map(user => `
                        <div class="table-row">
                            <div class="col">${user.first_name} ${user.last_name}</div>
                            <div class="col">${user.email}</div>
                            <div class="col">
                                <span class="role-badge role-${user.role}">${user.role}</span>
                            </div>
                            <div class="col">${user.transaction_count}</div>
                            <div class="col">${formatCurrency(user.completed_amount || 0)}</div>
                            <div class="col">${user.completed_weight || 0} kg</div>
                            <div class="col">${user.last_transaction_date ? formatDate(user.last_transaction_date) : '-'}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    container.innerHTML = reportHTML;
}

// Export data
async function exportData(format = 'csv') {
    try {
        showLoading();
        
        const startDate = document.getElementById('start-date')?.value;
        const endDate = document.getElementById('end-date')?.value;

        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        params.append('format', format);

        // Determine export endpoint based on user role
        let exportUrl = '/api/reports/export/transactions';
        if (currentUser && currentUser.role === 'operator') {
            exportUrl = '/api/reports/operator/export/transactions';
        }

        const response = await fetch(`${exportUrl}?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showToast('Data berhasil diekspor!', 'success');
        } else {
            throw new Error('Export failed');
        }
    } catch (error) {
        console.error('Export error:', error);
        showToast('Gagal mengekspor data', 'error');
    } finally {
        hideLoading();
    }
}

// Show report tab
function showReportTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.report-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.report-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    const targetTab = document.getElementById(`${tabName}-report-tab`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load tab-specific data
    switch (tabName) {
        case 'overview':
            loadOverviewReport();
            break;
        case 'financial':
            loadFinancialReport();
            break;
        case 'user-activity':
            loadUserActivityReport();
            break;
    }
}

// ===== OPERATOR REPORTS =====

// Load operator transaction report
async function loadOperatorTransactionReport() {
    try {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        let url = '/api/reports/operator/transactions';
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        
        const response = await apiRequest(url);
        if (response.success) {
            displayOperatorTransactionReport(response.data);
        } else {
            showToast('Gagal memuat laporan transaksi: ' + response.message, 'error');
        }
    } catch (error) {
        console.error('Error loading operator transaction report:', error);
        showToast('Terjadi kesalahan saat memuat laporan transaksi', 'error');
    }
}

// Display operator transaction report
function displayOperatorTransactionReport(data) {
    const reportsContent = document.getElementById('reports-content');
    if (!reportsContent) return;

    const { summary, byWasteType, recentTransactions } = data;

    reportsContent.innerHTML = `
        <div class="report-section">
            <h2>Ringkasan Transaksi</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <i class="fas fa-exchange-alt summary-icon"></i>
                    <div class="summary-content">
                        <h3>Total Transaksi</h3>
                        <span class="summary-value">${summary.total_transactions || 0}</span>
                    </div>
                </div>
                <div class="summary-item">
                    <i class="fas fa-check-circle summary-icon"></i>
                    <div class="summary-content">
                        <h3>Transaksi Selesai</h3>
                        <span class="summary-value">${summary.completed_transactions || 0}</span>
                    </div>
                </div>
                <div class="summary-item">
                    <i class="fas fa-clock summary-icon"></i>
                    <div class="summary-content">
                        <h3>Transaksi Pending</h3>
                        <span class="summary-value">${summary.pending_transactions || 0}</span>
                    </div>
                </div>
                <div class="summary-item">
                    <i class="fas fa-money-bill-wave summary-icon"></i>
                    <div class="summary-content">
                        <h3>Total Pendapatan</h3>
                        <span class="summary-value">${formatCurrency(summary.total_earnings || 0)}</span>
                    </div>
                </div>
                <div class="summary-item">
                    <i class="fas fa-weight-hanging summary-icon"></i>
                    <div class="summary-content">
                        <h3>Total Berat</h3>
                        <span class="summary-value">${(summary.total_weight || 0).toFixed(2)} kg</span>
                    </div>
                </div>
                <div class="summary-item">
                    <i class="fas fa-chart-line summary-icon"></i>
                    <div class="summary-content">
                        <h3>Rata-rata Transaksi</h3>
                        <span class="summary-value">${formatCurrency(summary.average_transaction_value || 0)}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="report-section">
            <h2>Transaksi Berdasarkan Jenis Sampah</h2>
            <div class="data-table">
                <div class="table-header">
                    <div class="col">Jenis Sampah</div>
                    <div class="col">Jumlah Transaksi</div>
                    <div class="col">Total Berat (kg)</div>
                    <div class="col">Total Pendapatan</div>
                    <div class="col">Rata-rata</div>
                </div>
                <div id="waste-type-table-body">
                    ${byWasteType.length > 0 ? byWasteType.map(item => `
                        <div class="table-row">
                            <div class="col">${item.waste_type}</div>
                            <div class="col">${item.transaction_count || 0}</div>
                            <div class="col">${(item.total_weight || 0).toFixed(2)}</div>
                            <div class="col">${formatCurrency(item.total_earnings || 0)}</div>
                            <div class="col">${formatCurrency(item.average_value || 0)}</div>
                        </div>
                    `).join('') : '<div class="table-row"><div class="col" colspan="5">Tidak ada data</div></div>'}
                </div>
            </div>
        </div>

        <div class="report-section">
            <h2>Transaksi Terbaru</h2>
            <div class="data-table">
                <div class="table-header">
                    <div class="col">Tanggal</div>
                    <div class="col">Customer</div>
                    <div class="col">Jenis Sampah</div>
                    <div class="col">Berat (kg)</div>
                    <div class="col">Total</div>
                    <div class="col">Status</div>
                </div>
                <div id="recent-transactions-table-body">
                    ${recentTransactions.length > 0 ? recentTransactions.map(item => `
                        <div class="table-row">
                            <div class="col">${formatDate(item.created_at)}</div>
                            <div class="col">${item.customer_name}</div>
                            <div class="col">${item.waste_type}</div>
                            <div class="col">${item.weight}</div>
                            <div class="col">${formatCurrency(item.total_amount)}</div>
                            <div class="col">
                                <span class="status-badge status-${item.status}">${item.status}</span>
                            </div>
                        </div>
                    `).join('') : '<div class="table-row"><div class="col" colspan="6">Tidak ada data</div></div>'}
                </div>
            </div>
        </div>
    `;
}

// Load operator monthly report
async function loadOperatorMonthlyReport() {
    try {
        const year = new Date().getFullYear();
        const response = await apiRequest(`/api/reports/operator/monthly?year=${year}`);
        if (response.success) {
            displayOperatorMonthlyReport(response.data);
        } else {
            showToast('Gagal memuat laporan bulanan: ' + response.message, 'error');
        }
    } catch (error) {
        console.error('Error loading operator monthly report:', error);
        showToast('Terjadi kesalahan saat memuat laporan bulanan', 'error');
    }
}

// Display operator monthly report
function displayOperatorMonthlyReport(data) {
    const reportsContent = document.getElementById('reports-content');
    if (!reportsContent) return;

    const { monthlyData, yearComparison } = data;

    reportsContent.innerHTML = `
        <div class="report-section">
            <h2>Laporan Bulanan ${data.selectedYear}</h2>
            <div class="data-table">
                <div class="table-header">
                    <div class="col">Bulan</div>
                    <div class="col">Total Transaksi</div>
                    <div class="col">Transaksi Selesai</div>
                    <div class="col">Total Pendapatan</div>
                    <div class="col">Total Berat (kg)</div>
                    <div class="col">Rata-rata</div>
                </div>
                <div id="monthly-data-table-body">
                    ${monthlyData.length > 0 ? monthlyData.map(item => `
                        <div class="table-row">
                            <div class="col">${getMonthName(item.month)}</div>
                            <div class="col">${item.total_transactions}</div>
                            <div class="col">${item.completed_transactions}</div>
                            <div class="col">${formatCurrency(item.total_earnings || 0)}</div>
                            <div class="col">${(item.total_weight || 0).toFixed(2)}</div>
                            <div class="col">${formatCurrency(item.average_transaction_value || 0)}</div>
                        </div>
                    `).join('') : '<div class="table-row"><div class="col" colspan="6">Tidak ada data</div></div>'}
                </div>
            </div>
        </div>

        <div class="report-section">
            <h2>Perbandingan Tahun</h2>
            <div class="data-table">
                <div class="table-header">
                    <div class="col">Tahun</div>
                    <div class="col">Total Transaksi</div>
                    <div class="col">Total Pendapatan</div>
                    <div class="col">Total Berat (kg)</div>
                </div>
                <div id="year-comparison-table-body">
                    ${yearComparison.length > 0 ? yearComparison.map(item => `
                        <div class="table-row">
                            <div class="col">${item.year}</div>
                            <div class="col">${item.total_transactions}</div>
                            <div class="col">${formatCurrency(item.total_earnings || 0)}</div>
                            <div class="col">${(item.total_weight || 0).toFixed(2)}</div>
                        </div>
                    `).join('') : '<div class="table-row"><div class="col" colspan="4">Tidak ada data</div></div>'}
                </div>
            </div>
        </div>
    `;
}

// Load operator user transaction report
async function loadOperatorUserTransactionReport() {
    try {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        let url = '/api/reports/operator/user-transactions';
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        
        const response = await apiRequest(url);
        if (response.success) {
            displayOperatorUserTransactionReport(response.data);
        } else {
            showToast('Gagal memuat laporan transaksi user: ' + response.message, 'error');
        }
    } catch (error) {
        console.error('Error loading operator user transaction report:', error);
        showToast('Terjadi kesalahan saat memuat laporan transaksi user', 'error');
    }
}

// Display operator user transaction report
function displayOperatorUserTransactionReport(data) {
    const reportsContent = document.getElementById('reports-content');
    if (!reportsContent) return;

    const { userSummary, topCustomers } = data;

    reportsContent.innerHTML = `
        <div class="report-section">
            <h2>Ringkasan Transaksi User</h2>
            <div class="data-table">
                <div class="table-header">
                    <div class="col">Nama Customer</div>
                    <div class="col">Email</div>
                    <div class="col">Total Transaksi</div>
                    <div class="col">Transaksi Selesai</div>
                    <div class="col">Total Pendapatan</div>
                    <div class="col">Total Berat (kg)</div>
                    <div class="col">Rata-rata</div>
                </div>
                <div id="user-summary-table-body">
                    ${userSummary.length > 0 ? userSummary.map(item => `
                        <div class="table-row">
                            <div class="col">${item.customer_name}</div>
                            <div class="col">${item.email}</div>
                            <div class="col">${item.total_transactions}</div>
                            <div class="col">${item.completed_transactions}</div>
                            <div class="col">${formatCurrency(item.total_earnings || 0)}</div>
                            <div class="col">${(item.total_weight || 0).toFixed(2)}</div>
                            <div class="col">${formatCurrency(item.average_transaction_value || 0)}</div>
                        </div>
                    `).join('') : '<div class="table-row"><div class="col" colspan="7">Tidak ada data</div></div>'}
                </div>
            </div>
        </div>

        <div class="report-section">
            <h2>Top 10 Customer Berdasarkan Jumlah Transaksi</h2>
            <div class="data-table">
                <div class="table-header">
                    <div class="col">Nama Customer</div>
                    <div class="col">Email</div>
                    <div class="col">Jumlah Transaksi</div>
                    <div class="col">Total Pendapatan</div>
                </div>
                <div id="top-customers-table-body">
                    ${topCustomers.length > 0 ? topCustomers.map(item => `
                        <div class="table-row">
                            <div class="col">${item.customer_name}</div>
                            <div class="col">${item.email}</div>
                            <div class="col">${item.transaction_count}</div>
                            <div class="col">${formatCurrency(item.total_earnings || 0)}</div>
                        </div>
                    `).join('') : '<div class="table-row"><div class="col" colspan="4">Tidak ada data</div></div>'}
                </div>
            </div>
        </div>
    `;
}

// Helper function to get month name
function getMonthName(monthNumber) {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[parseInt(monthNumber) - 1] || monthNumber;
}

// Update showReportTab to handle operator reports
function showReportTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.report-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.report-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Load tab-specific data
    switch (tabName) {
        case 'overview':
            loadOverviewReport();
            break;
        case 'financial':
            loadFinancialReport();
            break;
        case 'user-activity':
            loadUserActivityReport();
            break;
        case 'operator-transactions':
            loadOperatorTransactionReport();
            break;
        case 'operator-monthly':
            loadOperatorMonthlyReport();
            break;
        case 'operator-user-transactions':
            loadOperatorUserTransactionReport();
            break;
    }
}

// Export functions
window.loadReports = loadReports;
window.loadOverviewReport = loadOverviewReport;
window.loadFinancialReport = loadFinancialReport;
window.loadUserActivityReport = loadUserActivityReport;
window.loadOperatorTransactionReport = loadOperatorTransactionReport;
window.loadOperatorMonthlyReport = loadOperatorMonthlyReport;
window.loadOperatorUserTransactionReport = loadOperatorUserTransactionReport;
window.exportData = exportData;
window.showReportTab = showReportTab;
