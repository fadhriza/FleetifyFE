const DashboardSuppliers = {
    load: function() {
        const queryParams = QueryBuilder.buildQueryParams({ page: 1, limit: 100, filters: { is_active: 'true' } });
        
        App.apiRequest({
            endpoint: '/suppliers',
            method: 'GET',
            data: queryParams
        })
        .done((response) => {
            if (response.error === false && response.data) {
                Dashboard.suppliers = response.data;
                console.log('Suppliers loaded:', response.data);
                this.render(response.data);
            } else {
                console.warn('Suppliers response error:', response);
            }
        })
        .fail((xhr) => {
            console.error('Failed to load suppliers:', xhr);
            App.showToast('Failed to load suppliers', 'error');
        });
    },

    render: function(suppliers) {
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
    }
};

