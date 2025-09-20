// Bank Sampah System - Main Application JavaScript

// Global variables
let currentUser = null;
let authToken = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

// Initialize application
function initializeApp() {
    console.log('Bank Sampah System initialized');
    
    // Setup navigation
    setupNavigation();
    
    // Force navigation setup after authentication check
    setTimeout(() => {
        setupNavigation();
    }, 200);
    
    // Load initial page
    const hash = window.location.hash.substring(1) || 'home';
    showPage(hash);
}

// Setup event listeners
function setupEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page) {
                showPage(page);
            }
        });
    });

    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
        });
    });

    // Logout functionality
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    // Setup all button event listeners
    setupButtonEventListeners();
}

// Setup button event listeners
function setupButtonEventListeners() {
    // Generic button handler for data-action attributes
    document.addEventListener('click', function(e) {
        const action = e.target.getAttribute('data-action');
        const tab = e.target.getAttribute('data-tab');
        const reportTab = e.target.getAttribute('data-report-tab');
        
        if (action) {
            e.preventDefault();
            handleButtonAction(action);
        } else if (tab) {
            e.preventDefault();
            showAdminTab(tab);
        } else if (reportTab) {
            e.preventDefault();
            showReportTab(reportTab);
        }
    });
}

// Handle button actions
function handleButtonAction(action) {
    switch (action) {
        case 'register':
            showPage('register');
            break;
        case 'login':
            showPage('login');
            break;
        case 'transactions':
            showPage('transactions');
            break;
        case 'refresh-dashboard':
            loadDashboard();
            break;
        case 'admin-panel':
            showPage('admin');
            break;
        case 'new-transaction':
            showNewTransactionForm();
            break;
        case 'cancel-transaction':
            hideNewTransactionForm();
            break;
        case 'export-csv':
            exportData('csv');
            break;
        case 'refresh-report':
            refreshCurrentReport();
            break;
        case 'create-user':
            showCreateUserModal();
            break;
        case 'create-waste-type':
            showCreateWasteTypeModal();
            break;
        default:
            console.log('Unknown action:', action);
    }
}

// Setup navigation based on authentication status
function setupNavigation() {
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const dashboardLink = document.getElementById('dashboard-link');
    const transactionsLink = document.getElementById('transactions-link');
    const adminLink = document.getElementById('admin-link');
    const logoutLink = document.getElementById('logout-link');

    console.log('Setting up navigation for user:', currentUser); // Debug log

    if (currentUser) {
        // User is logged in
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'block';
        if (transactionsLink) transactionsLink.style.display = 'block';
        if (logoutLink) logoutLink.style.display = 'block';
        
        // Show admin link for admin and operator users
        if (adminLink) {
            const shouldShowAdmin = (currentUser.role === 'admin' || currentUser.role === 'operator');
            adminLink.style.display = shouldShowAdmin ? 'block' : 'none';
            
            // Update link text based on role
            if (shouldShowAdmin) {
                adminLink.textContent = currentUser.role === 'operator' ? 'Panel' : 'Admin';
            }
            
            console.log('Admin link visibility:', shouldShowAdmin, 'for role:', currentUser.role); // Debug log
        }
    } else {
        // User is not logged in
        if (loginLink) loginLink.style.display = 'block';
        if (registerLink) registerLink.style.display = 'block';
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (transactionsLink) transactionsLink.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'none';
    }
}

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        try {
            authToken = token;
            currentUser = JSON.parse(user);
            setupNavigation();
            
            // Update user name in dashboard if available
            const userNameElement = document.getElementById('user-name');
            if (userNameElement && currentUser) {
                userNameElement.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
            }
        } catch (error) {
            console.error('Error parsing stored user data:', error);
            clearAuthData();
        }
    }
}

// Show page function
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Update URL hash
        window.location.hash = pageName;
        
        // Load page-specific data
        loadPageData(pageName);
    } else {
        console.error(`Page ${pageName} not found`);
    }
}

// Load page-specific data
function loadPageData(pageName) {
    switch (pageName) {
        case 'dashboard':
            if (currentUser) {
                loadDashboard();
            } else {
                showPage('login');
            }
            break;
        case 'transactions':
            if (currentUser) {
                loadTransactions();
                loadWasteTypes();
            } else {
                showPage('login');
            }
            break;
               case 'admin':
                   if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'operator')) {
                       loadAdminDashboard();
                   } else {
                       showToast('Akses ditolak. Hanya admin dan operator yang dapat mengakses halaman ini.', 'error');
                       showPage('dashboard');
                   }
                   break;
        case 'login':
        case 'register':
            // Clear any form data
            clearForms();
            break;
    }
}

// Clear form data
function clearForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.reset();
        // Clear any error messages
        const errorElements = form.querySelectorAll('.error-message');
        errorElements.forEach(error => error.remove());
    });
}

// Show loading overlay
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

// Hide loading overlay
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

// API request helper
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (authToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, finalOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Logout function
function logout() {
    // Clear stored data
    clearAuthData();
    
    // Reset navigation
    setupNavigation();
    
    // Show home page
    showPage('home');
    
    // Show success message
    showToast('Berhasil keluar dari akun', 'success');
}

// Clear authentication data
function clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
}

// Set authentication data
function setAuthData(token, user) {
    authToken = token;
    currentUser = user;
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    setupNavigation();
    
    // Update user name in dashboard
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && currentUser) {
        userNameElement.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    }
}

// Format currency
function formatCurrency(amount) {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(numAmount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone number (Indonesian format)
function validatePhone(phone) {
    const re = /^(\+62|62|0)[0-9]{9,13}$/;
    return re.test(phone);
}

// Show error message in form
function showFormError(form, fieldName, message) {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    // Remove existing error
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Add new error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.8rem';
    errorDiv.style.marginTop = '0.25rem';
    errorDiv.textContent = message;

    field.parentNode.appendChild(errorDiv);
    field.style.borderColor = '#dc3545';
}

// Clear form errors
function clearFormErrors(form) {
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());

    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
        field.style.borderColor = '#e1e5e9';
    });
}

// Export functions for use in other modules
window.showPage = showPage;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.apiRequest = apiRequest;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.showFormError = showFormError;
window.clearFormErrors = clearFormErrors;

// Admin tab functionality
function showAdminTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    const targetTab = document.getElementById(`admin-${tabName}-tab`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load tab-specific data
    switch (tabName) {
        case 'dashboard':
            loadAdminDashboard();
            break;
        case 'users':
            loadUserManagement();
            break;
        case 'waste-types':
            loadWasteTypeManagement();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

// Refresh current report
function refreshCurrentReport() {
    const activeReportTab = document.querySelector('.report-tab-btn.active');
    if (activeReportTab) {
        const tabName = activeReportTab.textContent.toLowerCase().replace(/\s+/g, '-');
        if (tabName.includes('overview')) {
            loadOverviewReport();
        } else if (tabName.includes('keuangan')) {
            loadFinancialReport();
        } else if (tabName.includes('aktivitas')) {
            loadUserActivityReport();
        }
    }
}

// Show create user modal (placeholder)
function showCreateUserModal() {
    showToast('Fitur tambah user akan segera tersedia', 'info');
}

// Show create waste type modal (placeholder)
function showCreateWasteTypeModal() {
    showToast('Fitur tambah jenis sampah akan segera tersedia', 'info');
}

// Export admin functions
window.showAdminTab = showAdminTab;
window.refreshCurrentReport = refreshCurrentReport;
window.showCreateUserModal = showCreateUserModal;
window.showCreateWasteTypeModal = showCreateWasteTypeModal;
