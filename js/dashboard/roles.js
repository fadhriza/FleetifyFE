const DashboardRoles = {
    setupControls: function() {
        let searchTimeout;
        $('#rolesSearch').on('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                Dashboard.rolesParams.search = $('#rolesSearch').val();
                Dashboard.rolesParams.page = 1;
                this.load();
            }, 500);
        });

        $('#rolesSort').on('change', () => {
            Dashboard.rolesParams.sort = $('#rolesSort').val();
            Dashboard.rolesParams.page = 1;
            this.load();
        });

        $('#rolesLimit').on('change', () => {
            Dashboard.rolesParams.limit = parseInt($('#rolesLimit').val());
            Dashboard.rolesParams.page = 1;
            this.load();
        });

        $(document).on('click', '#rolesPrevPage', () => {
            if (Dashboard.rolesParams.page > 1) {
                Dashboard.rolesParams.page--;
                this.load();
            }
        });

        $(document).on('click', '#rolesNextPage', () => {
            if (Dashboard.rolesParams.page < Dashboard.rolesPagination.total_pages) {
                Dashboard.rolesParams.page++;
                this.load();
            }
        });

        $(document).on('click', '.btn-edit-role', (e) => {
            const roleOid = $(e.target).data('oid');
            this.editRole(roleOid);
        });

        $('#btnCreateRole').on('click', () => {
            $('#roleEditModal').fadeIn(200);
            $('#roleEditForm')[0].reset();
            $('#editRoleOid').val('');
            $('#editRoleOid').prop('disabled', false);
            $('#roleModalTitle').text('Create Role');
        });

        $('#btnSaveRole').on('click', () => {
            this.saveRole();
        });

        $('#btnCancelRole, #closeRoleEdit').on('click', () => {
            $('#roleEditModal').fadeOut(200);
        });
    },

    load: function() {
        if (!Dashboard.isAdmin()) {
            return;
        }

        $('#rolesLoading').show();
        
        const queryParams = QueryBuilder.buildQueryParams(Dashboard.rolesParams);
        
        App.apiRequest({
            endpoint: '/roles',
            method: 'GET',
            data: queryParams
        })
        .done((response) => {
            if (response.error === false && response.data) {
                Dashboard.roles = response.data;
                Dashboard.rolesPagination = {
                    page: response.page || 1,
                    limit: response.limit || 10,
                    total_pages: response.total_pages || 1,
                    total_count: response.total_count || 0
                };
                this.render(response.data);
                this.renderPagination();
            } else {
                App.showToast('Failed to load roles', 'error');
            }
        })
        .fail((xhr) => {
            let errorMsg = 'Failed to load roles';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMsg = xhr.responseJSON.message;
            }
            App.showToast(errorMsg, 'error');
        })
        .always(() => {
            $('#rolesLoading').hide();
        });
    },

    loadForDropdowns: function() {
        App.apiRequest({
            endpoint: '/roles',
            method: 'GET',
            data: { page: 1, limit: 100 }
        })
        .done((response) => {
            if (response.error === false && response.data) {
                this.populateDropdowns(response.data);
            }
        })
        .fail(() => {
            console.warn('Failed to load roles for dropdowns');
        });
    },

    populateDropdowns: function(roles) {
        const roleOptions = roles.map(role => ({
            value: role.role_oid.toLowerCase(),
            text: role.role_name || role.role_oid
        }));

        $('#regRole').empty();
        $('#regRole').append('<option value="">Select Role</option>');
        roleOptions.forEach(opt => {
            $('#regRole').append($('<option>').val(opt.value).text(opt.text));
        });

        $('#editRole').empty();
        $('#editRole').append('<option value="">Select Role</option>');
        roleOptions.forEach(opt => {
            $('#editRole').append($('<option>').val(opt.value).text(opt.text));
        });

        $('#usersFilterRole').empty();
        $('#usersFilterRole').append('<option value="">All Roles</option>');
        roleOptions.forEach(opt => {
            $('#usersFilterRole').append($('<option>').val(opt.value).text(opt.text));
        });
    },

    render: function(roles) {
        const tbody = $('#rolesTableBody');
        tbody.empty();

        if (roles.length === 0) {
            tbody.append('<tr><td colspan="5" class="text-center p-4 text-slate-grey">No roles found</td></tr>');
            return;
        }

        roles.forEach((role) => {
            const row = $('<tr>');
            row.append($('<td>').text(role.roles_id || '-'));
            row.append($('<td>').text(role.role_oid || '-'));
            row.append($('<td>').text(role.role_name || '-'));
            row.append($('<td>').text(role.role_description || '-'));
            row.append($('<td>').html(
                '<button class="btn-tertiary btn-edit-role" data-oid="' + (role.role_oid || '') + '">Edit</button>'
            ));
            tbody.append(row);
        });
    },

    renderPagination: function() {
        const pagination = Dashboard.rolesPagination;
        const info = `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total_count)} of ${pagination.total_count} roles`;
        $('#rolesPaginationInfo').text(info);
        
        $('#rolesPrevPage').prop('disabled', pagination.page <= 1);
        $('#rolesNextPage').prop('disabled', pagination.page >= pagination.total_pages);
    },

    editRole: function(roleOid) {
        App.showLoading();

        App.apiRequest({
            endpoint: '/roles/' + roleOid,
            method: 'GET'
        })
        .done((response) => {
            if (response.error === false && response.data) {
                const role = response.data;
                $('#editRoleOid').val(role.role_oid);
                $('#editRoleOid').prop('disabled', true);
                $('#editRoleName').val(role.role_name || '');
                $('#editRoleDescription').val(role.role_description || '');
                $('#roleModalTitle').text('Edit Role');
                $('#roleEditModal').fadeIn(200);
            } else {
                App.showToast('Failed to load role details', 'error');
            }
        })
        .fail(() => {
            App.showToast('Failed to load role details', 'error');
        })
        .always(() => {
            App.hideLoading();
        });
    },

    saveRole: function() {
        const roleOid = $('#editRoleOid').val().trim();
        const roleName = $('#editRoleName').val().trim();
        const roleDescription = $('#editRoleDescription').val().trim();

        if (!roleOid || !roleName) {
            App.showToast('Role OID and Name are required', 'error');
            return;
        }

        const isEdit = $('#editRoleOid').prop('disabled');
        const updateData = {
            role_name: roleName
        };
        if (roleDescription) {
            updateData.role_description = roleDescription;
        }

        App.showLoading();

        if (isEdit) {
            App.apiRequest({
                endpoint: '/roles/' + roleOid,
                method: 'PUT',
                data: updateData
            })
            .done((response) => {
                if (response.error === false) {
                    App.showToast('Role updated successfully', 'success');
                    $('#roleEditModal').fadeOut(200);
                    this.load();
                } else {
                    App.showToast('Failed to update role', 'error');
                }
            })
            .fail((xhr) => {
                let errorMsg = 'Failed to update role';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                App.showToast(errorMsg, 'error');
            })
            .always(() => {
                App.hideLoading();
            });
        } else {
            const createData = {
                role_oid: roleOid,
                role_name: roleName
            };
            if (roleDescription) {
                createData.role_description = roleDescription;
            }

            App.apiRequest({
                endpoint: '/roles',
                method: 'POST',
                data: createData
            })
            .done((response) => {
                if (response.error === false) {
                    App.showToast('Role created successfully', 'success');
                    $('#roleEditModal').fadeOut(200);
                    this.load();
                    this.loadForDropdowns();
                } else {
                    App.showToast('Failed to create role', 'error');
                }
            })
            .fail((xhr) => {
                let errorMsg = 'Failed to create role';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                App.showToast(errorMsg, 'error');
            })
            .always(() => {
                App.hideLoading();
            });
        }
    }
};

