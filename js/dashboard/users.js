const DashboardUsers = {
    setupControls: function() {
        let searchTimeout;
        $('#usersSearch').on('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                Dashboard.usersParams.search = $('#usersSearch').val();
                Dashboard.usersParams.page = 1;
                this.load();
            }, 500);
        });

        $('#usersSort').on('change', () => {
            Dashboard.usersParams.sort = $('#usersSort').val();
            Dashboard.usersParams.page = 1;
            this.load();
        });

        $('#usersFilterRole').on('change', () => {
            const value = $('#usersFilterRole').val();
            if (value) {
                Dashboard.usersParams.filters.role = value;
            } else {
                delete Dashboard.usersParams.filters.role;
            }
            Dashboard.usersParams.page = 1;
            this.load();
        });

        $('#usersLimit').on('change', () => {
            Dashboard.usersParams.limit = parseInt($('#usersLimit').val());
            Dashboard.usersParams.page = 1;
            this.load();
        });

        $(document).on('click', '#usersPrevPage', () => {
            if (Dashboard.usersParams.page > 1) {
                Dashboard.usersParams.page--;
                this.load();
            }
        });

        $(document).on('click', '#usersNextPage', () => {
            if (Dashboard.usersParams.page < Dashboard.usersPagination.total_pages) {
                Dashboard.usersParams.page++;
                this.load();
            }
        });

        $(document).on('click', '.btn-edit-user', (e) => {
            const username = $(e.target).data('username');
            this.editUser(username);
        });

        $(document).on('click', '.btn-delete-user', (e) => {
            const username = $(e.target).data('username');
            this.deleteUser(username);
        });

        $('#btnSaveUser').on('click', () => {
            this.saveUser();
        });

        $('#btnCancelEdit, #closeUserEdit').on('click', () => {
            $('#userEditModal').fadeOut(200);
        });
    },

    load: function() {
        if (!Dashboard.isAdmin()) {
            return;
        }

        $('#usersLoading').show();
        
        const queryParams = QueryBuilder.buildQueryParams(Dashboard.usersParams);
        
        App.apiRequest({
            endpoint: '/users',
            method: 'GET',
            data: queryParams
        })
        .done((response) => {
            if (response.error === false && response.data) {
                Dashboard.usersPagination = {
                    page: response.page || 1,
                    limit: response.limit || 10,
                    total_pages: response.total_pages || 1,
                    total_count: response.total_count || 0
                };
                this.render(response.data);
                this.renderPagination();
            } else {
                App.showToast('Failed to load users', 'error');
            }
        })
        .fail((xhr) => {
            let errorMsg = 'Failed to load users';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMsg = xhr.responseJSON.message;
            }
            App.showToast(errorMsg, 'error');
        })
        .always(() => {
            $('#usersLoading').hide();
        });
    },

    render: function(users) {
        const tbody = $('#usersTableBody');
        tbody.empty();

        if (users.length === 0) {
            tbody.append('<tr><td colspan="8" class="text-center p-4 text-slate-grey">No users found</td></tr>');
            return;
        }

        users.forEach((user) => {
            const row = $('<tr>');
            row.append($('<td>').text(user.users_id || '-'));
            row.append($('<td>').text(user.username || '-'));
            row.append($('<td>').text(user.full_name || '-'));
            row.append($('<td>').text(user.email || '-'));
            row.append($('<td>').text(user.phone || '-'));
            row.append($('<td>').html(
                '<span class="chip chip-' + (user.role === 'admin' ? 'success' : 'info') + '">' + 
                (user.role || 'user') + '</span>'
            ));
            row.append($('<td>').html(
                '<span class="chip chip-' + (user.is_active ? 'success' : 'error') + '">' + 
                (user.is_active ? 'Active' : 'Inactive') + '</span>'
            ));
            row.append($('<td>').html(
                '<button class="btn-tertiary btn-edit-user mr-2" data-username="' + (user.username || '') + '">Edit</button>' +
                '<button class="btn-secondary btn-delete-user" data-username="' + (user.username || '') + '">Delete</button>'
            ));
            tbody.append(row);
        });
    },

    renderPagination: function() {
        const pagination = Dashboard.usersPagination;
        const info = `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total_count)} of ${pagination.total_count} users`;
        $('#usersPaginationInfo').text(info);
        
        $('#usersPrevPage').prop('disabled', pagination.page <= 1);
        $('#usersNextPage').prop('disabled', pagination.page >= pagination.total_pages);
    },

    editUser: function(username) {
        App.showLoading();

        App.apiRequest({
            endpoint: '/user/' + username,
            method: 'GET'
        })
        .done((response) => {
            if (response.error === false && response.data) {
                const user = response.data;
                $('#editUsername').val(user.username);
                $('#editRole').val(user.role || 'user');
                $('#editFullName').val(user.full_name || '');
                $('#editEmail').val(user.email || '');
                $('#editPhone').val(user.phone || '');
                $('#editIsActive').prop('checked', user.is_active !== false);
                $('#userEditModal').fadeIn(200);
            } else {
                App.showToast('Failed to load user details', 'error');
            }
        })
        .fail(() => {
            App.showToast('Failed to load user details', 'error');
        })
        .always(() => {
            App.hideLoading();
        });
    },

    saveUser: function() {
        const username = $('#editUsername').val();
        const role = $('#editRole').val();
        const fullName = $('#editFullName').val().trim();
        const email = $('#editEmail').val().trim();
        const phone = $('#editPhone').val().trim();
        const isActive = $('#editIsActive').is(':checked');

        const updateData = {};
        if (role) updateData.role = role;
        if (fullName) updateData.full_name = fullName;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        updateData.is_active = isActive;

        App.showLoading();

        App.apiRequest({
            endpoint: '/user/' + username,
            method: 'PUT',
            data: updateData
        })
        .done((response) => {
            if (response.error === false) {
                App.showToast('User updated successfully', 'success');
                $('#userEditModal').fadeOut(200);
                this.load();
            } else {
                App.showToast('Failed to update user', 'error');
            }
        })
        .fail((xhr) => {
            let errorMsg = 'Failed to update user';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMsg = xhr.responseJSON.message;
            }
            App.showToast(errorMsg, 'error');
        })
        .always(() => {
            App.hideLoading();
        });
    },

    deleteUser: function(username) {
        if (!confirm('Are you sure you want to delete user "' + username + '"? This action cannot be undone.')) {
            return;
        }

        App.showLoading();

        App.apiRequest({
            endpoint: '/user/' + username,
            method: 'DELETE'
        })
        .done((response) => {
            if (response.error === false) {
                App.showToast('User deleted successfully', 'success');
                this.load();
            } else {
                App.showToast('Failed to delete user', 'error');
            }
        })
        .fail((xhr) => {
            let errorMsg = 'Failed to delete user';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMsg = xhr.responseJSON.message;
            }
            App.showToast(errorMsg, 'error');
        })
        .always(() => {
            App.hideLoading();
        });
    }
};

