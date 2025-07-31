// Credit management functionality
let filteredCrediario = [];

document.addEventListener('DOMContentLoaded', function() {
    loadClientesCrediario();
    loadCrediario();
    setupCrediarioForm();
    setupPagamentoForm();
});

function loadClientesCrediario() {
    const clientes = dataManager.getClientes();
    const selects = ['crediario-cliente', 'filtro-cliente-crediario'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        const isFilter = selectId.includes('filtro');
        
        select.innerHTML = isFilter ? 
            '<option value="">Todos os clientes</option>' : 
            '<option value="">Selecione um cliente</option>';
        
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.nome;
            select.appendChild(option);
        });
    });
}

function loadCrediario() {
    const crediario = dataManager.getCrediario();
    filteredCrediario = crediario.sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));
    
    updateCrediarioStats();
    renderCrediario();
}

function setupCrediarioForm() {
    const form = document.getElementById('crediario-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveCrediario();
    });
    
    // Set default due date (30 days from now)
    const form = document.getElementById('crediario-form');
    const dataVencimento = document.getElementById('crediario-vencimento');
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    dataVencimento.value = defaultDate.toISOString().split('T')[0];
}

function setupPagamentoForm() {
    const form = document.getElementById('pagamento-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        registrarPagamento();
    });
    
    // Set default payment date (today)
    document.getElementById('data-pagamento').value = new Date().toISOString().split('T')[0];
}

function updateCrediarioStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const abertos = filteredCrediario.filter(c => c.status === 'aberto');
    const totalAberto = abertos.reduce((sum, c) => sum + (c.valorTotal - c.valorPago), 0);
    
    const vencidos = abertos.filter(c => new Date(c.dataVencimento) < today);
    const totalVencidos = vencidos.reduce((sum, c) => sum + (c.valorTotal - c.valorPago), 0);
    
    const clientesComDebito = new Set(abertos.map(c => c.clienteId)).size;
    
    // Calculate today's payments
    const pagamentosHoje = getPagamentosHoje();
    const recebimentosHoje = pagamentosHoje.reduce((sum, p) => sum + p.valor, 0);
    
    document.getElementById('total-aberto').textContent = dataManager.formatCurrency(totalAberto);
    document.getElementById('total-vencidos').textContent = dataManager.formatCurrency(totalVencidos);
    document.getElementById('clientes-debito').textContent = clientesComDebito;
    document.getElementById('recebimentos-hoje').textContent = dataManager.formatCurrency(recebimentosHoje);
}

function renderCrediario() {
    const tbody = document.getElementById('crediario-table-body');
    
    if (filteredCrediario.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum crediário encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredCrediario.map(item => {
        const saldo = item.valorTotal - item.valorPago;
        const isVencido = new Date(item.dataVencimento) < new Date() && item.status === 'aberto';
        const statusClass = item.status === 'pago' ? 'success' : (isVencido ? 'danger' : 'warning');
        const statusText = item.status === 'pago' ? 'Pago' : (isVencido ? 'Vencido' : 'Em Aberto');
        
        return `
            <tr>
                <td>${item.clienteNome}</td>
                <td>${dataManager.formatCurrency(item.valorTotal)}</td>
                <td>${dataManager.formatCurrency(item.valorPago)}</td>
                <td style="color: ${saldo > 0 ? '#dc3545' : '#198754'}">
                    ${dataManager.formatCurrency(saldo)}
                </td>
                <td style="color: ${isVencido ? '#dc3545' : '#333'}">
                    ${dataManager.formatDate(item.dataVencimento)}
                </td>
                <td>
                    <span class="badge badge-${statusClass}">${statusText}</span>
                </td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="verDetalhesCrediario('${item.id}')">
                        Detalhes
                    </button>
                    ${item.status === 'aberto' ? `
                        <button class="btn btn-success btn-sm" onclick="abrirPagamento('${item.id}')">
                            Pagar
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="editCrediario('${item.id}')">
                            Editar
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function saveCrediario() {
    const form = document.getElementById('crediario-form');
    
    if (!validateForm(form)) {
        showAlert('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    const clienteId = document.getElementById('crediario-cliente').value;
    const clientes = dataManager.getClientes();
    const cliente = clientes.find(c => c.id === clienteId);
    
    if (!cliente) {
        showAlert('Cliente não encontrado.', 'error');
        return;
    }
    
    const valorTotal = parseFloat(document.getElementById('crediario-valor-total').value);
    const valorPago = parseFloat(document.getElementById('crediario-valor-pago').value) || 0;
    
    if (valorPago > valorTotal) {
        showAlert('O valor pago não pode ser maior que o valor total.', 'error');
        return;
    }
    
    const crediario = {
        id: document.getElementById('crediario-id').value || null,
        clienteId: clienteId,
        clienteNome: cliente.nome,
        valorTotal: valorTotal,
        valorPago: valorPago,
        dataVencimento: document.getElementById('crediario-vencimento').value,
        observacoes: document.getElementById('crediario-observacoes').value,
        status: valorPago >= valorTotal ? 'pago' : 'aberto'
    };
    
    // Add payment history if there's an initial payment
    if (valorPago > 0) {
        crediario.pagamentos = [{
            valor: valorPago,
            data: new Date().toISOString(),
            observacoes: 'Pagamento inicial'
        }];
    }
    
    dataManager.saveCrediario(crediario);
    loadCrediario();
    hideModal('crediario-modal');
    form.reset();
    showAlert('Crediário salvo com sucesso!', 'success');
}

function editCrediario(id) {
    const crediario = dataManager.getCrediario();
    const item = crediario.find(c => c.id === id);
    
    if (!item) {
        showAlert('Crediário não encontrado.', 'error');
        return;
    }
    
    document.getElementById('crediario-id').value = item.id;
    document.getElementById('crediario-cliente').value = item.clienteId;
    document.getElementById('crediario-valor-total').value = item.valorTotal;
    document.getElementById('crediario-valor-pago').value = item.valorPago;
    document.getElementById('crediario-vencimento').value = item.dataVencimento;
    document.getElementById('crediario-observacoes').value = item.observacoes || '';
    
    document.getElementById('modal-title-crediario').textContent = 'Editar Crediário';
    showModal('crediario-modal');
}

function abrirPagamento(crediarioId) {
    const crediario = dataManager.getCrediario();
    const item = crediario.find(c => c.id === crediarioId);
    
    if (!item) {
        showAlert('Crediário não encontrado.', 'error');
        return;
    }
    
    const saldo = item.valorTotal - item.valorPago;
    
    document.getElementById('pagamento-crediario-id').value = item.id;
    document.getElementById('valor-pagamento').value = saldo.toFixed(2);
    document.getElementById('valor-pagamento').max = saldo;
    
    document.getElementById('pagamento-info').innerHTML = `
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px;">
            <p><strong>Cliente:</strong> ${item.clienteNome}</p>
            <p><strong>Valor Total:</strong> ${dataManager.formatCurrency(item.valorTotal)}</p>
            <p><strong>Valor Pago:</strong> ${dataManager.formatCurrency(item.valorPago)}</p>
            <p><strong>Saldo:</strong> ${dataManager.formatCurrency(saldo)}</p>
            <p><strong>Vencimento:</strong> ${dataManager.formatDate(item.dataVencimento)}</p>
        </div>
    `;
    
    showModal('pagamento-modal');
}

function registrarPagamento() {
    const form = document.getElementById('pagamento-form');
    
    if (!validateForm(form)) {
        showAlert('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    const crediarioId = document.getElementById('pagamento-crediario-id').value;
    const valorPagamento = parseFloat(document.getElementById('valor-pagamento').value);
    const dataPagamento = document.getElementById('data-pagamento').value;
    const observacoes = document.getElementById('observacoes-pagamento').value;
    
    const crediario = dataManager.getCrediario();
    const item = crediario.find(c => c.id === crediarioId);
    
    if (!item) {
        showAlert('Crediário não encontrado.', 'error');
        return;
    }
    
    const saldo = item.valorTotal - item.valorPago;
    
    if (valorPagamento <= 0 || valorPagamento > saldo) {
        showAlert('Valor de pagamento inválido.', 'error');
        return;
    }
    
    // Update credit record
    item.valorPago += valorPagamento;
    
    // Add payment to history
    if (!item.pagamentos) {
        item.pagamentos = [];
    }
    
    item.pagamentos.push({
        valor: valorPagamento,
        data: dataPagamento,
        observacoes: observacoes
    });
    
    // Update status
    if (item.valorPago >= item.valorTotal) {
        item.status = 'pago';
        item.dataPagamento = dataPagamento;
    }
    
    dataManager.saveCrediario(item);
    loadCrediario();
    hideModal('pagamento-modal');
    form.reset();
    
    const novoSaldo = item.valorTotal - item.valorPago;
    const mensagem = novoSaldo <= 0 ? 
        'Pagamento registrado! Crediário quitado.' : 
        `Pagamento registrado! Saldo restante: ${dataManager.formatCurrency(novoSaldo)}`;
    
    showAlert(mensagem, 'success');
}

function verDetalhesCrediario(id) {
    const crediario = dataManager.getCrediario();
    const item = crediario.find(c => c.id === id);
    
    if (!item) {
        showAlert('Crediário não encontrado.', 'error');
        return;
    }
    
    const saldo = item.valorTotal - item.valorPago;
    const isVencido = new Date(item.dataVencimento) < new Date() && item.status === 'aberto';
    
    let content = `
        <div style="margin-bottom: 2rem;">
            <h4>Informações do Crediário</h4>
            <p><strong>Cliente:</strong> ${item.clienteNome}</p>
            <p><strong>Valor Total:</strong> ${dataManager.formatCurrency(item.valorTotal)}</p>
            <p><strong>Valor Pago:</strong> ${dataManager.formatCurrency(item.valorPago)}</p>
            <p><strong>Saldo:</strong> <span style="color: ${saldo > 0 ? '#dc3545' : '#198754'}">${dataManager.formatCurrency(saldo)}</span></p>
            <p><strong>Data de Vencimento:</strong> <span style="color: ${isVencido ? '#dc3545' : '#333'}">${dataManager.formatDate(item.dataVencimento)}</span></p>
            <p><strong>Status:</strong> ${item.status === 'pago' ? 'Pago' : (isVencido ? 'Vencido' : 'Em Aberto')}</p>
            <p><strong>Data de Criação:</strong> ${dataManager.formatDate(item.dataCriacao)}</p>
            ${item.observacoes ? `<p><strong>Observações:</strong> ${item.observacoes}</p>` : ''}
        </div>
    `;
    
    if (item.pagamentos && item.pagamentos.length > 0) {
        content += `
            <div style="margin-bottom: 2rem;">
                <h4>Histórico de Pagamentos</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Valor</th>
                            <th>Observações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${item.pagamentos.map(pagamento => `
                            <tr>
                                <td>${dataManager.formatDate(pagamento.data)}</td>
                                <td>${dataManager.formatCurrency(pagamento.valor)}</td>
                                <td>${pagamento.observacoes || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    content += `
        <div class="flex gap-1">
            ${item.status === 'aberto' ? `
                <button class="btn btn-success" onclick="hideModal('crediario-detail-modal'); abrirPagamento('${item.id}')">
                    Registrar Pagamento
                </button>
                <button class="btn btn-primary" onclick="hideModal('crediario-detail-modal'); editCrediario('${item.id}')">
                    Editar
                </button>
            ` : ''}
            <button class="btn btn-secondary" onclick="hideModal('crediario-detail-modal')">
                Fechar
            </button>
        </div>
    `;
    
    document.getElementById('crediario-detail-content').innerHTML = content;
    showModal('crediario-detail-modal');
}

function aplicarFiltrosCrediario() {
    const clienteId = document.getElementById('filtro-cliente-crediario').value;
    const status = document.getElementById('filtro-status').value;
    const vencimentoAte = document.getElementById('filtro-vencimento').value;
    
    let crediario = dataManager.getCrediario();
    
    // Filter by customer
    if (clienteId) {
        crediario = crediario.filter(c => c.clienteId === clienteId);
    }
    
    // Filter by status
    if (status) {
        if (status === 'vencido') {
            const today = new Date();
            crediario = crediario.filter(c => 
                c.status === 'aberto' && new Date(c.dataVencimento) < today
            );
        } else {
            crediario = crediario.filter(c => c.status === status);
        }
    }
    
    // Filter by due date
    if (vencimentoAte) {
        const endDate = new Date(vencimentoAte + 'T23:59:59');
        crediario = crediario.filter(c => new Date(c.dataVencimento) <= endDate);
    }
    
    filteredCrediario = crediario.sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento));
    
    updateCrediarioStats();
    renderCrediario();
}

function getPagamentosHoje() {
    const today = new Date().toDateString();
    const crediario = dataManager.getCrediario();
    const pagamentosHoje = [];
    
    crediario.forEach(item => {
        if (item.pagamentos) {
            item.pagamentos.forEach(pagamento => {
                if (new Date(pagamento.data).toDateString() === today) {
                    pagamentosHoje.push(pagamento);
                }
            });
        }
    });
    
    return pagamentosHoje;
}

// Reset modal when opening for new credit
function showModal(modalId) {
    if (modalId === 'crediario-modal') {
        document.getElementById('crediario-form').reset();
        document.getElementById('crediario-id').value = '';
        document.getElementById('modal-title-crediario').textContent = 'Novo Crediário';
        
        // Set default due date
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 30);
        document.getElementById('crediario-vencimento').value = defaultDate.toISOString().split('T')[0];
    }
    
    if (modalId === 'pagamento-modal') {
        document.getElementById('pagamento-form').reset();
        document.getElementById('data-pagamento').value = new Date().toISOString().split('T')[0];
    }
    
    document.getElementById(modalId).style.display = 'block';
}

// Add CSS for status badges
const style = document.createElement('style');
style.textContent = `
    .badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: bold;
        text-transform: uppercase;
    }
    
    .badge-success {
        background-color: #d1e7dd;
        color: #0f5132;
    }
    
    .badge-warning {
        background-color: #fff3cd;
        color: #664d03;
    }
    
    .badge-danger {
        background-color: #f8d7da;
        color: #721c24;
    }
`;
document.head.appendChild(style);