// Customers management functionality
document.addEventListener('DOMContentLoaded', function() {
    loadClientes();
    setupClienteForm();
});

function loadClientes() {
    const clientes = dataManager.getClientes();
    const tbody = document.getElementById('clientes-table-body');
    
    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum cliente cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = clientes.map(cliente => `
        <tr>
            <td>${cliente.nome}</td>
            <td>${formatCPF(cliente.cpf) || '-'}</td>
            <td>${cliente.telefone}</td>
            <td>${cliente.email || '-'}</td>
            <td>${dataManager.formatDate(cliente.dataCadastro)}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="verDetalhesCliente('${cliente.id}')">
                    Ver Detalhes
                </button>
                <button class="btn btn-secondary btn-sm" onclick="editCliente('${cliente.id}')">
                    Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteCliente('${cliente.id}')">
                    Excluir
                </button>
            </td>
        </tr>
    `).join('');
}

function setupClienteForm() {
    const form = document.getElementById('cliente-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveCliente();
    });

    // Add input masks
    setupInputMasks();
}

function setupInputMasks() {
    // CPF mask
    document.getElementById('cliente-cpf').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
    });

    // Phone mask
    document.getElementById('cliente-telefone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
        e.target.value = value;
    });

    // CEP mask
    document.getElementById('cliente-cep').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
    });
}

function saveCliente() {
    const form = document.getElementById('cliente-form');
    
    if (!validateForm(form)) {
        showAlert('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    const cliente = {
        id: document.getElementById('cliente-id').value || null,
        nome: document.getElementById('cliente-nome').value,
        cpf: document.getElementById('cliente-cpf').value.replace(/\D/g, ''), // Remove formatting
        dataNascimento: document.getElementById('cliente-data-nascimento').value,
        telefone: document.getElementById('cliente-telefone').value,
        email: document.getElementById('cliente-email').value,
        endereco: {
            logradouro: document.getElementById('cliente-endereco').value,
            numero: document.getElementById('cliente-numero').value,
            bairro: document.getElementById('cliente-bairro').value,
            cidade: document.getElementById('cliente-cidade').value,
            cep: document.getElementById('cliente-cep').value.replace(/\D/g, '') // Remove formatting
        },
        observacoes: document.getElementById('cliente-observacoes').value
    };
    
    // Validate CPF if provided
    if (cliente.cpf && !isValidCPF(cliente.cpf)) {
        showAlert('CPF inválido.', 'error');
        return;
    }
    
    // Check if CPF already exists (for new customers)
    if (!cliente.id && cliente.cpf) {
        const clientes = dataManager.getClientes();
        if (clientes.some(c => c.cpf === cliente.cpf)) {
            showAlert('Já existe um cliente cadastrado com este CPF.', 'error');
            return;
        }
    }
    
    dataManager.saveCliente(cliente);
    loadClientes();
    hideModal('cliente-modal');
    form.reset();
    showAlert('Cliente salvo com sucesso!', 'success');
}

function editCliente(id) {
    const clientes = dataManager.getClientes();
    const cliente = clientes.find(c => c.id === id);
    
    if (!cliente) {
        showAlert('Cliente não encontrado.', 'error');
        return;
    }
    
    // Fill form with customer data
    document.getElementById('cliente-id').value = cliente.id;
    document.getElementById('cliente-nome').value = cliente.nome;
    document.getElementById('cliente-cpf').value = formatCPF(cliente.cpf) || '';
    document.getElementById('cliente-data-nascimento').value = cliente.dataNascimento || '';
    document.getElementById('cliente-telefone').value = cliente.telefone;
    document.getElementById('cliente-email').value = cliente.email || '';
    document.getElementById('cliente-endereco').value = cliente.endereco?.logradouro || '';
    document.getElementById('cliente-numero').value = cliente.endereco?.numero || '';
    document.getElementById('cliente-bairro').value = cliente.endereco?.bairro || '';
    document.getElementById('cliente-cidade').value = cliente.endereco?.cidade || '';
    document.getElementById('cliente-cep').value = formatCEP(cliente.endereco?.cep) || '';
    document.getElementById('cliente-observacoes').value = cliente.observacoes || '';
    
    document.getElementById('modal-title').textContent = 'Editar Cliente';
    showModal('cliente-modal');
}

function deleteCliente(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
        return;
    }
    
    // Check if customer has pending credit
    const crediario = dataManager.getCrediario();
    const hasCredit = crediario.some(c => c.clienteId === id && c.status === 'aberto');
    
    if (hasCredit) {
        showAlert('Não é possível excluir cliente com crediário em aberto.', 'error');
        return;
    }
    
    if (dataManager.deleteCliente(id)) {
        loadClientes();
        showAlert('Cliente excluído com sucesso!', 'success');
    } else {
        showAlert('Erro ao excluir cliente.', 'error');
    }
}

function verDetalhesCliente(id) {
    const clientes = dataManager.getClientes();
    const cliente = clientes.find(c => c.id === id);

    if (!cliente) {
        showAlert('Cliente não encontrado.', 'error');
        return;
    }

    // Get customer's purchase history
    const vendas = dataManager.getVendas();
    const vendasCliente = vendas.filter(v => v.clienteId === id);
    const totalCompras = vendasCliente.reduce((sum, v) => sum + v.total, 0);

    // Get customer's credit status
    const crediario = dataManager.getCrediario();
    const creditoCliente = crediario.filter(c => c.clienteId === id && c.status === 'aberto');
    const totalCredito = creditoCliente.reduce((sum, c) => sum + (c.valorTotal - c.valorPago), 0);

    const content = document.getElementById('cliente-detail-content');
    content.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h4>Informações Pessoais</h4>
            <p><strong>Nome:</strong> ${cliente.nome}</p>
            ${cliente.cpf ? `<p><strong>CPF:</strong> ${formatCPF(cliente.cpf)}</p>` : ''}
            ${cliente.dataNascimento ? `<p><strong>Data de Nascimento:</strong> ${dataManager.formatDate(cliente.dataNascimento)}</p>` : ''}
            <p><strong>Telefone:</strong> ${cliente.telefone}</p>
            ${cliente.email ? `<p><strong>Email:</strong> ${cliente.email}</p>` : ''}
            <p><strong>Data de Cadastro:</strong> ${dataManager.formatDate(cliente.dataCadastro)}</p>
        </div>

        ${cliente.endereco && (cliente.endereco.logradouro || cliente.endereco.cidade) ? `
        <div style="margin-bottom: 2rem;">
            <h4>Endereço</h4>
            ${cliente.endereco.logradouro ? `<p><strong>Logradouro:</strong> ${cliente.endereco.logradouro}${cliente.endereco.numero ? ', ' + cliente.endereco.numero : ''}</p>` : ''}
            ${cliente.endereco.bairro ? `<p><strong>Bairro:</strong> ${cliente.endereco.bairro}</p>` : ''}
            ${cliente.endereco.cidade ? `<p><strong>Cidade:</strong> ${cliente.endereco.cidade}</p>` : ''}
            ${cliente.endereco.cep ? `<p><strong>CEP:</strong> ${formatCEP(cliente.endereco.cep)}</p>` : ''}
        </div>
        ` : ''}

        <div style="margin-bottom: 2rem;">
            <h4>Estatísticas</h4>
            <p><strong>Total de Compras:</strong> ${dataManager.formatCurrency(totalCompras)}</p>
            <p><strong>Número de Compras:</strong> ${vendasCliente.length}</p>
            <p><strong>Crediário em Aberto:</strong> <span style="color: ${totalCredito > 0 ? '#dc3545' : '#198754'}">${dataManager.formatCurrency(totalCredito)}</span></p>
        </div>

        ${cliente.observacoes ? `
        <div style="margin-bottom: 2rem;">
            <h4>Observações</h4>
            <p>${cliente.observacoes}</p>
        </div>
        ` : ''}

        <div class="flex gap-1">
            <button class="btn btn-primary" onclick="hideModal('cliente-detail-modal'); editCliente('${cliente.id}')">
                Editar Cliente
            </button>
            <a href="historico.html?cliente=${cliente.id}" class="btn btn-secondary">
                Ver Histórico de Compras
            </a>
        </div>
    `;

    showModal('cliente-detail-modal');
}

function searchClientes() {
    const searchTerm = document.getElementById('search-cliente').value.toLowerCase();
    const clientes = dataManager.getClientes();
    
    const filteredClientes = clientes.filter(cliente => 
        cliente.nome.toLowerCase().includes(searchTerm) ||
        (cliente.cpf && cliente.cpf.includes(searchTerm.replace(/\D/g, ''))) ||
        cliente.telefone.toLowerCase().includes(searchTerm) ||
        (cliente.email && cliente.email.toLowerCase().includes(searchTerm))
    );
    
    const tbody = document.getElementById('clientes-table-body');
    
    if (filteredClientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum cliente encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredClientes.map(cliente => `
        <tr>
            <td>${cliente.nome}</td>
            <td>${formatCPF(cliente.cpf) || '-'}</td>
            <td>${cliente.telefone}</td>
            <td>${cliente.email || '-'}</td>
            <td>${dataManager.formatDate(cliente.dataCadastro)}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="verDetalhesCliente('${cliente.id}')">
                    Ver Detalhes
                </button>
                <button class="btn btn-secondary btn-sm" onclick="editCliente('${cliente.id}')">
                    Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteCliente('${cliente.id}')">
                    Excluir
                </button>
            </td>
        </tr>
    `).join('');
}

// Utility functions
function formatCPF(cpf) {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatCEP(cep) {
    if (!cep) return '';
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
}

function isValidCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Check for known invalid patterns
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validate check digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 >= 10) digit1 = 0;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 >= 10) digit2 = 0;
    
    return digit1 === parseInt(cpf.charAt(9)) && digit2 === parseInt(cpf.charAt(10));
}

// Reset modal when opening for new customer
function showModal(modalId) {
    if (modalId === 'cliente-modal') {
        document.getElementById('cliente-form').reset();
        document.getElementById('cliente-id').value = '';
        document.getElementById('modal-title').textContent = 'Novo Cliente';
    }
    document.getElementById(modalId).style.display = 'block';
}