const Dashboard = {
    cart: [],
    items: [],
    suppliers: [],
    roles: [],
    currentUser: null,
    inventoryParams: { page: 1, limit: 10, sort: 'created_at', search: '', filters: {} },
    purchasesParams: { page: 1, limit: 10, sort: 'created_at', search: '', filters: {} },
    usersParams: { page: 1, limit: 10, sort: 'created_at', search: '', filters: {} },
    rolesParams: { page: 1, limit: 10, sort: 'created_timestamp', search: '', filters: {} },
    inventoryPagination: { page: 1, limit: 10, total_pages: 1, total_count: 0 },
    purchasesPagination: { page: 1, limit: 10, total_pages: 1, total_count: 0 },
    usersPagination: { page: 1, limit: 10, total_pages: 1, total_count: 0 },
    rolesPagination: { page: 1, limit: 10, total_pages: 1, total_count: 0 },

    init: function() {
        this.loadUserInfo();
        DashboardNavigation.setup();
        DashboardInventory.setupControls();
        DashboardPurchases.setupControls();
        DashboardUsers.setupControls();
        DashboardInventory.load();
        DashboardSuppliers.load();
        DashboardItems.load();
        DashboardPurchaseForm.setup();
        DashboardPurchases.load();
        if (this.isAdmin()) {
            DashboardUsers.load();
            DashboardRoles.setupControls();
            DashboardRoles.load();
        }
        DashboardRoles.loadForDropdowns();
    },

    loadUserInfo: function() {
        const userStr = localStorage.getItem(CONFIG.USER_KEY);
        if (userStr) {
            this.currentUser = JSON.parse(userStr);
            $('#userInfo').text('Welcome, ' + (this.currentUser.full_name || this.currentUser.username));
            if (this.isAdmin()) {
                $('#usersMenu').show();
                $('#rolesMenu').show();
            }
            if (this.canModifyItems()) {
                $('#btnCreateItem').show();
            }
        }
    },

    isAdmin: function() {
        return this.currentUser && this.currentUser.role && this.currentUser.role.toLowerCase() === 'admin';
    },

    canModifyItems: function() {
        if (!this.currentUser || !this.currentUser.role) return false;
        const role = this.currentUser.role.toUpperCase();
        return role === 'ADMIN' || role === 'MANAGER' || role === 'SUPPLIERS';
    }
};

