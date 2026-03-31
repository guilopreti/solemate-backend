# 👟 SoleMate — Backend API

API REST backend da loja de tênis **SoleMate**, desenvolvida com **Node.js + Express + TypeScript**, integrada ao **Azure Blob Storage** e **Azure Table Storage**.

---

## Tecnologias

| Tecnologia          | Finalidade                        |
|---------------------|-----------------------------------|
| Node.js + Express   | Servidor HTTP e roteamento        |
| TypeScript          | Tipagem estática                  |
| Azure Table Storage | Persistência NoSQL de dados       |
| Azure Blob Storage  | Armazenamento de imagens          |
| Multer              | Upload de arquivos multipart      |
| tsx                 | Hot-reload em desenvolvimento     |

---

## Estrutura do Projeto

```text
backend/
├── src/
│   ├── config/
│   │   └── azure.ts          # Clientes Azure (Table + Blob)
│   ├── services/
│   │   ├── tableService.ts   # CRUD Table Storage
│   │   └── blobService.ts    # Upload/delete de imagens
│   ├── routes/
│   │   ├── produtos.ts       # Rotas de produtos
│   │   ├── clientes.ts       # Rotas de clientes
│   │   └── pedidos.ts        # Rotas de pedidos
│   └── index.ts              # Ponto de entrada
├── .env
├── .gitignore
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## Como Executar

### Pré-requisitos

- Node.js 20+
- Yarn

### Instalação

# Instalar dependências
yarn

# Iniciar servidor de desenvolvimento (com hot-reload)
yarn dev

# Compilar para produção
yarn build

# Iniciar servidor de produção
yarn start

O servidor será iniciado em http://localhost:3001 por padrão.

---

## Variáveis de Ambiente

Crie um arquivo .env na raiz do projeto com as seguintes variáveis:

PORT=3001
AZURE_STORAGE_CONNECTION_STRING=sua_connection_string_aqui
AZURE_STORAGE_ACCOUNT_NAME=nome_da_conta

BLOB_CONTAINER_NAME=nome-do-container

TABLE_PRODUTOS=SuaTabelaProdutos
TABLE_CLIENTES=SuaTabelaClientes
TABLE_PEDIDOS=SuaTabelaPedidos

> As tabelas do Azure e o container Blob são criados automaticamente na primeira inicialização, caso não existam.

---

## Referência da API

### Produtos — /api/produtos

| Método   | Endpoint          | Descrição               | Body                                                                            |
|----------|-------------------|-------------------------|---------------------------------------------------------------------------------|
| GET      | /api/produtos     | Lista todos os produtos | Query: ?marca=&modelo=&valorMin=&valorMax=                                      |
| POST     | /api/produtos     | Cria um produto         | multipart/form-data: marca, modelo, valor, quantidade, foto (arquivo)           |
| PUT      | /api/produtos/:id | Atualiza um produto     | JSON com os campos a atualizar                                                  |
| DELETE   | /api/produtos/:id | Remove produto + imagem | —                                                                               |

### Clientes — /api/clientes

| Método   | Endpoint                    | Descrição                  | Body                                      |
|----------|-----------------------------|----------------------------|-------------------------------------------|
| GET      | /api/clientes               | Lista todos os clientes    | —                                         |
| POST     | /api/clientes               | Cria um cliente            | { nome, email, telefone, endereco }       |
| PUT      | /api/clientes/:id           | Atualiza um cliente        | JSON com os campos a atualizar            |
| DELETE   | /api/clientes/:id           | Remove um cliente          | —                                         |
| GET      | /api/clientes/:id/pedidos   | Lista pedidos do cliente   | —                                         |

### Pedidos — /api/pedidos

| Método   | Endpoint       | Descrição                    | Body                                                                            |
|----------|----------------|------------------------------|---------------------------------------------------------------------------------|
| GET      | /api/pedidos   | Lista todos os pedidos       | —                                                                               |
| POST     | /api/pedidos   | Cria um pedido (checkout)    | { clienteId, produtoId, quantidade, metodoPagamento, metodoEntrega }            |

#### Lógica do Checkout

1. Valida a quantidade solicitada contra o estoque disponível
2. Valida que o preço do produto é maior que zero
3. Cria o registro do pedido
4. Decrementa o estoque do produto automaticamente

#### Métodos de pagamento
"Pix"  •  "Cartão"  •  "Boleto"

#### Métodos de entrega
"Entrega"  •  "Retirada"

---

## Testando com Insomnia

> Sem autenticação — a API é aberta. Qualquer requisição pode criar, atualizar ou remover registros.

### Fluxo obrigatório

O pedido (checkout) depende de um produto e de um cliente já cadastrados. A ordem correta é:

1. Criar produto  →  guardar o "id" da resposta
2. Criar cliente  →  guardar o "id" da resposta
3. Criar pedido   →  usar os dois ids acima

---

### Passo 1 — Criar um produto

POST http://localhost:3001/api/produtos
Content-Type: multipart/form-data

campos:
  marca      → "Nike"
  modelo     → "Air Max 90"
  valor      → "799.90"
  quantidade → "15"
  foto       → [selecionar arquivo de imagem]

Resposta:
{
  "id": "uuid-do-produto",
  "marca": "Nike",
  "modelo": "Air Max 90",
  "valor": "799.90",
  "quantidade": "15",
  "imageUrl": "https://stocompnuvem2p1.blob.core.windows.net/..."
}

> No Insomnia: selecione Multipart Form. O campo foto deve ser do tipo File.

---

### Passo 2 — Criar um cliente

POST http://localhost:3001/api/clientes
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "11999998888",
  "endereco": "Rua das Flores, 123 - São Paulo/SP"
}

Resposta:
{
  "id": "uuid-do-cliente",
  "nome": "João Silva",
  ...
}

---

### Passo 3 — Criar um pedido (checkout)

POST http://localhost:3001/api/pedidos
Content-Type: application/json

{
  "clienteId": "uuid-do-cliente",
  "produtoId": "uuid-do-produto",
  "quantidade": 2,
  "metodoPagamento": "Pix",
  "metodoEntrega": "Entrega"
}

Resposta:
{
  "id": "uuid-do-pedido",
  "valorTotal": 1599.80,
  "status": "confirmado"
}

> O estoque do tênis é decrementado automaticamente após o pedido.