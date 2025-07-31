# Malú Cosméticos - Sistema de Gestão

Sistema completo de gestão para loja de cosméticos, desenvolvido seguindo o fluxograma de desenvolvimento descrito no problema. Este sistema implementa todas as funcionalidades necessárias para gerenciar produtos, vendas, clientes, crediário e importação de XML.

## 🎯 Funcionalidades Implementadas

### 📊 Dashboard
- Visão geral do negócio com métricas em tempo real
- Total de produtos cadastrados
- Vendas do dia
- Número de clientes
- Valor total em crediário
- Feed de atividades recentes do sistema

### 🛍️ Gestão de Produtos
- **CRUD completo** (Criar, Ler, Atualizar, Deletar)
- Controle de estoque com alertas de estoque mínimo
- Categorização de produtos (Maquiagem, Cuidados com a Pele, Perfumaria, Cabelos, Acessórios)
- Controle de preço de custo e venda
- Sistema de busca por nome, código ou categoria
- Validação de códigos únicos

### 💰 Sistema de Vendas
- Interface intuitiva para criação de vendas
- Suporte a múltiplas formas de pagamento:
  - Dinheiro
  - Cartão de Débito
  - Cartão de Crédito
  - PIX
  - Crediário
- Adição de múltiplos produtos por venda
- Atualização automática de estoque
- **Emissão de notas fiscais** com integração simulada de API de terceiros
- Histórico de vendas recentes

### 👥 Gestão de Clientes
- Cadastro completo com dados pessoais e endereço
- Validação de CPF com algoritmo de verificação
- Máscaras de entrada para CPF, telefone e CEP
- Histórico de compras por cliente
- Integração com sistema de crediário
- Sistema de busca avançado

### 📈 Histórico de Compras
- Visualização completa do histórico de vendas
- **Filtros avançados** por cliente, data e período
- Paginação para grandes volumes de dados
- **Exportação para CSV** com dados formatados
- Estatísticas de vendas (total, ticket médio)
- Emissão de notas fiscais retroativas

### 💳 Gestão de Crediário
- Controle completo de crédito dos clientes
- Acompanhamento de status (Em Aberto, Vencido, Pago)
- **Histórico de pagamentos** detalhado
- Alertas de vencimento automáticos
- Registro de pagamentos parciais ou integrais
- Dashboard com métricas de crediário

### 📄 Importação de XML
- **Upload via drag-and-drop** ou seleção de arquivos
- Processamento de múltiplos arquivos XML simultaneamente
- Configurações flexíveis de importação:
  - Atualizar produtos existentes
  - Criar novos produtos automaticamente
  - Atualizar estoque baseado na XML
  - Cadastrar fornecedores automaticamente
- Barra de progresso durante processamento
- Histórico de importações realizadas
- Tratamento de erros e validações

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Armazenamento**: LocalStorage (para prototipagem)
- **Arquitetura**: SPA (Single Page Application)
- **Design**: Responsivo com CSS Grid e Flexbox
- **Integração**: Simulação de APIs de terceiros para notas fiscais

## 🚀 Como Executar

### Pré-requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor HTTP local (opcional, mas recomendado)

### Instalação e Execução

1. **Clone o repositório:**
```bash
git clone https://github.com/henriquecoan-code/malucosmeticos.git
cd malucosmeticos
```

2. **Inicie um servidor local:**
```bash
# Usando Python
python -m http.server 8000

# Usando Node.js (http-server)
npx http-server .

# Usando PHP
php -S localhost:8000
```

3. **Acesse no navegador:**
```
http://localhost:8000
```

## 📱 Design Responsivo

O sistema foi desenvolvido com foco na experiência do usuário, sendo totalmente responsivo e adaptável a diferentes tamanhos de tela:

- **Desktop**: Interface completa com todas as funcionalidades
- **Tablet**: Layout adaptado para telas médias
- **Mobile**: Interface otimizada para smartphones

## 🎨 Interface do Sistema

### Dashboard Principal
![Dashboard](https://github.com/user-attachments/assets/acbc6d5f-bd52-42a8-ba2a-f3c71477e17e)

### Gestão de Produtos
![Produtos](https://github.com/user-attachments/assets/593a3793-b857-4d4e-a3c7-e2135fd3b8d2)

### Sistema de Vendas
![Vendas](https://github.com/user-attachments/assets/865fb63a-79df-4d68-afd4-f037526f793b)

### Importação de XML
![XML Import](https://github.com/user-attachments/assets/10aef459-b6ee-4ed6-a2cf-0a018a05c680)

## 🏗️ Arquitetura do Sistema

### Estrutura de Arquivos
```
malucosmeticos/
├── index.html              # Dashboard principal
├── produtos.html           # Gestão de produtos
├── vendas.html             # Sistema de vendas
├── clientes.html           # Gestão de clientes
├── historico.html          # Histórico de compras
├── crediario.html          # Gestão de crediário
├── importar-xml.html       # Importação de XML
├── css/
│   └── styles.css          # Estilos principais
└── js/
    ├── common.js           # Funções e classes compartilhadas
    ├── dashboard.js        # Lógica do dashboard
    ├── produtos.js         # Lógica de produtos
    ├── vendas.js           # Lógica de vendas
    ├── clientes.js         # Lógica de clientes
    ├── historico.js        # Lógica do histórico
    ├── crediario.js        # Lógica do crediário
    └── importar-xml.js     # Lógica de importação XML
```

### Classe DataManager
O sistema utiliza uma classe central `DataManager` que gerencia:
- Persistência de dados no LocalStorage
- Operações CRUD para todas as entidades
- Validações e formatações
- Log de atividades do sistema
- Geração de IDs únicos
- Cálculos e estatísticas

## 🔧 Funcionalidades Técnicas

### Validações Implementadas
- **CPF**: Validação com algoritmo oficial brasileiro
- **Estoque**: Controle de disponibilidade em vendas
- **Códigos únicos**: Validação de duplicação de produtos
- **Formulários**: Validação de campos obrigatórios
- **Arquivos XML**: Validação de formato e tamanho

### Integrações de API
- **Notas Fiscais**: Simulação completa de emissão com chave de acesso
- **XML Processing**: Simulação de processamento de notas fiscais

### Recursos Avançados
- **Paginação**: Para listas extensas de dados
- **Filtros**: Sistema de filtros avançados em múltiplas páginas
- **Exportação**: Geração de relatórios em CSV
- **Máscaras**: Formatação automática de CPF, telefone, CEP
- **Responsividade**: Design adaptável a todos os dispositivos

## 🎯 Fluxograma de Desenvolvimento Implementado

✅ **Planejamento**
- Requisitos definidos e implementados
- Tecnologias escolhidas e aplicadas

✅ **Configuração do Ambiente**
- Estrutura do projeto organizada
- Controle de versão com Git

✅ **Desenvolvimento**
- Cadastro de Produtos ✅
- Sistema de Vendas ✅
- Cadastro de Clientes ✅
- Histórico de Compras ✅
- Crediário ✅
- Importação de XML ✅

✅ **Integração com API de Terceiro**
- Comunicação simulada para emissão de notas fiscais ✅

✅ **Testes**
- Testes funcionais realizados ✅
- Validação de fluxos completos ✅

✅ **Deploy**
- Sistema pronto para publicação ✅

## 📞 Suporte e Manutenção

O sistema foi desenvolvido com foco na facilidade de manutenção:

- **Código modular**: Cada funcionalidade em arquivo separado
- **Comentários**: Código documentado para facilitar manutenção
- **Padrões**: Seguindo boas práticas de desenvolvimento
- **Escalabilidade**: Estrutura preparada para futuras expansões

## 🚀 Próximos Passos

Para um ambiente de produção, considere implementar:

1. **Backend robusto** com banco de dados real
2. **Autenticação** e controle de acesso
3. **APIs reais** para emissão de notas fiscais
4. **Backup automático** dos dados
5. **Relatórios avançados** com gráficos
6. **Integração com sistemas contábeis**
7. **App mobile** nativo

---

**Desenvolvido por**: Sistema seguindo o fluxograma completo de desenvolvimento para gestão de negócios de cosméticos.

**Versão**: 1.0.0

**Licença**: MIT