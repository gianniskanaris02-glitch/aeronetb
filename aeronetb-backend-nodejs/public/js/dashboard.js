// Load Dashboard Data
async function loadDashboard() {
    try {
        // Load KPIs
        const kpisData = await API.getKPIs();
        if (kpisData.success) {
            const kpis = kpisData.data;
            document.getElementById('kpi-active-orders').textContent = 
                kpis.procurement.active_orders;
            document.getElementById('kpi-low-stock').textContent = 
                kpis.inventory.low_stock_items;
            document.getElementById('kpi-pending-inspections').textContent = 
                kpis.quality.pending_inspections;
            document.getElementById('kpi-active-alerts').textContent = 
                kpis.iot.active_alerts;
        }
        
        // Load Recent Orders
        const ordersData = await API.getOrders({ limit: 10 });
        if (ordersData.success) {
            const tbody = document.getElementById('recent-orders-body');
            tbody.innerHTML = ordersData.data.map(order => `
                <tr>
                    <td>${order.po_number}</td>
                    <td>${order.supplier_name}</td>
                    <td>${new Date(order.order_date).toLocaleDateString()}</td>
                    <td><span class="status-badge status-${order.po_status.toLowerCase()}">${order.po_status}</span></td>
                    <td>$${parseFloat(order.total_amount).toLocaleString()}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Initialize Dashboard
if (document.getElementById('dashboard-view')) {
    loadDashboard();
}