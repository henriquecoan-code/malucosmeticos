// XML Import functionality
let selectedFiles = [];
let xmlImportHistory = [];

document.addEventListener('DOMContentLoaded', function() {
    setupFileUpload();
    loadXMLHistory();
});

function setupFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('xml-file-input');
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.name.toLowerCase().endsWith('.xml')
        );
        
        if (files.length > 0) {
            addFiles(files);
        } else {
            showAlert('Por favor, selecione apenas arquivos XML.', 'error');
        }
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        addFiles(files);
    });
}

function addFiles(files) {
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter(file => {
        if (file.size > maxSize) {
            showAlert(`Arquivo ${file.name} é muito grande (máximo 10MB).`, 'error');
            return false;
        }
        return true;
    });
    
    selectedFiles = [...selectedFiles, ...validFiles];
    updateFileList();
    document.getElementById('btn-processar').disabled = selectedFiles.length === 0;
}

function updateFileList() {
    const fileList = document.getElementById('file-list');
    const selectedFilesContainer = document.getElementById('selected-files');
    
    if (selectedFiles.length === 0) {
        fileList.style.display = 'none';
        return;
    }
    
    fileList.style.display = 'block';
    selectedFilesContainer.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
            <span class="file-name">📄 ${file.name}</span>
            <span class="file-size">(${formatFileSize(file.size)})</span>
            <button class="btn btn-danger btn-sm" onclick="removeFile(${index})">Remover</button>
        </div>
    `).join('');
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    document.getElementById('btn-processar').disabled = selectedFiles.length === 0;
}

function limparArquivos() {
    selectedFiles = [];
    updateFileList();
    document.getElementById('btn-processar').disabled = true;
    document.getElementById('xml-file-input').value = '';
}

async function processarXML() {
    if (selectedFiles.length === 0) {
        showAlert('Selecione pelo menos um arquivo XML.', 'error');
        return;
    }
    
    const config = getImportConfig();
    const statusContainer = document.getElementById('processing-status');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const resultsContainer = document.getElementById('processing-results');
    
    statusContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Iniciando processamento...';
    resultsContainer.innerHTML = '';
    
    let processedCount = 0;
    const results = {
        success: 0,
        error: 0,
        produtosCriados: 0,
        produtosAtualizados: 0,
        fornecedoresCriados: 0,
        details: []
    };
    
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        progressText.textContent = `Processando ${file.name}...`;
        
        try {
            const xmlContent = await readFileAsText(file);
            const result = await processXMLContent(xmlContent, file.name, config);
            
            results.success++;
            results.produtosCriados += result.produtosCriados;
            results.produtosAtualizados += result.produtosAtualizados;
            results.fornecedoresCriados += result.fornecedoresCriados;
            results.details.push({
                arquivo: file.name,
                status: 'sucesso',
                ...result
            });
            
        } catch (error) {
            results.error++;
            results.details.push({
                arquivo: file.name,
                status: 'erro',
                erro: error.message
            });
        }
        
        processedCount++;
        const progress = (processedCount / selectedFiles.length) * 100;
        progressFill.style.width = `${progress}%`;
    }
    
    // Save import history
    const importRecord = {
        id: dataManager.generateId(),
        data: new Date().toISOString(),
        arquivos: selectedFiles.map(f => f.name),
        status: results.error === 0 ? 'sucesso' : 'parcial',
        config: config,
        results: results
    };
    
    saveImportHistory(importRecord);
    
    // Show results
    progressText.textContent = 'Processamento concluído!';
    showResults(results);
    
    // Clear files
    limparArquivos();
    loadXMLHistory();
    
    dataManager.logActivity(`XML importado: ${results.success} sucesso, ${results.error} erro(s)`);
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsText(file);
    });
}

async function processXMLContent(xmlContent, fileName, config) {
    // Simulate XML processing (in a real application, you would parse the actual XML)
    return new Promise((resolve) => {
        setTimeout(() => {
            // Mock processing results
            const mockResult = {
                fornecedor: `Fornecedor ${Math.floor(Math.random() * 100)}`,
                numero: Math.floor(Math.random() * 1000000),
                data: new Date().toISOString(),
                produtosCriados: Math.floor(Math.random() * 5),
                produtosAtualizados: Math.floor(Math.random() * 10),
                fornecedoresCriados: config.criarFornecedores ? Math.floor(Math.random() * 2) : 0,
                produtos: []
            };
            
            // Generate mock products
            for (let i = 0; i < mockResult.produtosCriados + mockResult.produtosAtualizados; i++) {
                mockResult.produtos.push({
                    codigo: `PROD${Math.floor(Math.random() * 10000)}`,
                    nome: `Produto Importado ${i + 1}`,
                    categoria: 'maquiagem',
                    preco: Math.random() * 100 + 10,
                    estoque: Math.floor(Math.random() * 50) + 1,
                    acao: i < mockResult.produtosCriados ? 'criado' : 'atualizado'
                });
            }
            
            // Actually create/update products if configured
            if (config.criarProdutos || config.atualizarProdutos) {
                mockResult.produtos.forEach(produto => {
                    if (produto.acao === 'criado' && config.criarProdutos) {
                        dataManager.saveProduto({
                            codigo: produto.codigo,
                            nome: produto.nome,
                            categoria: produto.categoria,
                            preco: produto.preco,
                            estoque: produto.estoque,
                            estoqueMinimo: 5,
                            importadoXML: true,
                            arquivoXML: fileName
                        });
                    }
                });
            }
            
            resolve(mockResult);
        }, 1000 + Math.random() * 2000); // Simulate processing time
    });
}

function getImportConfig() {
    return {
        atualizarProdutos: document.getElementById('config-atualizar-produtos').checked,
        criarProdutos: document.getElementById('config-criar-produtos').checked,
        atualizarEstoque: document.getElementById('config-atualizar-estoque').checked,
        criarFornecedores: document.getElementById('config-criar-fornecedores').checked,
        registrarCompra: document.getElementById('config-registrar-compra').checked
    };
}

function showResults(results) {
    const resultsContainer = document.getElementById('processing-results');
    
    resultsContainer.innerHTML = `
        <div class="results-summary">
            <h4>Resumo do Processamento</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                <div class="result-card success">
                    <div class="result-number">${results.success}</div>
                    <div class="result-label">Sucessos</div>
                </div>
                <div class="result-card error">
                    <div class="result-number">${results.error}</div>
                    <div class="result-label">Erros</div>
                </div>
                <div class="result-card info">
                    <div class="result-number">${results.produtosCriados}</div>
                    <div class="result-label">Produtos Criados</div>
                </div>
                <div class="result-card info">
                    <div class="result-number">${results.produtosAtualizados}</div>
                    <div class="result-label">Produtos Atualizados</div>
                </div>
                <div class="result-card info">
                    <div class="result-number">${results.fornecedoresCriados}</div>
                    <div class="result-label">Fornecedores Criados</div>
                </div>
            </div>
        </div>
        
        <div class="results-details">
            <h4>Detalhes por Arquivo</h4>
            ${results.details.map(detail => `
                <div class="detail-item ${detail.status}">
                    <div class="detail-header">
                        <span class="file-name">${detail.arquivo}</span>
                        <span class="status ${detail.status}">${detail.status === 'sucesso' ? '✓ Sucesso' : '✗ Erro'}</span>
                    </div>
                    ${detail.status === 'sucesso' ? `
                        <div class="detail-content">
                            <p>Fornecedor: ${detail.fornecedor}</p>
                            <p>Produtos criados: ${detail.produtosCriados}</p>
                            <p>Produtos atualizados: ${detail.produtosAtualizados}</p>
                        </div>
                    ` : `
                        <div class="detail-content error">
                            <p>Erro: ${detail.erro}</p>
                        </div>
                    `}
                </div>
            `).join('')}
        </div>
    `;
}

function saveImportHistory(record) {
    const history = getImportHistory();
    history.unshift(record);
    // Keep only last 50 imports
    if (history.length > 50) {
        history.splice(50);
    }
    localStorage.setItem('xmlImportHistory', JSON.stringify(history));
}

function getImportHistory() {
    return JSON.parse(localStorage.getItem('xmlImportHistory')) || [];
}

function loadXMLHistory() {
    const history = getImportHistory();
    const tbody = document.getElementById('xml-history-table');
    
    if (history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma importação realizada</td></tr>';
        return;
    }
    
    tbody.innerHTML = history.slice(0, 10).map(item => `
        <tr>
            <td>${dataManager.formatDate(item.data)}</td>
            <td>${item.arquivos.length} arquivo(s)</td>
            <td>
                <span class="badge badge-${item.status === 'sucesso' ? 'success' : 'warning'}">
                    ${item.status === 'sucesso' ? 'Sucesso' : 'Parcial'}
                </span>
            </td>
            <td>
                ${item.results.produtosCriados + item.results.produtosAtualizados} produtos
            </td>
            <td>${item.results.details[0]?.fornecedor || '-'}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="verDetalhesImportacao('${item.id}')">
                    Ver Detalhes
                </button>
            </td>
        </tr>
    `).join('');
}

function verDetalhesImportacao(id) {
    const history = getImportHistory();
    const item = history.find(h => h.id === id);
    
    if (!item) {
        showAlert('Importação não encontrada.', 'error');
        return;
    }
    
    const content = document.getElementById('xml-detail-content');
    content.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h4>Informações da Importação</h4>
            <p><strong>Data:</strong> ${dataManager.formatDate(item.data)}</p>
            <p><strong>Arquivos:</strong> ${item.arquivos.join(', ')}</p>
            <p><strong>Status:</strong> ${item.status === 'sucesso' ? 'Sucesso' : 'Parcial'}</p>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h4>Configurações Utilizadas</h4>
            <p>Atualizar produtos existentes: ${item.config.atualizarProdutos ? 'Sim' : 'Não'}</p>
            <p>Criar novos produtos: ${item.config.criarProdutos ? 'Sim' : 'Não'}</p>
            <p>Atualizar estoque: ${item.config.atualizarEstoque ? 'Sim' : 'Não'}</p>
            <p>Criar fornecedores: ${item.config.criarFornecedores ? 'Sim' : 'Não'}</p>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h4>Resultados</h4>
            <p>Sucessos: ${item.results.success}</p>
            <p>Erros: ${item.results.error}</p>
            <p>Produtos criados: ${item.results.produtosCriados}</p>
            <p>Produtos atualizados: ${item.results.produtosAtualizados}</p>
            <p>Fornecedores criados: ${item.results.fornecedoresCriados}</p>
        </div>
        
        <button class="btn btn-secondary" onclick="hideModal('xml-detail-modal')">
            Fechar
        </button>
    `;
    
    showModal('xml-detail-modal');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Add CSS for upload area and results
const style = document.createElement('style');
style.textContent = `
    .upload-area {
        border: 2px dashed #d63384;
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        background: #f8f9fa;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .upload-area:hover {
        border-color: #b02a5b;
        background: #f0f0f0;
    }
    
    .upload-area.drag-over {
        border-color: #b02a5b;
        background: #e8f4ff;
    }
    
    .upload-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }
    
    .upload-link {
        color: #d63384;
        text-decoration: underline;
    }
    
    .upload-help {
        font-size: 0.9rem;
        color: #666;
        margin-top: 0.5rem;
    }
    
    .file-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-bottom: 0.5rem;
    }
    
    .file-name {
        flex: 1;
        font-weight: bold;
    }
    
    .file-size {
        color: #666;
        margin: 0 1rem;
    }
    
    .progress-bar {
        width: 100%;
        height: 20px;
        background: #e9ecef;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 1rem;
    }
    
    .progress-fill {
        height: 100%;
        background: #d63384;
        width: 0%;
        transition: width 0.3s ease;
    }
    
    .results-summary {
        margin-bottom: 2rem;
    }
    
    .result-card {
        text-align: center;
        padding: 1rem;
        border-radius: 8px;
        background: white;
        border: 2px solid;
    }
    
    .result-card.success {
        border-color: #198754;
    }
    
    .result-card.error {
        border-color: #dc3545;
    }
    
    .result-card.info {
        border-color: #0dcaf0;
    }
    
    .result-number {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
    }
    
    .result-label {
        font-size: 0.9rem;
        color: #666;
    }
    
    .detail-item {
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-bottom: 0.5rem;
        overflow: hidden;
    }
    
    .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background: #f8f9fa;
        border-bottom: 1px solid #ddd;
    }
    
    .detail-content {
        padding: 0.75rem;
    }
    
    .status.sucesso {
        color: #198754;
        font-weight: bold;
    }
    
    .status.erro {
        color: #dc3545;
        font-weight: bold;
    }
    
    .checkbox-label {
        display: block;
        margin-bottom: 0.5rem;
        cursor: pointer;
    }
    
    .checkbox-label input {
        margin-right: 0.5rem;
    }
`;
document.head.appendChild(style);