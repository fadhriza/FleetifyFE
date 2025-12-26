const DashboardInventory = {
    setupControls: function() {
        let searchTimeout;
        $('#inventorySearch').on('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                Dashboard.inventoryParams.search = $('#inventorySearch').val();
                Dashboard.inventoryParams.page = 1;
                this.load();
            }, 500);
        });

        $('#inventorySort').on('change', () => {
            Dashboard.inventoryParams.sort = $('#inventorySort').val();
            Dashboard.inventoryParams.page = 1;
            this.load();
        });

        $('#inventoryFilterCategory').on('change', () => {
            const value = $('#inventoryFilterCategory').val();
            if (value) {
                Dashboard.inventoryParams.filters.category = value;
            } else {
                delete Dashboard.inventoryParams.filters.category;
            }
            Dashboard.inventoryParams.page = 1;
            this.load();
        });

        $('#inventoryFilterUnit').on('change', () => {
            const value = $('#inventoryFilterUnit').val();
            if (value) {
                Dashboard.inventoryParams.filters.unit = value;
            } else {
                delete Dashboard.inventoryParams.filters.unit;
            }
            Dashboard.inventoryParams.page = 1;
            this.load();
        });

        $('#inventoryLimit').on('change', () => {
            Dashboard.inventoryParams.limit = parseInt($('#inventoryLimit').val());
            Dashboard.inventoryParams.page = 1;
            this.load();
        });

        $(document).on('click', '#inventoryPrevPage', () => {
            if (Dashboard.inventoryParams.page > 1) {
                Dashboard.inventoryParams.page--;
                this.load();
            }
        });

        $(document).on('click', '#inventoryNextPage', () => {
            if (Dashboard.inventoryParams.page < Dashboard.inventoryPagination.total_pages) {
                Dashboard.inventoryParams.page++;
                this.load();
            }
        });

        $(document).on('click', '.btn-edit-item', (e) => {
            const itemId = $(e.target).data('id');
            this.editItem(itemId);
        });

        $(document).on('click', '.btn-delete-item', (e) => {
            const itemId = $(e.target).data('id');
            this.deleteItem(itemId);
        });

        $('#btnCreateItem').on('click', () => {
            $('#itemEditModal').fadeIn(200);
            $('#itemEditForm')[0].reset();
            $('#editItemId').val('');
            $('#itemModalTitle').text('Create Item');
        });

        $('#btnSaveItem').on('click', () => {
            this.saveItem();
        });

        $('#btnCancelItem, #closeItemEdit').on('click', () => {
            $('#itemEditModal').fadeOut(200);
        });
    },

    load: function() {
        $('#inventoryLoading').show();
        
        const queryParams = QueryBuilder.buildQueryParams(Dashboard.inventoryParams);
        
        App.apiRequest({
            endpoint: '/items',
            method: 'GET',
            data: queryParams
        })
        .done((response) => {
            if (response.error === false && response.data) {
                Dashboard.items = response.data;
                Dashboard.inventoryPagination = {
                    page: response.page || 1,
                    limit: response.limit || 10,
                    total_pages: response.total_pages || 1,
                    total_count: response.total_count || 0
                };
                this.render(response.data);
                this.renderPagination();
            } else {
                App.showToast('Failed to load inventory', 'error');
            }
        })
        .fail((xhr) => {
            let errorMsg = 'Failed to load inventory';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMsg = xhr.responseJSON.message;
            }
            App.showToast(errorMsg, 'error');
        })
        .always(() => {
            $('#inventoryLoading').hide();
        });
    },

    render: function(items) {
        const tbody = $('#inventoryTableBody');
        tbody.empty();

        if (items.length === 0) {
            tbody.append('<tr><td colspan="8" class="text-center p-4 text-slate-grey">No items found</td></tr>');
            return;
        }

        const categories = new Set();
        const units = new Set();
        const canModify = Dashboard.canModifyItems();

        items.forEach(item => {
            const row = $('<tr>');
            row.append($('<td>').text(item.items_id || '-'));
            row.append($('<td>').text(item.name));
            row.append($('<td>').text(item.stock || 0));
            row.append($('<td>').text(App.formatCurrency(item.price || 0)));
            row.append($('<td>').text(item.category || '-'));
            row.append($('<td>').text(item.unit || '-'));
            row.append($('<td>').text(item.min_stock || 0));
            
            const actionsCell = $('<td>');
            if (canModify) {
                actionsCell.html(
                    '<div class="flex items-center gap-2">' +
                    '<button class="btn-tertiary btn-icon btn-edit-item" data-id="' + (item.items_id || '') + '" title="Edit"><i class="ri-edit-line"></i></button>' +
                    '<button class="btn-secondary btn-icon btn-delete-item" data-id="' + (item.items_id || '') + '" title="Delete"><i class="ri-delete-bin-line"></i></button>' +
                    '</div>'
                );
            } else {
                actionsCell.html('<span class="text-slate-grey text-sm">No actions</span>');
            }
            row.append(actionsCell);
            tbody.append(row);

            if (item.category) categories.add(item.category);
            if (item.unit) units.add(item.unit);
        });

        this.populateFilterOptions('inventoryFilterCategory', Array.from(categories).sort());
        this.populateFilterOptions('inventoryFilterUnit', Array.from(units).sort());
    },

    populateFilterOptions: function(selectId, options) {
        const select = $('#' + selectId);
        const currentValue = select.val();
        const firstOption = select.find('option:first');
        
        select.empty();
        select.append(firstOption);
        
        options.forEach(option => {
            select.append($('<option>').val(option).text(option));
        });
        
        if (currentValue && options.includes(currentValue)) {
            select.val(currentValue);
        }
    },

    renderPagination: function() {
        const pagination = Dashboard.inventoryPagination;
        const info = `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total_count)} of ${pagination.total_count} items`;
        $('#inventoryPaginationInfo').text(info);
        
        $('#inventoryPrevPage').prop('disabled', pagination.page <= 1);
        $('#inventoryNextPage').prop('disabled', pagination.page >= pagination.total_pages);
    },

    editItem: function(itemId) {
        App.showLoading();

        App.apiRequest({
            endpoint: '/items/' + itemId,
            method: 'GET'
        })
        .done((response) => {
            if (response.error === false && response.data) {
                const item = response.data;
                $('#editItemId').val(item.items_id);
                $('#editItemName').val(item.name || '');
                $('#editItemStock').val(item.stock || 0);
                $('#editItemPrice').val(item.price || 0);
                $('#editItemCategory').val(item.category || '');
                $('#editItemUnit').val(item.unit || '');
                $('#editItemMinStock').val(item.min_stock || 0);
                $('#itemModalTitle').text('Edit Item');
                $('#itemEditModal').fadeIn(200);
            } else {
                App.showToast('Failed to load item details', 'error');
            }
        })
        .fail(() => {
            App.showToast('Failed to load item details', 'error');
        })
        .always(() => {
            App.hideLoading();
        });
    },

    saveItem: function() {
        if (!Dashboard.canModifyItems()) {
            App.showToast('You do not have permission to modify items', 'error');
            return;
        }

        const itemId = $('#editItemId').val();
        const name = $('#editItemName').val().trim();
        const stock = parseInt($('#editItemStock').val()) || 0;
        const price = parseFloat($('#editItemPrice').val()) || 0;
        const category = $('#editItemCategory').val().trim();
        const unit = $('#editItemUnit').val().trim();
        const minStock = parseInt($('#editItemMinStock').val()) || 0;

        if (!name) {
            App.showToast('Item name is required', 'error');
            return;
        }

        const isEdit = itemId && itemId !== '';
        const itemData = {
            name: name,
            stock: stock,
            price: price,
            category: category,
            unit: unit,
            min_stock: minStock
        };

        App.showLoading();

        if (isEdit) {
            App.apiRequest({
                endpoint: '/items/' + itemId,
                method: 'PUT',
                data: itemData
            })
            .done((response) => {
                if (response.error === false) {
                    App.showToast('Item updated successfully', 'success');
                    $('#itemEditModal').fadeOut(200);
                    this.load();
                    DashboardItems.load();
                } else {
                    App.showToast('Failed to update item', 'error');
                }
            })
            .fail((xhr) => {
                let errorMsg = 'Failed to update item';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                if (xhr.status === 403) {
                    errorMsg = 'You do not have permission to update items';
                }
                App.showToast(errorMsg, 'error');
            })
            .always(() => {
                App.hideLoading();
            });
        } else {
            App.apiRequest({
                endpoint: '/items',
                method: 'POST',
                data: itemData
            })
            .done((response) => {
                if (response.error === false) {
                    App.showToast('Item created successfully', 'success');
                    $('#itemEditModal').fadeOut(200);
                    this.load();
                    DashboardItems.load();
                } else {
                    App.showToast('Failed to create item', 'error');
                }
            })
            .fail((xhr) => {
                let errorMsg = 'Failed to create item';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                if (xhr.status === 403) {
                    errorMsg = 'You do not have permission to create items';
                }
                App.showToast(errorMsg, 'error');
            })
            .always(() => {
                App.hideLoading();
            });
        }
    },

    deleteItem: function(itemId) {
        if (!Dashboard.canModifyItems()) {
            App.showToast('You do not have permission to delete items', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
            return;
        }

        App.showLoading();

        App.apiRequest({
            endpoint: '/items/' + itemId,
            method: 'DELETE'
        })
        .done((response) => {
            if (response.error === false) {
                App.showToast('Item deleted successfully', 'success');
                this.load();
                DashboardItems.load();
            } else {
                App.showToast('Failed to delete item', 'error');
            }
        })
        .fail((xhr) => {
            let errorMsg = 'Failed to delete item';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMsg = xhr.responseJSON.message;
            }
            if (xhr.status === 403) {
                errorMsg = 'You do not have permission to delete items';
            }
            App.showToast(errorMsg, 'error');
        })
        .always(() => {
            App.hideLoading();
        });
    }
};

