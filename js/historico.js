// Purchase history functionality
let currentPage = 1;
const itemsPerPage = 20;
let filteredVendas = [];

document.addEventListener('DOMContentLoaded', function() {
    loadClientes();
    loadHistorico();
    setupFilters();
    
    // Check for URL parameters (customer filter)
    const urlParams = new URLSearchParams(window.location.search);
    const clienteId = urlParams.get('cliente');
    if (clienteId) {
        document.getElementById('filtro-cliente').value = clienteId;
        aplicarFiltros();
    }
});

function loadClientes() {
    const clientes = dataManager.getClientes();
    const select = document.getElementById('filtro-cliente');
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">Todos os clientes</option>';
    
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = cliente.nome;
        select.appendChild(option);
    });
}

function loadHistorico() {
    const vendas = dataManager.getVendas();
    filteredVendas = vendas.sort((a, b) => new Date(b.dataVenda) - new Date(a.dataVenda));
    
    updateStats();
    renderHistorico();
}

function setupFilters() {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    document.getElementById('filtro-data-fim').value = today.toISOString().split('T')[0];
    document.getElementById('filtro-data-inicio').value = thirtyDaysAgo.toISOString().split('T')[0];
}

function aplicarFiltros() {
    const clienteId = document.getElementById('filtro-cliente').value;
    const dataInicio = document.getElementById('filtro-data-inicio').value;
    const dataFim = document.getElementById('filtro-data-fim').value;
    
    let vendas = dataManager.getVendas();
    
    // Filter by customer
    if (clienteId) {
        vendas = vendas.filter(v => v.clienteId === clienteId);
    }
    
    // Filter by date range
    if (dataInicio) {
        const startDate = new Date(dataInicio);
        vendas = vendas.filter(v => new Date(v.dataVenda) >= startDate);
    }
    
    if (dataFim) {
        const endDate = new Date(dataFim + 'T23:59:59');
        vendas = vendas.filter(v => new Date(v.dataVenda) <= endDate);
    }
    
    filteredVendas = vendas.sort((a, b) => new Date(b.dataVenda) - new Date(a.dataVenda));
    currentPage = 1;
    
    updateStats();
    renderHistorico();
}

function limparFiltros() {
    document.getElementById('filtro-cliente').value = '';
    document.getElementById('filtro-data-inicio').value = '';
    document.getElementById('filtro-data-fim').value = '';
    
    // Remove URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    
    loadHistorico();
}

function updateStats() {
    const totalVendas = filteredVendas.length;
    const valorTotal = filteredVendas.reduce((sum, v) => sum + v.total, 0);
    const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;
    
    document.getElementById('total-vendas-count').textContent = totalVendas;
    document.getElementById('total-vendas-valor').textContent = dataManager.formatCurrency(valorTotal);
    document.getElementById('ticket-medio').textContent = dataManager.formatCurrency(ticketMedio);
}

function renderHistorico() {
    const tbody = document.getElementById('historico-table-body');
    
    if (filteredVendas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhuma venda encontrada</td></tr>';
        renderPagination(0);
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const vendasPagina = filteredVendas.slice(startIndex, endIndex);
    
    tbody.innerHTML = vendasPagina.map(venda => `
        <tr>
            <td>${venda.controle || '-'}</td>
            <td>${dataManager.formatDate(venda.dataVenda)}</td>
            <td>${venda.clienteNome}</td>
            <td>${venda.itens.length} ${venda.itens.length === 1 ? 'item' : 'itens'}</td>
            <td>${dataManager.formatCurrency(venda.total)}</td>
            <td>${formatFormaPagamento(venda.formaPagamento)}</td>
            <td>
                ${venda.notaFiscal ? 
                    `<span style="color: green;">✓ ${venda.notaFiscal.numero}</span>` : 
                    '<span style="color: #999;">Não emitida</span>'
                }
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="verDetalhesVenda('${venda.id}')">
                    Ver Detalhes
                </button>
                ${!venda.notaFiscal ? `
                    <button class="btn btn-success btn-sm" onclick="emitirNotaFiscal('${venda.id}')">
                        Emitir NF
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
    
    renderPagination(filteredVendas.length);
}

function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="pagination-container">';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="btn btn-secondary" onclick="changePage(${currentPage - 1})">Anterior</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="btn btn-primary">${i}</button>`;
        } else if (Math.abs(i - currentPage) <= 2 || i === 1 || i === totalPages) {
            paginationHTML += `<button class="btn btn-secondary" onclick="changePage(${i})">${i}</button>`;
        } else if (Math.abs(i - currentPage) === 3) {
            paginationHTML += '<span>...</span>';
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="btn btn-secondary" onclick="changePage(${currentPage + 1})">Próximo</button>`;
    }
    
    paginationHTML += '</div>';
    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    currentPage = page;
    renderHistorico();
}

function verDetalhesVenda(vendaId) {
    const venda = filteredVendas.find(v => v.id === vendaId);

    if (!venda) {
        showAlert('Venda não encontrada.', 'error');
        return;
    }

    const content = document.getElementById('venda-detail-content');
    content.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <p><strong>Data:</strong> ${dataManager.formatDate(venda.dataVenda)} às ${new Date(venda.dataVenda).toLocaleTimeString('pt-BR')}</p>
            <p><strong>Cliente:</strong> ${venda.clienteNome}</p>
            <p><strong>Forma de Pagamento:</strong> ${formatFormaPagamento(venda.formaPagamento)}</p>
            <p><strong>Total:</strong> ${dataManager.formatCurrency(venda.total)}</p>
            ${venda.observacoes ? `<p><strong>Observações:</strong> ${venda.observacoes}</p>` : ''}
            ${venda.notaFiscal ? `
                <p><strong>Nota Fiscal:</strong> ${venda.notaFiscal.numero} - Série ${venda.notaFiscal.serie}</p>
                <p><strong>Chave de Acesso:</strong> ${venda.notaFiscal.chave}</p>
            ` : ''}
        </div>
        
        <h4>Itens da Venda</h4>
        <table class="table">
            <thead>
                <tr>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Preço Unit.</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${venda.itens.map(item => `
                    <tr>
                        <td>${item.produtoCodigo} - ${item.produtoNome}</td>
                        <td>${item.quantidade}</td>
                        <td>${dataManager.formatCurrency(item.preco)}</td>
                        <td>${dataManager.formatCurrency(item.subtotal)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 1rem;">
            ${!venda.notaFiscal ? `
                <button class="btn btn-success" onclick="hideModal('venda-detail-modal'); emitirNotaFiscal('${venda.id}')">
                    Emitir Nota Fiscal
                </button>
            ` : ''}
            <button class="btn btn-secondary" onclick="hideModal('venda-detail-modal')">
                Fechar
            </button>
        </div>
    `;

    showModal('venda-detail-modal');
}

function emitirNotaFiscal(vendaId) {
    const vendas = dataManager.getVendas();
    const venda = vendas.find(v => v.id === vendaId);
    
    if (!venda) {
        showAlert('Venda não encontrada.', 'error');
        return;
    }
    
    if (venda.notaFiscal) {
        showAlert('Esta venda já possui nota fiscal emitida.', 'info');
        return;
    }
    
    // Simulate API call to third-party fiscal note service
    const notaNumero = Math.floor(Math.random() * 1000000);
    const notaSerie = 1;
    const notaChave = generateNotaFiscalKey();
    
    venda.notaFiscal = {
        numero: notaNumero,
        serie: notaSerie,
        chave: notaChave,
        dataEmissao: new Date().toISOString()
    };
    
    dataManager.saveVenda(venda);
    dataManager.logActivity(`Nota fiscal ${notaNumero} emitida para venda de ${venda.clienteNome}`);
    
    // Update the filtered vendas array
    const index = filteredVendas.findIndex(v => v.id === vendaId);
    if (index !== -1) {
        filteredVendas[index] = venda;
    }
    
    renderHistorico();
    showAlert(`Nota fiscal ${notaNumero} emitida com sucesso!`, 'success');
}

function exportarHistorico() {
    if (filteredVendas.length === 0) {
        showAlert('Nenhuma venda para exportar.', 'error');
        return;
    }
    
    // Create CSV content
    const headers = ['Data', 'Cliente', 'Forma Pagamento', 'Total', 'Itens', 'Nota Fiscal'];
    let csvContent = headers.join(',') + '\n';
    
    filteredVendas.forEach(venda => {
        const row = [
            `"${dataManager.formatDate(venda.dataVenda)}"`,
            `"${venda.clienteNome}"`,
            `"${formatFormaPagamento(venda.formaPagamento)}"`,
            venda.total.toFixed(2).replace('.', ','),
            venda.itens.length,
            venda.notaFiscal ? `"${venda.notaFiscal.numero}"` : '""'
        ];
        csvContent += row.join(',') + '\n';
    });
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historico-vendas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('Histórico exportado com sucesso!', 'success');
}

function formatFormaPagamento(forma) {
    const formas = {
        'dinheiro': 'Dinheiro',
        'cartao-debito': 'Cartão de Débito',
        'cartao-credito': 'Cartão de Crédito',
        'pix': 'PIX',
        'crediario': 'Crediário'
    };
    return formas[forma] || forma;
}

function generateNotaFiscalKey() {
    // Generate a fake 44-digit fiscal note access key
    let key = '';
    for (let i = 0; i < 44; i++) {
        key += Math.floor(Math.random() * 10);
    }
    return key;
}

// Add CSS for pagination
const style = document.createElement('style');
style.textContent = `
    .pagination-container {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        align-items: center;
    }
    
    .pagination-container button {
        padding: 0.5rem 1rem;
    }
    
    .pagination-container span {
        padding: 0.5rem;
        color: #666;
    }
`;
document.head.appendChild(style);