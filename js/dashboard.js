// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    updateDashboard();
    loadRecentActivities();
});

function updateDashboard() {
    const stats = dataManager.getDashboardStats();
    
    // Update dashboard cards
    document.getElementById('total-produtos').textContent = stats.totalProdutos;
    document.getElementById('vendas-hoje').textContent = dataManager.formatCurrency(stats.vendasHoje);
    document.getElementById('total-clientes').textContent = stats.totalClientes;
    document.getElementById('total-crediario').textContent = dataManager.formatCurrency(stats.totalCrediario);
}

function loadRecentActivities() {
    const activities = dataManager.getRecentActivities(5);
    const container = document.getElementById('atividades-recentes');
    
    if (activities.length === 0) {
        container.innerHTML = '<p>Nenhuma atividade recente</p>';
        return;
    }
    
    const activitiesList = activities.map(activity => `
        <div class="activity-item" style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">
            <div style="font-weight: bold;">${activity.activity}</div>
            <div style="font-size: 0.9rem; color: #666;">
                ${dataManager.formatDate(activity.timestamp)} às ${new Date(activity.timestamp).toLocaleTimeString('pt-BR')}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = activitiesList;
}