const Dashboard = {
    cart: [],
    items: [],
    suppliers: [],
    currentUser: null,

    init: function() {
        this.loadUserInfo();
        this.setupNavigation();
        this.loadInventory();
        this.loadSuppliers();
        this.loadItems();
        this.setupPurchaseForm();
        this.loadPurchases();
    },

    loadUserInfo: function() {
        const userStr = localStorage.getItem(CONFIG.USER_KEY);
        if (userStr) {
            this.currentUser = JSON.parse(userStr);
            $('#userInfo').text('Welcome, ' + (this.currentUser.full_name || this.currentUser.username));
        }
    },

    setupNavigation: function() {
        $('.nav-link').on('click', function(e) {
            e.preventDefault();
            const page = $(this).data('page');
            Dashboard.showPage(page);
        });
    },

    showPage: function(page) {
        $('.page-content').hide();
        $('.nav-link').removeClass('active');
        
        if (page === 'inventory') {
            $('#inventoryPage').show();
            $('[data-page="inventory"]').addClass('active');
            $('#pageTitle').text('Inventory');
            this.loadInventory();
        } else if (page === 'purchase') {
            $('#purchasePage').show();
            $('[data-page="purchase"]').addClass('active');
            $('#pageTitle').text('Create Purchase');
        } else if (page === 'purchases') {
            $('#purchasesPage').show();
            $('[data-page="purchases"]').addClass('active');
            $('#pageTitle').text('Purchase History');
            this.loadPurchases();
        }
    },

    loadInventory: function() {
        $('#inventoryLoading').show();
        
        App.apiRequest({
            endpoint: '/items',
            method: 'GET'
        })
        .done((response) => {
            if (response.error === false && response.data) {
                this.items = response.data;
                this.renderInventory(response.data);
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

    renderInventory: function(items) {
        const tbody = $('#inventoryTableBody');
        tbody.empty();

        if (items.length === 0) {
            tbody.append('<tr><td colspan="7" class="text-center p-4 text-slate-grey">No items found</td></tr>');
            return;
        }

        items.forEach(item => {
            const row = $('<tr>');
            row.append($('<td>').text(item.items_id || '-'));
            row.append($('<td>').text(item.name));
            row.append($('<td>').text(item.stock || 0));
            row.append($('<td>').text(App.formatCurrency(item.price || 0)));
            row.append($('<td>').text(item.category || '-'));
            row.append($('<td>').text(item.unit || '-'));
            row.append($('<td>').text(item.min_stock || 0));
            tbody.append(row);
        });
    },

    loadSuppliers: function() {
        App.apiRequest({
            endpoint: '/suppliers',
            method: 'GET'
        })
        .done((response) => {
            if (response.error === false && response.data) {
                this.suppliers = response.data;
                console.log('Suppliers loaded:', response.data);
                this.renderSuppliers(response.data);
            } else {
                console.warn('Suppliers response error:', response);
            }
        })
        .fail((xhr) => {
            console.error('Failed to load suppliers:', xhr);
            App.showToast('Failed to load suppliers', 'error');
        });
    },

    renderSuppliers: function(suppliers) {
        const select = $('#purchaseSupplier');
        select.empty();
        select.append('<option value="">Select Supplier</option>');
        
        if (!suppliers || suppliers.length === 0) {
            console.warn('No suppliers data available');
            return;
        }
        
        console.log('Rendering suppliers, total:', suppliers.length);
        console.log('First supplier sample:', suppliers[0]);
        
        let renderedCount = 0;
        suppliers.forEach((supplier, index) => {
            if (supplier.is_active === false) {
                return;
            }
            
            const supplierId = supplier.suppliers_id;
            
            if (!supplierId || typeof supplierId !== 'string') {
                console.warn('Invalid supplier ID at index', index, ':', supplier);
                return;
            }
            
            select.append($('<option>')
                .attr('value', supplierId)
                .text(supplier.name));
            renderedCount++;
        });
        
        console.log('Total suppliers rendered:', renderedCount, 'out of', suppliers.length);
        
        if (renderedCount === 0 && suppliers.length > 0) {
            console.error('No suppliers were rendered! All suppliers may have invalid IDs.');
            console.error('Sample supplier structure:', suppliers[0]);
        }
    },

    loadItems: function() {
        App.apiRequest({
            endpoint: '/items',
            method: 'GET'
        })
        .done((response) => {
            if (response.error === false && response.data) {
                this.items = response.data;
                console.log('Items loaded:', response.data);
                this.renderItems(response.data);
            } else {
                console.warn('Items response error:', response);
            }
        })
        .fail((xhr) => {
            console.error('Failed to load items:', xhr);
            App.showToast('Failed to load items', 'error');
        });
    },

    renderItems: function(items) {
        const select = $('#purchaseItem');
        select.empty();
        select.append('<option value="">Select Item</option>');
        
        if (!items || items.length === 0) {
            console.warn('No items data available');
            return;
        }
        
        console.log('Rendering items, total:', items.length);
        console.log('First item sample:', items[0]);
        
        let renderedCount = 0;
        items.forEach((item, index) => {
            const itemId = item.items_id;
            
            if (!itemId || typeof itemId !== 'string') {
                console.warn('Invalid item ID at index', index, ':', item);
                return;
            }
            
            select.append($('<option>')
                .attr('value', itemId)
                .attr('data-price', item.price || 0)
                .attr('data-stock', item.stock || 0)
                .text(item.name + ' (Stock: ' + (item.stock || 0) + ')'));
            renderedCount++;
        });
        
        console.log('Total items rendered:', renderedCount, 'out of', items.length);
        
        if (renderedCount === 0 && items.length > 0) {
            console.error('No items were rendered! All items may have invalid IDs.');
            console.error('Sample item structure:', items[0]);
        }
    },

    setupPurchaseForm: function() {
        $('#purchaseDate').val(new Date().toISOString().split('T')[0]);

        $('#btnAddToCart').on('click', () => {
            const itemId = $('#purchaseItem').val();
            const qty = parseInt($('#purchaseQty').val());

            if (!itemId || itemId === '') {
                App.showToast('Please select an item', 'error');
                return;
            }

            if (!qty || isNaN(qty) || qty < 1) {
                App.showToast('Please enter a valid quantity', 'error');
                return;
            }

            const selectedOption = $('#purchaseItem option:selected');
            const price = parseFloat(selectedOption.data('price'));
            const stock = parseInt(selectedOption.data('stock'));

            if (isNaN(price) || price <= 0) {
                App.showToast('Invalid item price', 'error');
                return;
            }

            if (qty > stock) {
                App.showToast('Quantity exceeds available stock', 'error');
                return;
            }

            const item = this.items.find(i => i.items_id === itemId);
            if (!item) {
                App.showToast('Item not found', 'error');
                return;
            }

            const existingIndex = this.cart.findIndex(c => c.item_id === itemId);
            if (existingIndex >= 0) {
                this.cart[existingIndex].qty += qty;
                if (this.cart[existingIndex].qty > stock) {
                    App.showToast('Total quantity exceeds available stock', 'error');
                    this.cart[existingIndex].qty -= qty;
                    return;
                }
            } else {
                this.cart.push({
                    item_id: itemId,
                    qty: qty,
                    price: price,
                    item_name: item.name
                });
            }

            this.renderCart();
            $('#purchaseItem').val('');
            $('#purchaseQty').val('');
        });

        $('#btnSubmitOrder').on('click', () => {
            this.submitOrder();
        });

        $(document).on('click', '.btn-remove-item', (e) => {
            const index = $(e.target).data('index');
            this.cart.splice(index, 1);
            this.renderCart();
        });
    },

    renderCart: function() {
        const tbody = $('#cartTableBody');
        tbody.empty();

        if (this.cart.length === 0) {
            tbody.append('<tr><td colspan="5" class="text-center p-4 text-slate-grey">Cart is empty</td></tr>');
            $('#cartGrandTotal').text('Rp 0');
            return;
        }

        let grandTotal = 0;

        this.cart.forEach((item, index) => {
            const subtotal = item.qty * item.price;
            grandTotal += subtotal;

            const row = $('<tr>');
            row.append($('<td>').text(item.item_name));
            row.append($('<td>').text(item.qty));
            row.append($('<td>').text(App.formatCurrency(item.price)));
            row.append($('<td>').text(App.formatCurrency(subtotal)));
            row.append($('<td>').html(
                '<button class="btn-secondary btn-remove-item" data-index="' + index + '">Hapus</button>'
            ));
            tbody.append(row);
        });

        $('#cartGrandTotal').text(App.formatCurrency(grandTotal));
    },

    submitOrder: function() {
        const supplierSelect = $('#purchaseSupplier');
        const supplierId = supplierSelect.val();
        const date = $('#purchaseDate').val();
        const notes = $('#purchaseNotes').val().trim();

        if (!supplierId || supplierId === '') {
            App.showToast('Please select a supplier', 'error');
            supplierSelect.focus();
            return;
        }

        if (this.cart.length === 0) {
            App.showToast('Cart is empty', 'error');
            return;
        }

        if (!this.currentUser) {
            App.showToast('User information not found', 'error');
            return;
        }

        const userId = this.currentUser.users_id || this.currentUser.id;
        
        if (!userId || typeof userId !== 'string') {
            App.hideLoading();
            App.showToast('User ID not available', 'error');
            return;
        }

        const invalidItems = this.cart.filter(item => !item.item_id || typeof item.item_id !== 'string');
        if (invalidItems.length > 0) {
            App.showToast('Invalid items in cart. Please remove and re-add them.', 'error');
            return;
        }

        App.showLoading();

        const details = this.cart.map(item => ({
            item_id: item.item_id,
            qty: parseInt(item.qty)
        })).filter(detail => detail.item_id && detail.qty > 0);

        if (details.length === 0) {
            App.hideLoading();
            App.showToast('No valid items in cart', 'error');
            return;
        }

        const orderData = {
            date: date,
            supplier_id: supplierId,
            user_id: userId,
            status: 'pending',
            notes: notes || '',
            details: details
        };

        App.apiRequest({
            endpoint: '/purchasings',
            method: 'POST',
            data: orderData
        })
        .done((response) => {
            if (response.error === false) {
                App.showToast('Order submitted successfully!', 'success');
                this.cart = [];
                this.renderCart();
                $('#purchaseSupplier').val('');
                $('#purchaseNotes').val('');
                $('#purchaseDate').val(new Date().toISOString().split('T')[0]);
            } else {
                App.showToast('Failed to submit order', 'error');
            }
        })
        .fail((xhr) => {
            let errorMsg = 'Failed to submit order';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMsg = xhr.responseJSON.message;
            }
            App.showToast(errorMsg, 'error');
        })
        .always(() => {
            App.hideLoading();
        });
    },

    loadPurchases: function() {
        $('#purchasesLoading').show();
        
        App.apiRequest({
            endpoint: '/purchasings',
            method: 'GET'
        })
        .done((response) => {
            if (response.error === false && response.data) {
                this.renderPurchases(response.data);
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

    renderPurchases: function(purchases) {
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

    viewPurchaseDetail: function(purchaseId) {
        App.showLoading();

        App.apiRequest({
            endpoint: '/purchasings/' + purchaseId,
            method: 'GET'
        })
        .done((response) => {
            if (response.error === false && response.data) {
                this.renderPurchaseDetail(response.data);
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

    renderPurchaseDetail: function(purchase) {
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
            html += '<div><strong>Items:</strong></div>';
            html += '<table class="w-full border-collapse border border-slate-grey mt-2">';
            html += '<thead class="bg-slate-grey text-white"><tr>';
            html += '<th class="border border-slate-grey p-2 text-left">Item</th>';
            html += '<th class="border border-slate-grey p-2 text-left">Qty</th>';
            html += '<th class="border border-slate-grey p-2 text-left">Subtotal</th>';
            html += '</tr></thead><tbody>';
            
            purchase.details.forEach(detail => {
                html += '<tr>';
                html += '<td class="border border-slate-grey p-2">' + (detail.item_name || 'Item #' + (detail.item_id || '-')) + '</td>';
                html += '<td class="border border-slate-grey p-2">' + (detail.qty || 0) + '</td>';
                html += '<td class="border border-slate-grey p-2">' + App.formatCurrency(detail.subtotal || 0) + '</td>';
                html += '</tr>';
            });
            
            html += '</tbody></table>';
        }

        html += '</div>';
        $('#purchaseDetailContent').html(html);
    }
};

$(document).ready(function() {
    if (window.location.pathname.includes('dashboard.html')) {
        Dashboard.init();
    }

    $('#closePurchaseDetail').on('click', function() {
        $('#purchaseDetailModal').fadeOut(200);
    });

    $(document).on('click', '.modal-overlay', function(e) {
        if ($(e.target).hasClass('modal-overlay')) {
            $('#purchaseDetailModal').fadeOut(200);
        }
    });

    $(document).on('click', '.btn-view-detail', function(e) {
        const purchaseId = $(e.target).data('id');
        Dashboard.viewPurchaseDetail(purchaseId);
    });
});

