// Authentication Module

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

// Initialize authentication
function initializeAuth() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    // Clear previous errors
    clearFormErrors(form);

    // Basic validation
    if (!data.email || !data.password) {
        showToast('Email dan password harus diisi', 'error');
        return;
    }

    if (!validateEmail(data.email)) {
        showFormError(form, 'email', 'Format email tidak valid');
        return;
    }

    try {
        showLoading();
        
        const response = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.success) {
            // Store authentication data
            setAuthData(response.data.token, response.data.user);
            
            // Show success message
            showToast('Login berhasil!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                showPage('dashboard');
            }, 1000);
        } else {
            showToast(response.message || 'Login gagal', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Terjadi kesalahan saat login', 'error');
    } finally {
        hideLoading();
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        password: formData.get('password'),
        phone: formData.get('phone'),
        address: formData.get('address')
    };

    // Clear previous errors
    clearFormErrors(form);

    // Validation
    const errors = validateRegisterData(data);
    if (errors.length > 0) {
        errors.forEach(error => {
            showFormError(form, error.field, error.message);
        });
        return;
    }

    try {
        showLoading();
        
        const response = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.success) {
            // Store authentication data
            setAuthData(response.data.token, response.data.user);
            
            // Show success message
            showToast('Registrasi berhasil!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                showPage('dashboard');
            }, 1000);
        } else {
            showToast(response.message || 'Registrasi gagal', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showToast(error.message || 'Terjadi kesalahan saat registrasi', 'error');
    } finally {
        hideLoading();
    }
}

// Validate registration data
function validateRegisterData(data) {
    const errors = [];

    // First name validation
    if (!data.firstName || data.firstName.trim().length < 2) {
        errors.push({
            field: 'firstName',
            message: 'Nama depan minimal 2 karakter'
        });
    }

    // Last name validation
    if (!data.lastName || data.lastName.trim().length < 2) {
        errors.push({
            field: 'lastName',
            message: 'Nama belakang minimal 2 karakter'
        });
    }

    // Email validation
    if (!data.email) {
        errors.push({
            field: 'email',
            message: 'Email harus diisi'
        });
    } else if (!validateEmail(data.email)) {
        errors.push({
            field: 'email',
            message: 'Format email tidak valid'
        });
    }

    // Password validation
    if (!data.password) {
        errors.push({
            field: 'password',
            message: 'Password harus diisi'
        });
    } else if (data.password.length < 6) {
        errors.push({
            field: 'password',
            message: 'Password minimal 6 karakter'
        });
    }

    // Phone validation (optional)
    if (data.phone && !validatePhone(data.phone)) {
        errors.push({
            field: 'phone',
            message: 'Format nomor telepon tidak valid'
        });
    }

    // Address validation (optional)
    if (data.address && data.address.trim().length < 5) {
        errors.push({
            field: 'address',
            message: 'Alamat minimal 5 karakter'
        });
    }

    return errors;
}

// Check if user is authenticated
function isAuthenticated() {
    return currentUser !== null && authToken !== null;
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Get auth token
function getAuthToken() {
    return authToken;
}

// Export functions
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.getAuthToken = getAuthToken;
