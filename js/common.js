// Common utility functions and data management
class DataManager {
    constructor() {
        this.initializeData();
    }

    initializeData() {
        // Initialize local storage with default data if not exists
        if (!localStorage.getItem('produtos')) {
            localStorage.setItem('produtos', JSON.stringify([]));
        }
        if (!localStorage.getItem('clientes')) {
            localStorage.setItem('clientes', JSON.stringify([]));
        }
        if (!localStorage.getItem('vendas')) {
            localStorage.setItem('vendas', JSON.stringify([]));
        }
        if (!localStorage.getItem('crediario')) {
            localStorage.setItem('crediario', JSON.stringify([]));
        }
        // Initialize sequential counters
        if (!localStorage.getItem('sequentialCounters')) {
            localStorage.setItem('sequentialCounters', JSON.stringify({
                produtos: 0,
                clientes: 0,
                vendas: 0
            }));
        }
    }

    // Product management
    getProdutos() {
        return JSON.parse(localStorage.getItem('produtos')) || [];
    }

    saveProduto(produto) {
        const produtos = this.getProdutos();
        if (produto.id) {
            // Update existing
            const index = produtos.findIndex(p => p.id === produto.id);
            if (index !== -1) {
                produtos[index] = produto;
            }
        } else {
            // Add new
            produto.id = this.generateId();
            produto.codigo = this.generateSequentialCode('produtos');
            produto.dataCadastro = new Date().toISOString();
            produtos.push(produto);
        }
        localStorage.setItem('produtos', JSON.stringify(produtos));
        this.logActivity(`Produto ${produto.nome} ${produto.id ? 'atualizado' : 'cadastrado'}`);
        return produto;
    }

    deleteProduto(id) {
        const produtos = this.getProdutos();
        const index = produtos.findIndex(p => p.id === id);
        if (index !== -1) {
            const produto = produtos[index];
            produtos.splice(index, 1);
            localStorage.setItem('produtos', JSON.stringify(produtos));
            this.logActivity(`Produto ${produto.nome} removido`);
            return true;
        }
        return false;
    }

    // Customer management
    getClientes() {
        return JSON.parse(localStorage.getItem('clientes')) || [];
    }

    saveCliente(cliente) {
        const clientes = this.getClientes();
        if (cliente.id) {
            const index = clientes.findIndex(c => c.id === cliente.id);
            if (index !== -1) {
                clientes[index] = cliente;
            }
        } else {
            cliente.id = this.generateId();
            cliente.codigo = this.generateSequentialCode('clientes');
            cliente.dataCadastro = new Date().toISOString();
            clientes.push(cliente);
        }
        localStorage.setItem('clientes', JSON.stringify(clientes));
        this.logActivity(`Cliente ${cliente.nome} ${cliente.id ? 'atualizado' : 'cadastrado'}`);
        return cliente;
    }

    deleteCliente(id) {
        const clientes = this.getClientes();
        const index = clientes.findIndex(c => c.id === id);
        if (index !== -1) {
            const cliente = clientes[index];
            clientes.splice(index, 1);
            localStorage.setItem('clientes', JSON.stringify(clientes));
            this.logActivity(`Cliente ${cliente.nome} removido`);
            return true;
        }
        return false;
    }

    // Sales management
    getVendas() {
        return JSON.parse(localStorage.getItem('vendas')) || [];
    }

    saveVenda(venda) {
        const vendas = this.getVendas();
        venda.id = this.generateId();
        venda.controle = this.generateSequentialCode('vendas');
        venda.dataVenda = new Date().toISOString();
        vendas.push(venda);
        localStorage.setItem('vendas', JSON.stringify(vendas));
        this.logActivity(`Venda realizada no valor de R$ ${venda.total.toFixed(2)}`);
        return venda;
    }

    // Credit management
    getCrediario() {
        return JSON.parse(localStorage.getItem('crediario')) || [];
    }

    saveCrediario(crediario) {
        const crediarios = this.getCrediario();
        if (crediario.id) {
            const index = crediarios.findIndex(c => c.id === crediario.id);
            if (index !== -1) {
                crediarios[index] = crediario;
            }
        } else {
            crediario.id = this.generateId();
            crediario.dataCriacao = new Date().toISOString();
            crediarios.push(crediario);
        }
        localStorage.setItem('crediario', JSON.stringify(crediarios));
        this.logActivity(`Crediário ${crediario.id ? 'atualizado' : 'criado'} para ${crediario.clienteNome}`);
        return crediario;
    }

    // Utility functions
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    generateSequentialCode(type) {
        const counters = JSON.parse(localStorage.getItem('sequentialCounters')) || {
            produtos: 0,
            clientes: 0,
            vendas: 0
        };
        
        counters[type] = counters[type] + 1;
        localStorage.setItem('sequentialCounters', JSON.stringify(counters));
        
        // Format with prefix and padding
        switch(type) {
            case 'produtos':
                return `PROD${counters[type].toString().padStart(4, '0')}`;
            case 'clientes':
                return `CLI${counters[type].toString().padStart(4, '0')}`;
            case 'vendas':
                return `CTRL${counters[type].toString().padStart(4, '0')}`;
            default:
                return counters[type].toString();
        }
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    logActivity(activity) {
        const activities = JSON.parse(localStorage.getItem('activities')) || [];
        activities.unshift({
            id: this.generateId(),
            activity,
            timestamp: new Date().toISOString()
        });
        // Keep only last 50 activities
        if (activities.length > 50) {
            activities.splice(50);
        }
        localStorage.setItem('activities', JSON.stringify(activities));
    }

    getRecentActivities(limit = 10) {
        const activities = JSON.parse(localStorage.getItem('activities')) || [];
        return activities.slice(0, limit);
    }

    // Dashboard statistics
    getDashboardStats() {
        const produtos = this.getProdutos();
        const clientes = this.getClientes();
        const vendas = this.getVendas();
        const crediario = this.getCrediario();

        const today = new Date().toDateString();
        const vendasHoje = vendas.filter(v => 
            new Date(v.dataVenda).toDateString() === today
        );

        const totalVendasHoje = vendasHoje.reduce((sum, venda) => sum + venda.total, 0);
        const totalCrediario = crediario
            .filter(c => c.status === 'aberto')
            .reduce((sum, c) => sum + c.valorTotal, 0);

        return {
            totalProdutos: produtos.length,
            totalClientes: clientes.length,
            vendasHoje: totalVendasHoje,
            totalCrediario: totalCrediario
        };
    }
}

// Global data manager instance
const dataManager = new DataManager();

// Common utility functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showAlert(message, type = 'info') {
    // Simple alert implementation
    alert(message);
}

function validateForm(formElement) {
    const requiredFields = formElement.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#dc3545';
            isValid = false;
        } else {
            field.style.borderColor = '#ddd';
        }
    });

    return isValid;
}

// Event delegation for common actions
document.addEventListener('DOMContentLoaded', function() {
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Close modal when clicking close button
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('close')) {
            const modal = event.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
    });
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataManager, dataManager };
}