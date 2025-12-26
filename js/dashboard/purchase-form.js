const DashboardPurchaseForm = {
    setup: function() {
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

            const item = Dashboard.items.find(i => i.items_id === itemId);
            if (!item) {
                App.showToast('Item not found', 'error');
                return;
            }

            const existingIndex = Dashboard.cart.findIndex(c => c.item_id === itemId);
            if (existingIndex >= 0) {
                Dashboard.cart[existingIndex].qty += qty;
                if (Dashboard.cart[existingIndex].qty > stock) {
                    App.showToast('Total quantity exceeds available stock', 'error');
                    Dashboard.cart[existingIndex].qty -= qty;
                    return;
                }
            } else {
                Dashboard.cart.push({
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
            Dashboard.cart.splice(index, 1);
            this.renderCart();
        });
    },

    renderCart: function() {
        const tbody = $('#cartTableBody');
        tbody.empty();

        if (Dashboard.cart.length === 0) {
            tbody.append('<tr><td colspan="5" class="text-center p-4 text-slate-grey">Cart is empty</td></tr>');
            $('#cartGrandTotal').text('Rp 0');
            return;
        }

        let grandTotal = 0;

        Dashboard.cart.forEach((item, index) => {
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

        if (Dashboard.cart.length === 0) {
            App.showToast('Cart is empty', 'error');
            return;
        }

        if (!Dashboard.currentUser) {
            App.showToast('User information not found', 'error');
            return;
        }

        const userId = Dashboard.currentUser.users_id || Dashboard.currentUser.id;
        
        if (!userId || typeof userId !== 'string') {
            App.hideLoading();
            App.showToast('User ID not available', 'error');
            return;
        }

        const invalidItems = Dashboard.cart.filter(item => !item.item_id || typeof item.item_id !== 'string');
        if (invalidItems.length > 0) {
            App.showToast('Invalid items in cart. Please remove and re-add them.', 'error');
            return;
        }

        App.showLoading();

        const details = Dashboard.cart.map(item => ({
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
                Dashboard.cart = [];
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
    }
};

