const DashboardItems = {
    load: function() {
        const queryParams = QueryBuilder.buildQueryParams({ page: 1, limit: 100 });
        
        App.apiRequest({
            endpoint: '/items',
            method: 'GET',
            data: queryParams
        })
        .done((response) => {
            if (response.error === false && response.data) {
                Dashboard.items = response.data;
                console.log('Items loaded:', response.data);
                this.render(response.data);
            } else {
                console.warn('Items response error:', response);
            }
        })
        .fail((xhr) => {
            console.error('Failed to load items:', xhr);
            App.showToast('Failed to load items', 'error');
        });
    },

    render: function(items) {
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
    }
};

