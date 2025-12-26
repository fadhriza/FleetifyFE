$(document).ready(function() {
    $('#showRegister').on('click', function(e) {
        e.preventDefault();
        $('#loginForm').hide();
        $('#registerForm').show();
    });

    $('#showLogin').on('click', function(e) {
        e.preventDefault();
        $('#registerForm').hide();
        $('#loginForm').show();
    });

    $('#btnLogin').on('click', function() {
        const username = $('#loginUsername').val().trim();
        const password = $('#loginPassword').val();

        if (!username || !password) {
            App.showToast('Please fill in all fields', 'error');
            return;
        }

        App.showLoading();

        App.apiRequest({
            endpoint: '/auth/login',
            method: 'POST',
            data: { username, password }
        })
        .done(function(response) {
            if (response.error === false && response.data) {
                localStorage.setItem(CONFIG.TOKEN_KEY, response.data.token);
                localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.data.user));
                App.showToast('Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                App.showToast('Login failed. Please check your credentials.', 'error');
            }
        })
        .fail(function(xhr) {
            let errorMsg = 'Login failed. Please try again.';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMsg = xhr.responseJSON.message;
            }
            App.showToast(errorMsg, 'error');
        })
        .always(function() {
            App.hideLoading();
        });
    });

    $('#btnRegister').on('click', function() {
        const username = $('#regUsername').val().trim();
        const password = $('#regPassword').val();
        const fullName = $('#regFullName').val().trim();
        const role = $('#regRole').val();
        const email = $('#regEmail').val().trim();
        const phone = $('#regPhone').val().trim();

        if (!username || !password || !fullName) {
            App.showToast('Please fill in all required fields', 'error');
            return;
        }

        if (password.length < 6) {
            App.showToast('Password must be at least 6 characters', 'error');
            return;
        }

        App.showLoading();

        const registerData = {
            username,
            password,
            role,
            full_name: fullName
        };

        if (email) registerData.email = email;
        if (phone) registerData.phone = phone;

        App.apiRequest({
            endpoint: '/auth/register',
            method: 'POST',
            data: registerData
        })
        .done(function(response) {
            if (response.error === false && response.data) {
                localStorage.setItem(CONFIG.TOKEN_KEY, response.data.token);
                localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.data.user));
                App.showToast('Registration successful!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                App.showToast('Registration failed. Please try again.', 'error');
            }
        })
        .fail(function(xhr) {
            let errorMsg = 'Registration failed. Please try again.';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMsg = xhr.responseJSON.message;
            }
            App.showToast(errorMsg, 'error');
        })
        .always(function() {
            App.hideLoading();
        });
    });

    $('#btnLogout').on('click', function() {
        App.showLoading();

        App.apiRequest({
            endpoint: '/auth/logout',
            method: 'POST'
        })
        .always(function() {
            localStorage.removeItem(CONFIG.TOKEN_KEY);
            localStorage.removeItem(CONFIG.USER_KEY);
            App.hideLoading();
            App.showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        });
    });
});

