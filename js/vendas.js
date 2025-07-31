// Sales management functionality
let itensVenda = [];
let ultimaVendaId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadClientes();
    loadProdutos();
    loadVendasRecentes();
    setupVendaForm();
});

function setupVendaForm() {
    const form = document.getElementById('venda-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        finalizarVenda();
    });

    // Auto-fill product price when product is selected
    document.getElementById('produto-select').addEventListener('change', function() {
        const produtoId = this.value;
        if (produtoId) {
            const produtos = dataManager.getProdutos();
            const produto = produtos.find(p => p.id === produtoId);
            if (produto) {
                document.getElementById('produto-preco').value = produto.preco;
            }
        } else {
            document.getElementById('produto-preco').value = '';
        }
    });
}

function loadClientes() {
    const clientes = dataManager.getClientes();
    const select = document.getElementById('venda-cliente');
    
    select.innerHTML = '<option value="">Cliente não cadastrado</option>';
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = cliente.nome;
        select.appendChild(option);
    });
}

function loadProdutos() {
    const produtos = dataManager.getProdutos();
    const select = document.getElementById('produto-select');
    
    select.innerHTML = '<option value="">Selecione um produto</option>';
    produtos.forEach(produto => {
        const option = document.createElement('option');
        option.value = produto.id;
        option.textContent = `${produto.codigo} - ${produto.nome} (Estoque: ${produto.estoque})`;
        option.disabled = produto.estoque <= 0;
        select.appendChild(option);
    });
}

function adicionarProduto() {
    const produtoId = document.getElementById('produto-select').value;
    const quantidade = parseInt(document.getElementById('produto-quantidade').value) || 1;
    const preco = parseFloat(document.getElementById('produto-preco').value);

    if (!produtoId) {
        showAlert('Selecione um produto.', 'error');
        return;
    }

    if (!preco || preco <= 0) {
        showAlert('Informe um preço válido.', 'error');
        return;
    }

    const produtos = dataManager.getProdutos();
    const produto = produtos.find(p => p.id === produtoId);

    if (!produto) {
        showAlert('Produto não encontrado.', 'error');
        return;
    }

    if (quantidade > produto.estoque) {
        showAlert(`Estoque insuficiente. Disponível: ${produto.estoque}`, 'error');
        return;
    }

    // Check if product is already in the sale
    const existingIndex = itensVenda.findIndex(item => item.produtoId === produtoId);
    if (existingIndex !== -1) {
        itensVenda[existingIndex].quantidade += quantidade;
        itensVenda[existingIndex].subtotal = itensVenda[existingIndex].quantidade * itensVenda[existingIndex].preco;
    } else {
        itensVenda.push({
            produtoId,
            produtoNome: produto.nome,
            produtoCodigo: produto.codigo,
            quantidade,
            preco,
            subtotal: quantidade * preco
        });
    }

    atualizarTabelaItens();
    atualizarTotal();
    
    // Clear form
    document.getElementById('produto-select').value = '';
    document.getElementById('produto-quantidade').value = '1';
    document.getElementById('produto-preco').value = '';
}

function removerProduto(index) {
    itensVenda.splice(index, 1);
    atualizarTabelaItens();
    atualizarTotal();
}

function atualizarTabelaItens() {
    const tbody = document.getElementById('itens-venda');
    
    if (itensVenda.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum produto adicionado</td></tr>';
        return;
    }

    tbody.innerHTML = itensVenda.map((item, index) => `
        <tr>
            <td>${item.produtoCodigo} - ${item.produtoNome}</td>
            <td>${item.quantidade}</td>
            <td>${dataManager.formatCurrency(item.preco)}</td>
            <td>${dataManager.formatCurrency(item.subtotal)}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removerProduto(${index})">
                    Remover
                </button>
            </td>
        </tr>
    `).join('');
}

function atualizarTotal() {
    const total = itensVenda.reduce((sum, item) => sum + item.subtotal, 0);
    document.getElementById('total-venda').textContent = dataManager.formatCurrency(total);
}

function finalizarVenda() {
    if (itensVenda.length === 0) {
        showAlert('Adicione pelo menos um produto à venda.', 'error');
        return;
    }

    const formaPagamento = document.getElementById('venda-forma-pagamento').value;
    if (!formaPagamento) {
        showAlert('Selecione a forma de pagamento.', 'error');
        return;
    }

    const clienteId = document.getElementById('venda-cliente').value;
    const observacoes = document.getElementById('venda-observacoes').value;
    const total = itensVenda.reduce((sum, item) => sum + item.subtotal, 0);

    // Update product stock
    const produtos = dataManager.getProdutos();
    itensVenda.forEach(item => {
        const produto = produtos.find(p => p.id === item.produtoId);
        if (produto) {
            produto.estoque -= item.quantidade;
            dataManager.saveProduto(produto);
        }
    });

    // Create sale record
    const venda = {
        clienteId,
        clienteNome: clienteId ? dataManager.getClientes().find(c => c.id === clienteId)?.nome : 'Cliente não cadastrado',
        formaPagamento,
        itens: [...itensVenda],
        total,
        observacoes
    };

    const vendaSalva = dataManager.saveVenda(venda);
    ultimaVendaId = vendaSalva.id;

    // Enable fiscal note button
    document.getElementById('btn-nota-fiscal').disabled = false;

    // Create credit entry if payment method is "crediario"
    if (formaPagamento === 'crediario' && clienteId) {
        const crediario = {
            clienteId,
            clienteNome: venda.clienteNome,
            vendaId: vendaSalva.id,
            valorTotal: total,
            valorPago: 0,
            status: 'aberto',
            dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        };
        dataManager.saveCrediario(crediario);
    }

    loadVendasRecentes();
    loadProdutos(); // Reload to update stock display
    limparVenda();
    showAlert('Venda realizada com sucesso!', 'success');
}

function limparVenda() {
    itensVenda = [];
    document.getElementById('venda-form').reset();
    atualizarTabelaItens();
    atualizarTotal();
    document.getElementById('btn-nota-fiscal').disabled = true;
    ultimaVendaId = null;
}

function loadVendasRecentes() {
    const vendas = dataManager.getVendas();
    const recentVendas = vendas.slice(-10).reverse(); // Last 10 sales, most recent first
    const tbody = document.getElementById('vendas-recentes-table');

    if (recentVendas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma venda realizada</td></tr>';
        return;
    }

    tbody.innerHTML = recentVendas.map(venda => `
        <tr>
            <td>${dataManager.formatDate(venda.dataVenda)}</td>
            <td>${venda.clienteNome}</td>
            <td>${dataManager.formatCurrency(venda.total)}</td>
            <td>${formatFormaPagamento(venda.formaPagamento)}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="verDetalhesVenda('${venda.id}')">
                    Ver Detalhes
                </button>
            </td>
        </tr>
    `).join('');
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

function verDetalhesVenda(vendaId) {
    const vendas = dataManager.getVendas();
    const venda = vendas.find(v => v.id === vendaId);

    if (!venda) {
        showAlert('Venda não encontrada.', 'error');
        return;
    }

    const content = document.getElementById('venda-detail-content');
    content.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <p><strong>Data:</strong> ${dataManager.formatDate(venda.dataVenda)}</p>
            <p><strong>Cliente:</strong> ${venda.clienteNome}</p>
            <p><strong>Forma de Pagamento:</strong> ${formatFormaPagamento(venda.formaPagamento)}</p>
            <p><strong>Total:</strong> ${dataManager.formatCurrency(venda.total)}</p>
            ${venda.observacoes ? `<p><strong>Observações:</strong> ${venda.observacoes}</p>` : ''}
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
    `;

    showModal('venda-detail-modal');
}

function emitirNotaFiscal() {
    if (!ultimaVendaId) {
        showAlert('Nenhuma venda selecionada para emissão de nota fiscal.', 'error');
        return;
    }

    showModal('nota-fiscal-modal');
    
    // Simulate API call to third-party fiscal note service
    setTimeout(() => {
        const notaNumero = Math.floor(Math.random() * 1000000);
        const notaSerie = 1;
        const notaChave = generateNotaFiscalKey();
        
        document.getElementById('nota-fiscal-status').innerHTML = '<span style="color: green;">✓ Nota fiscal emitida com sucesso!</span>';
        document.getElementById('nota-numero').textContent = notaNumero;
        document.getElementById('nota-serie').textContent = notaSerie;
        document.getElementById('nota-chave').textContent = notaChave;
        document.getElementById('nota-fiscal-details').style.display = 'block';
        
        // Update the sale record with fiscal note info
        const vendas = dataManager.getVendas();
        const venda = vendas.find(v => v.id === ultimaVendaId);
        if (venda) {
            venda.notaFiscal = {
                numero: notaNumero,
                serie: notaSerie,
                chave: notaChave,
                dataEmissao: new Date().toISOString()
            };
            dataManager.saveVenda(venda);
        }
        
        dataManager.logActivity(`Nota fiscal ${notaNumero} emitida`);
    }, 2000);
}

function generateNotaFiscalKey() {
    // Generate a fake 44-digit fiscal note access key
    let key = '';
    for (let i = 0; i < 44; i++) {
        key += Math.floor(Math.random() * 10);
    }
    return key;
}