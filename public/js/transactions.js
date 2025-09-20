// Transactions Module

let wasteTypes = [];

// Initialize transactions when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTransactions();
});

// Initialize transactions
function initializeTransactions() {
    // Transaction form
    const transactionForm = document.getElementById('transaction-form');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }

    // Weight input for auto-calculation
    const weightInput = document.getElementById('transaction-weight');
    const priceInput = document.getElementById('transaction-price');
    const totalInput = document.getElementById('transaction-total');

    if (weightInput && priceInput && totalInput) {
        weightInput.addEventListener('input', calculateTotal);
        priceInput.addEventListener('input', calculateTotal);
    }

    // Waste type selection
    const wasteTypeSelect = document.getElementById('transaction-waste-type');
    if (wasteTypeSelect) {
        wasteTypeSelect.addEventListener('change', handleWasteTypeChange);
    }

    // Search and filters
    const searchInput = document.getElementById('search-transactions');
    const wasteTypeFilter = document.getElementById('filter-waste-type');
    const statusFilter = document.getElementById('filter-status');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(loadTransactions, 500));
    }

    if (wasteTypeFilter) {
        wasteTypeFilter.addEventListener('change', loadTransactions);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', loadTransactions);
    }
}

// Load waste types
async function loadWasteTypes() {
    try {
        const response = await apiRequest('/api/waste-types');
        if (response.success) {
            wasteTypes = response.data.wasteTypes;
            updateWasteTypeSelects();
        }
    } catch (error) {
        console.error('Load waste types error:', error);
        showToast('Gagal memuat jenis sampah', 'error');
    }
}

// Update waste type selects
function updateWasteTypeSelects() {
    const transactionSelect = document.getElementById('transaction-waste-type');
    const filterSelect = document.getElementById('filter-waste-type');

    const optionsHTML = wasteTypes.map(wasteType => 
        `<option value="${wasteType.id}">${wasteType.name} - ${formatCurrency(wasteType.price_per_kg)}/kg</option>`
    ).join('');

    if (transactionSelect) {
        transactionSelect.innerHTML = '<option value="">Pilih jenis sampah</option>' + optionsHTML;
    }

    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Semua jenis sampah</option>' + optionsHTML;
    }
}

// Handle waste type change
function handleWasteTypeChange(e) {
    const wasteTypeId = e.target.value;
    const priceInput = document.getElementById('transaction-price');
    
    if (wasteTypeId && priceInput) {
        const wasteType = wasteTypes.find(wt => wt.id == wasteTypeId);
        if (wasteType) {
            priceInput.value = wasteType.price_per_kg;
            calculateTotal();
        }
    }
}

// Calculate total amount
function calculateTotal() {
    const weightInput = document.getElementById('transaction-weight');
    const priceInput = document.getElementById('transaction-price');
    const totalInput = document.getElementById('transaction-total');

    if (weightInput && priceInput && totalInput) {
        const weight = parseFloat(weightInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = weight * price;
        
        totalInput.value = total.toFixed(2);
    }
}

// Show new transaction form
function showNewTransactionForm() {
    const form = document.getElementById('new-transaction-form');
    if (form) {
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth' });
    }
}

// Hide new transaction form
function hideNewTransactionForm() {
    const form = document.getElementById('new-transaction-form');
    if (form) {
        form.style.display = 'none';
        form.reset();
    }
}

// Handle transaction form submission
async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = {
        wasteTypeId: parseInt(formData.get('wasteTypeId')),
        weight: parseFloat(formData.get('weight')),
        pricePerKg: parseFloat(formData.get('pricePerKg')),
        notes: formData.get('notes')
    };

    // Clear previous errors
    clearFormErrors(form);

    // Validation
    if (!data.wasteTypeId) {
        showFormError(form, 'wasteTypeId', 'Pilih jenis sampah');
        return;
    }

    if (!data.weight || data.weight <= 0) {
        showFormError(form, 'weight', 'Berat harus lebih dari 0');
        return;
    }

    if (!data.pricePerKg || data.pricePerKg <= 0) {
        showFormError(form, 'pricePerKg', 'Harga per kg harus lebih dari 0');
        return;
    }

    try {
        showLoading();
        
        const response = await apiRequest('/api/transactions', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.success) {
            showToast('Transaksi berhasil dibuat!', 'success');
            hideNewTransactionForm();
            loadTransactions();
        } else {
            showToast(response.message || 'Gagal membuat transaksi', 'error');
        }
    } catch (error) {
        console.error('Transaction submit error:', error);
        showToast(error.message || 'Terjadi kesalahan saat membuat transaksi', 'error');
    } finally {
        hideLoading();
    }
}

// Load transactions
async function loadTransactions() {
    if (!currentUser) {
        showToast('Anda harus login terlebih dahulu', 'error');
        showPage('login');
        return;
    }

    try {
        showLoading();
        
        // Get filter values
        const search = document.getElementById('search-transactions')?.value || '';
        const wasteTypeId = document.getElementById('filter-waste-type')?.value || '';
        const status = document.getElementById('filter-status')?.value || '';

        // Build query parameters
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (wasteTypeId) params.append('wasteTypeId', wasteTypeId);
        if (status) params.append('status', status);
        params.append('limit', '20');

        const response = await apiRequest(`/api/transactions?${params.toString()}`);
        if (response.success) {
            updateTransactionsList(response.data.transactions);
        }
    } catch (error) {
        console.error('Load transactions error:', error);
        showToast('Gagal memuat transaksi', 'error');
    } finally {
        hideLoading();
    }
}

// Update transactions list
function updateTransactionsList(transactions) {
    const container = document.getElementById('transactions-list');
    if (!container) return;

    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<p class="no-data">Tidak ada transaksi ditemukan</p>';
        return;
    }

    const transactionsHTML = transactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <h3>${transaction.waste_type_name}</h3>
                <div class="transaction-details">
                    <div class="transaction-detail">
                        <label>Pelanggan</label>
                        <span>${transaction.first_name} ${transaction.last_name}</span>
                    </div>
                    <div class="transaction-detail">
                        <label>Berat</label>
                        <span>${transaction.weight} kg</span>
                    </div>
                    <div class="transaction-detail">
                        <label>Harga per kg</label>
                        <span>${formatCurrency(transaction.price_per_kg)}</span>
                    </div>
                    <div class="transaction-detail">
                        <label>Total</label>
                        <span>${formatCurrency(transaction.total_amount)}</span>
                    </div>
                    <div class="transaction-detail">
                        <label>Tanggal</label>
                        <span>${formatDate(transaction.created_at)}</span>
                    </div>
                    ${transaction.notes ? `
                    <div class="transaction-detail">
                        <label>Catatan</label>
                        <span>${transaction.notes}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="transaction-status">
                <span class="transaction-status status-${transaction.status}">
                    ${getStatusText(transaction.status)}
                </span>
                ${transaction.status === 'pending' && currentUser.role !== 'customer' ? `
                <div class="transaction-actions">
                    <button class="btn btn-primary btn-sm" onclick="completeTransaction(${transaction.id})">
                        Selesaikan
                    </button>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = transactionsHTML;
}

// Complete transaction
async function completeTransaction(transactionId) {
    if (!confirm('Apakah Anda yakin ingin menyelesaikan transaksi ini?')) {
        return;
    }

    try {
        showLoading();
        
        const response = await apiRequest(`/api/transactions/${transactionId}/complete`, {
            method: 'PATCH'
        });

        if (response.success) {
            showToast('Transaksi berhasil diselesaikan!', 'success');
            loadTransactions();
        } else {
            showToast(response.message || 'Gagal menyelesaikan transaksi', 'error');
        }
    } catch (error) {
        console.error('Complete transaction error:', error);
        showToast(error.message || 'Terjadi kesalahan saat menyelesaikan transaksi', 'error');
    } finally {
        hideLoading();
    }
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load transactions when page is shown
window.addEventListener('hashchange', function() {
    if (window.location.hash === '#transactions') {
        loadTransactions();
        loadWasteTypes();
    }
});

// Export functions
window.showNewTransactionForm = showNewTransactionForm;
window.hideNewTransactionForm = hideNewTransactionForm;
window.loadTransactions = loadTransactions;
window.completeTransaction = completeTransaction;
