// Charts Module for Enhanced Dashboard

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
});

// Initialize charts
function initializeCharts() {
    // Charts will be initialized when needed
}

// Load and display charts
async function loadCharts() {
    if (!currentUser) {
        showToast('Anda harus login terlebih dahulu', 'error');
        return;
    }

    try {
        showLoading();
        
        const response = await apiRequest('/api/dashboard/charts');
        if (response.success) {
            displayCharts(response.data);
        }
    } catch (error) {
        console.error('Charts load error:', error);
        showToast('Gagal memuat data chart', 'error');
    } finally {
        hideLoading();
    }
}

// Display charts
function displayCharts(data) {
    displayDailyEarningsChart(data.dailyEarnings);
    displayWasteTypeDistribution(data.wasteTypeDistribution);
    displayMonthlyComparison(data.monthlyComparison);
}

// Display daily earnings chart
function displayDailyEarningsChart(dailyEarnings) {
    const container = document.getElementById('daily-earnings-chart');
    if (!container) return;

    if (!dailyEarnings || dailyEarnings.length === 0) {
        container.innerHTML = '<p class="no-data">Tidak ada data untuk ditampilkan</p>';
        return;
    }

    // Create simple bar chart using CSS
    const maxAmount = Math.max(...dailyEarnings.map(d => d.total));
    
    const chartHTML = `
        <div class="chart-container">
            <h3>Penghasilan Harian (30 Hari Terakhir)</h3>
            <div class="bar-chart">
                ${dailyEarnings.map(day => `
                    <div class="bar-item">
                        <div class="bar" style="height: ${(day.total / maxAmount) * 200}px;" 
                             title="${formatDate(day.date)}: ${formatCurrency(day.total)}">
                        </div>
                        <div class="bar-label">${new Date(day.date).getDate()}</div>
                    </div>
                `).join('')}
            </div>
            <div class="chart-legend">
                <span>Tanggal</span>
                <span>Penghasilan</span>
            </div>
        </div>
    `;

    container.innerHTML = chartHTML;
}

// Display waste type distribution
function displayWasteTypeDistribution(distribution) {
    const container = document.getElementById('waste-type-distribution');
    if (!container) return;

    if (!distribution || distribution.length === 0) {
        container.innerHTML = '<p class="no-data">Tidak ada data untuk ditampilkan</p>';
        return;
    }

    const totalAmount = distribution.reduce((sum, item) => sum + item.total_amount, 0);
    
    const distributionHTML = `
        <div class="chart-container">
            <h3>Distribusi Jenis Sampah</h3>
            <div class="distribution-chart">
                ${distribution.map(item => {
                    const percentage = (item.total_amount / totalAmount) * 100;
                    return `
                        <div class="distribution-item">
                            <div class="distribution-bar">
                                <div class="distribution-fill" style="width: ${percentage}%"></div>
                            </div>
                            <div class="distribution-info">
                                <span class="distribution-name">${item.waste_type}</span>
                                <span class="distribution-value">${formatCurrency(item.total_amount)} (${percentage.toFixed(1)}%)</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    container.innerHTML = distributionHTML;
}

// Display monthly comparison
function displayMonthlyComparison(comparison) {
    const container = document.getElementById('monthly-comparison');
    if (!container) return;

    if (!comparison || comparison.length === 0) {
        container.innerHTML = '<p class="no-data">Tidak ada data untuk ditampilkan</p>';
        return;
    }

    const comparisonHTML = `
        <div class="chart-container">
            <h3>Perbandingan Bulanan</h3>
            <div class="comparison-chart">
                ${comparison.map(month => `
                    <div class="comparison-item">
                        <div class="comparison-month">${formatMonth(month.month)}</div>
                        <div class="comparison-stats">
                            <div class="stat">
                                <span class="stat-label">Total:</span>
                                <span class="stat-value">${formatCurrency(month.total)}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Transaksi:</span>
                                <span class="stat-value">${month.count}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.innerHTML = comparisonHTML;
}

// Format month for display
function formatMonth(monthString) {
    const [year, month] = monthString.split('-');
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
}

// Export functions
window.loadCharts = loadCharts;
