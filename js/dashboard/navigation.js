const DashboardNavigation = {
    setup: function() {
        $('.nav-link').on('click', function(e) {
            e.preventDefault();
            const page = $(this).data('page');
            DashboardNavigation.showPage(page);
        });
    },

    showPage: function(page) {
        $('.page-content').hide();
        $('.nav-link').removeClass('active');
        
        if (page === 'inventory') {
            $('#inventoryPage').show();
            $('[data-page="inventory"]').addClass('active');
            $('#pageTitle').text('Inventory');
            Dashboard.inventoryParams.page = 1;
            DashboardInventory.load();
        } else if (page === 'purchase') {
            $('#purchasePage').show();
            $('[data-page="purchase"]').addClass('active');
            $('#pageTitle').text('Create Purchase');
        } else if (page === 'purchases') {
            $('#purchasesPage').show();
            $('[data-page="purchases"]').addClass('active');
            $('#pageTitle').text('Purchase History');
            Dashboard.purchasesParams.page = 1;
            DashboardPurchases.load();
        } else if (page === 'users') {
            if (!Dashboard.isAdmin()) {
                App.showToast('Access denied. Admin role required.', 'error');
                return;
            }
            $('#usersPage').show();
            $('[data-page="users"]').addClass('active');
            $('#pageTitle').text('Users Management');
            Dashboard.usersParams.page = 1;
            DashboardUsers.load();
        } else if (page === 'roles') {
            if (!Dashboard.isAdmin()) {
                App.showToast('Access denied. Admin role required.', 'error');
                return;
            }
            $('#rolesPage').show();
            $('[data-page="roles"]').addClass('active');
            $('#pageTitle').text('Roles Management');
            Dashboard.rolesParams.page = 1;
            DashboardRoles.load();
        }
    }
};

