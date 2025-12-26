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
            $('#userEditModal').fadeOut(200);
            $('#roleEditModal').fadeOut(200);
            $('#itemEditModal').fadeOut(200);
        }
    });

    $(document).on('click', '.btn-view-detail', function(e) {
        const purchaseId = $(e.target).data('id');
        DashboardPurchases.viewDetail(purchaseId);
    });
});
