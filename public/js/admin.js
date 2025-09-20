// Admin Module

let allUsers = [];
let allWasteTypes = [];

// Initialize admin when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

// Initialize admin
function initializeAdmin() {
    // Admin functionality will be loaded when needed
}

// Setup role-based UI
function setupRoleBasedUI() {
    if (!currentUser) return;

    // Hide admin-only tabs for operators
    if (currentUser.role === 'operator') {
        document.querySelectorAll('.admin-only').forEach(element => {
            element.style.display = 'none';
        });
    } else {
        document.querySelectorAll('.admin-only').forEach(element => {
            element.style.display = 'block';
        });
    }

    // Update page title based on role
    const pageTitle = document.querySelector('#admin-page h1');
    if (pageTitle) {
        if (currentUser.role === 'operator') {
            pageTitle.textContent = 'Operator Panel';
        } else {
            pageTitle.textContent = 'Admin Panel';
        }
    }
}

// Load admin dashboard
async function loadAdminDashboard() {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'operator')) {
        showToast('Akses ditolak. Hanya admin dan operator yang dapat mengakses halaman ini.', 'error');
        showPage('dashboard');
        return;
    }

    // Setup role-based UI
    setupRoleBasedUI();

    try {
        showLoading();
        
        // Load system statistics
        const statsResponse = await apiRequest('/api/dashboard/stats');
        if (statsResponse.success) {
            updateAdminStats(statsResponse.data);
        }

        // Load recent system activity
        const recentResponse = await apiRequest('/api/dashboard/recent-transactions?limit=10');
        if (recentResponse.success) {
            updateRecentActivity(recentResponse.data.transactions);
        }

    } catch (error) {
        console.error('Admin dashboard load error:', error);
        showToast('Gagal memuat dashboard admin', 'error');
    } finally {
        hideLoading();
    }
}

// Update admin statistics
function updateAdminStats(stats) {
    const statsContainer = document.getElementById('admin-stats');
    if (!statsContainer) return;

    const statsHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-content">
                    <h3>Total Pengguna</h3>
                    <p class="stat-value">${stats.totalUsers}</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <h3>Total Transaksi</h3>
                    <p class="stat-value">${stats.totalTransactions}</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-content">
                    <h3>Total Penghasilan</h3>
                    <p class="stat-value">${formatCurrency(stats.totalEarnings)}</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⚖️</div>
                <div class="stat-content">
                    <h3>Total Berat</h3>
                    <p class="stat-value">${stats.totalWeight} kg</p>
                </div>
            </div>
        </div>
    `;

    statsContainer.innerHTML = statsHTML;
}

// Update recent activity
function updateRecentActivity(transactions) {
    const container = document.getElementById('recent-activity');
    if (!container) return;

    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<p class="no-data">Tidak ada aktivitas terbaru</p>';
        return;
    }

    const activityHTML = transactions.map(transaction => `
        <div class="activity-item">
            <div class="activity-info">
                <h4>${transaction.first_name} ${transaction.last_name}</h4>
                <p>Transaksi ${transaction.waste_type_name} - ${formatCurrency(transaction.total_amount)}</p>
                <small>${formatDate(transaction.created_at)}</small>
            </div>
            <div class="activity-status">
                <span class="status-badge status-${transaction.status}">
                    ${getStatusText(transaction.status)}
                </span>
            </div>
        </div>
    `).join('');

    container.innerHTML = activityHTML;
}

// Load user management
async function loadUserManagement() {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Akses ditolak. Hanya admin yang dapat mengakses halaman ini.', 'error');
        return;
    }

    try {
        showLoading();
        
        const response = await apiRequest('/api/users');
        if (response.success) {
            allUsers = response.data.users;
            updateUserList(allUsers);
        }
    } catch (error) {
        console.error('Load users error:', error);
        showToast('Gagal memuat daftar pengguna', 'error');
    } finally {
        hideLoading();
    }
}

// Update user list
function updateUserList(users) {
    const container = document.getElementById('users-list');
    if (!container) return;

    if (!users || users.length === 0) {
        container.innerHTML = '<p class="no-data">Tidak ada pengguna ditemukan</p>';
        return;
    }

    const usersHTML = users.map(user => `
        <div class="user-item">
            <div class="user-info">
                <h3>${user.first_name} ${user.last_name}</h3>
                <p>${user.email}</p>
                <p>Role: <span class="role-badge role-${user.role}">${user.role}</span></p>
                <p>Bergabung: ${formatDate(user.created_at)}</p>
                ${user.total_earnings ? `<p>Total Penghasilan: ${formatCurrency(user.total_earnings)}</p>` : ''}
            </div>
            <div class="user-actions">
                <button class="btn btn-sm btn-primary" onclick="editUser(${user.id})">
                    Edit
                </button>
                <button class="btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'}" 
                        onclick="toggleUserStatus(${user.id}, ${user.is_active})">
                    ${user.is_active ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = usersHTML;
}

// Edit user
async function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    // Show edit modal or form
    showUserEditModal(user);
}

// Show user edit modal
function showUserEditModal(user) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit User</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="edit-user-form">
                    <input type="hidden" name="userId" value="${user.id}">
                    <div class="form-group">
                        <label>First Name</label>
                        <input type="text" name="firstName" value="${user.first_name}" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" name="lastName" value="${user.last_name}" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value="${user.email}" required>
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" name="phone" value="${user.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <textarea name="address" rows="3">${user.address || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select name="role" required>
                            <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option>
                            <option value="operator" ${user.role === 'operator' ? 'selected' : ''}>Operator</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="isActive">
                            <option value="1" ${user.is_active ? 'selected' : ''}>Active</option>
                            <option value="0" ${!user.is_active ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveUserEdit()">Save Changes</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Save user edit
async function saveUserEdit() {
    const form = document.getElementById('edit-user-form');
    const formData = new FormData(form);
    const userId = formData.get('userId');
    
    const data = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        role: formData.get('role'),
        isActive: parseInt(formData.get('isActive'))
    };

    try {
        showLoading();
        
        const response = await apiRequest(`/api/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        if (response.success) {
            showToast('User berhasil diupdate!', 'success');
            closeModal();
            loadUserManagement();
        } else {
            showToast(response.message || 'Gagal mengupdate user', 'error');
        }
    } catch (error) {
        console.error('Save user edit error:', error);
        showToast(error.message || 'Terjadi kesalahan saat mengupdate user', 'error');
    } finally {
        hideLoading();
    }
}

// Toggle user status
async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Apakah Anda yakin ingin ${action} user ini?`)) {
        return;
    }

    try {
        showLoading();
        
        const response = await apiRequest(`/api/users/${userId}/toggle`, {
            method: 'PATCH'
        });

        if (response.success) {
            showToast(`User berhasil di${action}!`, 'success');
            loadUserManagement();
        } else {
            showToast(response.message || `Gagal ${action} user`, 'error');
        }
    } catch (error) {
        console.error('Toggle user status error:', error);
        showToast(error.message || 'Terjadi kesalahan', 'error');
    } finally {
        hideLoading();
    }
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Load waste type management
async function loadWasteTypeManagement() {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Akses ditolak. Hanya admin yang dapat mengakses halaman ini.', 'error');
        return;
    }

    try {
        showLoading();
        
        const response = await apiRequest('/api/waste-types');
        if (response.success) {
            allWasteTypes = response.data.wasteTypes;
            updateWasteTypeList(allWasteTypes);
        }
    } catch (error) {
        console.error('Load waste types error:', error);
        showToast('Gagal memuat daftar jenis sampah', 'error');
    } finally {
        hideLoading();
    }
}

// Update waste type list
function updateWasteTypeList(wasteTypes) {
    const container = document.getElementById('waste-types-list');
    if (!container) return;

    if (!wasteTypes || wasteTypes.length === 0) {
        container.innerHTML = '<p class="no-data">Tidak ada jenis sampah ditemukan</p>';
        return;
    }

    const wasteTypesHTML = wasteTypes.map(wasteType => `
        <div class="waste-type-item">
            <div class="waste-type-info">
                <h3>${wasteType.name}</h3>
                <p>${wasteType.description || 'Tidak ada deskripsi'}</p>
                <p>Harga: <strong>${formatCurrency(wasteType.price_per_kg)} per ${wasteType.unit}</strong></p>
                <p>Status: <span class="status-badge ${wasteType.is_active ? 'status-active' : 'status-inactive'}">
                    ${wasteType.is_active ? 'Aktif' : 'Tidak Aktif'}
                </span></p>
            </div>
            <div class="waste-type-actions">
                <button class="btn btn-sm btn-primary" onclick="editWasteType(${wasteType.id})">
                    Edit
                </button>
                <button class="btn btn-sm ${wasteType.is_active ? 'btn-warning' : 'btn-success'}" 
                        onclick="toggleWasteTypeStatus(${wasteType.id}, ${wasteType.is_active})">
                    ${wasteType.is_active ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = wasteTypesHTML;
}

// Edit waste type
async function editWasteType(wasteTypeId) {
    const wasteType = allWasteTypes.find(wt => wt.id === wasteTypeId);
    if (!wasteType) return;

    showWasteTypeEditModal(wasteType);
}

// Show waste type edit modal
function showWasteTypeEditModal(wasteType) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Jenis Sampah</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="edit-waste-type-form">
                    <input type="hidden" name="wasteTypeId" value="${wasteType.id}">
                    <div class="form-group">
                        <label>Nama</label>
                        <input type="text" name="name" value="${wasteType.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Deskripsi</label>
                        <textarea name="description" rows="3">${wasteType.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Harga per kg</label>
                        <input type="number" name="pricePerKg" value="${wasteType.price_per_kg}" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>Unit</label>
                        <input type="text" name="unit" value="${wasteType.unit}" required>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="isActive">
                            <option value="1" ${wasteType.is_active ? 'selected' : ''}>Aktif</option>
                            <option value="0" ${!wasteType.is_active ? 'selected' : ''}>Tidak Aktif</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveWasteTypeEdit()">Save Changes</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Save waste type edit
async function saveWasteTypeEdit() {
    const form = document.getElementById('edit-waste-type-form');
    const formData = new FormData(form);
    const wasteTypeId = formData.get('wasteTypeId');
    
    const data = {
        name: formData.get('name'),
        description: formData.get('description'),
        pricePerKg: parseFloat(formData.get('pricePerKg')),
        unit: formData.get('unit'),
        isActive: parseInt(formData.get('isActive'))
    };

    try {
        showLoading();
        
        const response = await apiRequest(`/api/waste-types/${wasteTypeId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        if (response.success) {
            showToast('Jenis sampah berhasil diupdate!', 'success');
            closeModal();
            loadWasteTypeManagement();
        } else {
            showToast(response.message || 'Gagal mengupdate jenis sampah', 'error');
        }
    } catch (error) {
        console.error('Save waste type edit error:', error);
        showToast(error.message || 'Terjadi kesalahan saat mengupdate jenis sampah', 'error');
    } finally {
        hideLoading();
    }
}

// Toggle waste type status
async function toggleWasteTypeStatus(wasteTypeId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Apakah Anda yakin ingin ${action} jenis sampah ini?`)) {
        return;
    }

    try {
        showLoading();
        
        const response = await apiRequest(`/api/waste-types/${wasteTypeId}/toggle`, {
            method: 'PATCH'
        });

        if (response.success) {
            showToast(`Jenis sampah berhasil di${action}!`, 'success');
            loadWasteTypeManagement();
        } else {
            showToast(response.message || `Gagal ${action} jenis sampah`, 'error');
        }
    } catch (error) {
        console.error('Toggle waste type status error:', error);
        showToast(error.message || 'Terjadi kesalahan', 'error');
    } finally {
        hideLoading();
    }
}

// Export functions
window.loadAdminDashboard = loadAdminDashboard;
window.loadUserManagement = loadUserManagement;
window.loadWasteTypeManagement = loadWasteTypeManagement;
window.editUser = editUser;
window.toggleUserStatus = toggleUserStatus;
window.editWasteType = editWasteType;
window.toggleWasteTypeStatus = toggleWasteTypeStatus;
window.closeModal = closeModal;
window.saveUserEdit = saveUserEdit;
window.saveWasteTypeEdit = saveWasteTypeEdit;
