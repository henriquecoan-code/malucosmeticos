// Products management functionality
document.addEventListener('DOMContentLoaded', function() {
    loadProdutos();
    setupProdutoForm();
});

function loadProdutos() {
    const produtos = dataManager.getProdutos();
    const tbody = document.getElementById('produtos-table-body');
    
    if (produtos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum produto cadastrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = produtos.map(produto => `
        <tr>
            <td>${produto.codigo}</td>
            <td>${produto.nome}</td>
            <td>${produto.categoria}</td>
            <td>${dataManager.formatCurrency(produto.preco)}</td>
            <td>
                <span style="color: ${produto.estoque <= produto.estoqueMinimo ? '#dc3545' : '#333'}">
                    ${produto.estoque}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editProduto('${produto.id}')">
                    Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduto('${produto.id}')">
                    Excluir
                </button>
            </td>
        </tr>
    `).join('');
}

function setupProdutoForm() {
    const form = document.getElementById('produto-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveProduto();
    });
}

function saveProduto() {
    const form = document.getElementById('produto-form');
    
    if (!validateForm(form)) {
        showAlert('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    const produto = {
        id: document.getElementById('produto-id').value || null,
        nome: document.getElementById('produto-nome').value,
        categoria: document.getElementById('produto-categoria').value,
        descricao: document.getElementById('produto-descricao').value,
        preco: parseFloat(document.getElementById('produto-preco').value),
        custo: parseFloat(document.getElementById('produto-custo').value) || 0,
        estoque: parseInt(document.getElementById('produto-estoque').value),
        estoqueMinimo: parseInt(document.getElementById('produto-estoque-minimo').value) || 5
    };
    
    // For existing products, preserve the existing code
    if (produto.id) {
        produto.codigo = document.getElementById('produto-codigo').value;
    }
    // For new products, codigo will be generated automatically in DataManager
    
    dataManager.saveProduto(produto);
    loadProdutos();
    hideModal('produto-modal');
    form.reset();
    showAlert('Produto salvo com sucesso!', 'success');
}

function editProduto(id) {
    const produtos = dataManager.getProdutos();
    const produto = produtos.find(p => p.id === id);
    
    if (!produto) {
        showAlert('Produto não encontrado.', 'error');
        return;
    }
    
    // Fill form with product data
    document.getElementById('produto-id').value = produto.id;
    document.getElementById('produto-codigo').value = produto.codigo;
    document.getElementById('produto-nome').value = produto.nome;
    document.getElementById('produto-categoria').value = produto.categoria;
    document.getElementById('produto-descricao').value = produto.descricao || '';
    document.getElementById('produto-preco').value = produto.preco;
    document.getElementById('produto-custo').value = produto.custo || '';
    document.getElementById('produto-estoque').value = produto.estoque;
    document.getElementById('produto-estoque-minimo').value = produto.estoqueMinimo || 5;
    
    document.getElementById('modal-title').textContent = 'Editar Produto';
    showModal('produto-modal');
}

function deleteProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
        return;
    }
    
    if (dataManager.deleteProduto(id)) {
        loadProdutos();
        showAlert('Produto excluído com sucesso!', 'success');
    } else {
        showAlert('Erro ao excluir produto.', 'error');
    }
}

function searchProdutos() {
    const searchTerm = document.getElementById('search-produto').value.toLowerCase();
    const produtos = dataManager.getProdutos();
    
    const filteredProdutos = produtos.filter(produto => 
        produto.nome.toLowerCase().includes(searchTerm) ||
        produto.codigo.toLowerCase().includes(searchTerm) ||
        produto.categoria.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('produtos-table-body');
    
    if (filteredProdutos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum produto encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredProdutos.map(produto => `
        <tr>
            <td>${produto.codigo}</td>
            <td>${produto.nome}</td>
            <td>${produto.categoria}</td>
            <td>${dataManager.formatCurrency(produto.preco)}</td>
            <td>
                <span style="color: ${produto.estoque <= produto.estoqueMinimo ? '#dc3545' : '#333'}">
                    ${produto.estoque}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editProduto('${produto.id}')">
                    Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduto('${produto.id}')">
                    Excluir
                </button>
            </td>
        </tr>
    `).join('');
}

// Reset modal when opening for new product
function showModal(modalId) {
    if (modalId === 'produto-modal') {
        document.getElementById('produto-form').reset();
        document.getElementById('produto-id').value = '';
        document.getElementById('modal-title').textContent = 'Novo Produto';
    }
    document.getElementById(modalId).style.display = 'block';
}

// Add CSS for button sizing
const style = document.createElement('style');
style.textContent = `
    .btn-sm {
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        margin-right: 0.25rem;
    }
`;
document.head.appendChild(style);