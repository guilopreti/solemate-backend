import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { listarEntidades, buscarEntidade, criarEntidade, atualizarEntidade } from "../services/tableService";

const router = Router();
const TABLE_PEDIDOS = process.env.TABLE_PEDIDOS!;
const TABLE_PRODUTOS = process.env.TABLE_PRODUTOS!;
const TABLE_CLIENTES = process.env.TABLE_CLIENTES!;

// GET /api/pedidos
router.get("/", async (req, res) => {
  try {
    const pedidos = await listarEntidades(TABLE_PEDIDOS, "pedido");
    res.json(pedidos);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/pedidos (checkout)
router.post("/", async (req, res) => {
  try {
    const { clienteId, produtoId, quantidade, metodoPagamento, metodoEntrega } = req.body;
    const qtd = parseInt(quantidade);

    const produto: any = await buscarEntidade(TABLE_PRODUTOS, "produto", produtoId);
    const cliente: any = await buscarEntidade(TABLE_CLIENTES, "cliente", clienteId);

    if (qtd <= 0) return res.status(400).json({ error: "Quantidade inválida" }) as any;
    if (qtd > produto.quantidade) return res.status(400).json({ error: "Estoque insuficiente" }) as any;
    if (produto.valor <= 0) return res.status(400).json({ error: "Valor inválido" }) as any;

    const valorTotal = qtd * produto.valor;
    const rowKey = uuidv4();

    await criarEntidade(TABLE_PEDIDOS, {
      partitionKey: "pedido", rowKey,
      clienteId, clienteNome: cliente.nome,
      produtoId, produtoNome: `${produto.marca} ${produto.modelo}`,
      quantidade: qtd,
      valorUnitario: produto.valor,
      valorTotal,
      metodoPagamento, metodoEntrega,
      status: "confirmado",
      dataPedido: new Date().toISOString(),
    });

    await atualizarEntidade(TABLE_PRODUTOS, {
      partitionKey: "produto", rowKey: produtoId,
      quantidade: produto.quantidade - qtd,
    });

    res.status(201).json({ id: rowKey, valorTotal, status: "confirmado" });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
