const App = {
    init: function() {
        this.setupAjax();
        this.setupToast();
        this.checkAuth();
    },

    setupAjax: function() {
        $.ajaxSetup({
            beforeSend: function(xhr) {
                const token = localStorage.getItem(CONFIG.TOKEN_KEY);
                if (token) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                }
            },
            error: function(xhr, status, error) {
                if (xhr.status === 401) {
                    App.showToast('Session expired. Please login again.', 'error');
                    setTimeout(() => {
                        localStorage.removeItem(CONFIG.TOKEN_KEY);
                        localStorage.removeItem(CONFIG.USER_KEY);
                        window.location.href = 'login.html';
                    }, 2000);
                }
            }
        });
    },

    apiRequest: function(options) {
        const method = options.method || 'GET';
        const data = options.data;
        
        const ajaxOptions = $.extend({}, options);
        ajaxOptions.url = CONFIG.API_BASE_URL + (options.endpoint || '');
        ajaxOptions.method = method;
        ajaxOptions.contentType = 'application/json';
        ajaxOptions.dataType = 'json';
        ajaxOptions.processData = false;
        
        ajaxOptions.beforeSend = function(xhr) {
            const token = localStorage.getItem(CONFIG.TOKEN_KEY);
            if (token) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            }
            if (options.beforeSend) {
                options.beforeSend(xhr);
            }
        };

        if (data) {
            if (method === 'GET') {
                ajaxOptions.data = data;
                ajaxOptions.processData = true;
            } else {
                ajaxOptions.data = JSON.stringify(data);
            }
        } else {
            delete ajaxOptions.data;
        }

        return $.ajax(ajaxOptions);
    },

    showToast: function(message, type = 'info') {
        const toast = $('<div>')
            .addClass('toast toast-' + type)
            .text(message);
        
        $('#toastContainer').append(toast);
        
        setTimeout(() => {
            toast.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    },

    setupToast: function() {
        if ($('#toastContainer').length === 0) {
            $('body').append('<div id="toastContainer"></div>');
        }
    },

    showLoading: function() {
        $('#pageLoading').fadeIn(200);
    },

    hideLoading: function() {
        $('#pageLoading').fadeOut(200);
    },

    checkAuth: function() {
        const currentPage = window.location.pathname.split('/').pop();
        
        if (currentPage === 'dashboard.html' || currentPage === '') {
            const token = localStorage.getItem(CONFIG.TOKEN_KEY);
            if (!token && currentPage === 'dashboard.html') {
                window.location.href = 'login.html';
            }
        }
    },

    formatCurrency: function(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }
};

$(document).ready(function() {
    App.init();
});

