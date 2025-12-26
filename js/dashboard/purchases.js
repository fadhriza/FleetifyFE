const DashboardPurchases = {
    setupControls: function() {
        let searchTimeout;
        $('#purchasesSearch').on('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                Dashboard.purchasesParams.search = $('#purchasesSearch').val();
                Dashboard.purchasesParams.page = 1;
                this.load();
            }, 500);
        });

        $('#purchasesSort').on('change', () => {
            Dashboard.purchasesParams.sort = $('#purchasesSort').val();
            Dashboard.purchasesParams.page = 1;
            this.load();
        });

        $('#purchasesFilterStatus').on('change', () => {
            const value = $('#purchasesFilterStatus').val();
            if (value) {
                Dashboard.purchasesParams.filters.status = value;
            } else {
                delete Dashboard.purchasesParams.filters.status;
            }
            Dashboard.purchasesParams.page = 1;
            this.load();
        });

        $('#purchasesLimit').on('change', () => {
            Dashboard.purchasesParams.limit = parseInt($('#purchasesLimit').val());
            Dashboard.purchasesParams.page = 1;
            this.load();
        });

        $(document).on('click', '#purchasesPrevPage', () => {
            if (Dashboard.purchasesParams.page > 1) {
                Dashboard.purchasesParams.page--;
                this.load();
            }
        });

        $(document).on('click', '#purchasesNextPage', () => {
            if (Dashboard.purchasesParams.page < Dashboard.purchasesPagination.total_pages) {
                Dashboard.purchasesParams.page++;
                this.load();
            }
        });
    },

    load: function() {
        $('#purchasesLoading').show();
        
        const queryParams = QueryBuilder.buildQueryParams(Dashboard.purchasesParams);
        
        App.apiRequest({
            endpoint: '/purchasings',
            method: 'GET',
            data: queryParams
        })
        .done((response) => {
            if (response.error === false && response.data) {
                Dashboard.purchasesPagination = {
                    page: response.page || 1,
                    limit: response.limit || 10,
                    total_pages: response.total_pages || 1,
                    total_count: response.total_count || 0
                };
                this.render(response.data);
                this.renderPagination();
            } else {
                App.showToast('Failed to load purchases', 'error');
            }
        })
        .fail((xhr) => {
            let errorMsg = 'Failed to load purchases';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMsg = xhr.responseJSON.message;
            }
            App.showToast(errorMsg, 'error');
        })
        .always(() => {
            $('#purchasesLoading').hide();
        });
    },

    render: function(purchases) {
        const tbody = $('#purchasesTableBody');
        tbody.empty();

        if (purchases.length === 0) {
            tbody.append('<tr><td colspan="6" class="text-center p-4 text-slate-grey">No purchases found</td></tr>');
            return;
        }

        purchases.forEach((purchase, index) => {
            const row = $('<tr>');
            row.append($('<td>').text(purchase.purchasings_id || '-'));
            row.append($('<td>').text(purchase.date || '-'));
            row.append($('<td>').text(purchase.supplier_name || '-'));
            row.append($('<td>').html(
                '<span class="chip chip-' + (purchase.status === 'approved' ? 'success' : 'warning') + '">' + 
                (purchase.status || 'pending') + '</span>'
            ));
            row.append($('<td>').text(App.formatCurrency(purchase.grand_total || 0)));
            row.append($('<td>').html(
                '<button class="btn-tertiary btn-view-detail" data-id="' + (purchase.purchasings_id || '') + '">View</button>'
            ));
            tbody.append(row);
        });
    },

    renderPagination: function() {
        const pagination = Dashboard.purchasesPagination;
        const info = `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total_count)} of ${pagination.total_count} purchases`;
        $('#purchasesPaginationInfo').text(info);
        
        $('#purchasesPrevPage').prop('disabled', pagination.page <= 1);
        $('#purchasesNextPage').prop('disabled', pagination.page >= pagination.total_pages);
    },

    viewDetail: function(purchaseId) {
        App.showLoading();

        App.apiRequest({
            endpoint: '/purchasings/' + purchaseId,
            method: 'GET'
        })
        .done((response) => {
            if (response.error === false && response.data) {
                this.renderDetail(response.data);
                $('#purchaseDetailModal').fadeIn(200);
            } else {
                App.showToast('Failed to load purchase details', 'error');
            }
        })
        .fail(() => {
            App.showToast('Failed to load purchase details', 'error');
        })
        .always(() => {
            App.hideLoading();
        });
    },

    renderDetail: function(purchase) {
        let html = '<div class="space-y-4">';
        html += '<div><strong>ID:</strong> ' + (purchase.purchasings_id || '-') + '</div>';
        html += '<div><strong>Date:</strong> ' + (purchase.date || '-') + '</div>';
        html += '<div><strong>Supplier:</strong> ' + (purchase.supplier_name || '-') + '</div>';
        html += '<div><strong>Status:</strong> <span class="chip chip-' + (purchase.status === 'approved' ? 'success' : 'warning') + '">' + (purchase.status || 'pending') + '</span></div>';
        html += '<div><strong>Grand Total:</strong> ' + App.formatCurrency(purchase.grand_total || 0) + '</div>';
        
        if (purchase.notes) {
            html += '<div><strong>Notes:</strong> ' + purchase.notes + '</div>';
        }

        if (purchase.details && purchase.details.length > 0) {
            html += '<div class="mt-4"><strong>Items:</strong></div>';
            html += '<div class="overflow-x-auto mt-2"><table>';
            html += '<thead><tr>';
            html += '<th>Item</th>';
            html += '<th>Qty</th>';
            html += '<th>Subtotal</th>';
            html += '</tr></thead><tbody>';
            
            purchase.details.forEach(detail => {
                html += '<tr>';
                html += '<td>' + (detail.item_name || 'Item #' + (detail.item_id || '-')) + '</td>';
                html += '<td>' + (detail.qty || 0) + '</td>';
                html += '<td>' + App.formatCurrency(detail.subtotal || 0) + '</td>';
                html += '</tr>';
            });
            
            html += '</tbody></table></div>';
        }

        html += '</div>';
        $('#purchaseDetailContent').html(html);
    }
};

