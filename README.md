# 👟 SoleMate — Backend API

API REST backend da loja de tênis **SoleMate**, desenvolvida com **Node.js + Express + TypeScript**, integrada ao **Supabase (PostgreSQL e Storage)**.

---

## Tecnologias

| Tecnologia          | Finalidade                        |
|---------------------|-----------------------------------|
| Node.js + Express   | Servidor HTTP e roteamento        |
| TypeScript          | Tipagem estática                  |
| Supabase PostgreSQL | Persistência de dados relacional  |
| Supabase Storage    | Armazenamento de imagens          |
| Multer              | Upload de arquivos multipart      |
| tsx                 | Hot-reload em desenvolvimento     |

---

## Estrutura do Projeto

```text
backend/
├── src/
│   ├── config/
│   │   └── supabase.ts       # Cliente do Supabase
│   ├── services/
│   │   └── blobService.ts    # Upload/delete de imagens no Storage
│   ├── routes/
│   │   ├── produtos.ts       # Rotas de produtos
│   │   ├── clientes.ts       # Rotas de clientes
│   │   └── pedidos.ts        # Rotas de pedidos
│   └── index.ts              # Ponto de entrada
├── .env
├── .gitignore
├── Dockerfile
├── package.json
├── supabase_schema.sql
├── tsconfig.json
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
SUPABASE_URL=https://<SUA_URL_SUPABASE>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<SUA_CHAVE_SERVICE_ROLE>
SUPABASE_BUCKET=product-images

> Para inicializar as tabelas, execute o comando SQL fornecido no arquivo `supabase_schema.sql` diretamente no painel do Supabase.

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
  "imageUrl": "https://<your_supabase_url>/storage/v1/object/public/product-images/..."
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