import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { listarEntidades, buscarEntidade, criarEntidade, atualizarEntidade, deletarEntidade } from "../services/tableService";

const router = Router();
const TABLE = process.env.TABLE_CLIENTES!;
const TABLE_PEDIDOS = process.env.TABLE_PEDIDOS!;
const PARTITION = "cliente";

// GET /api/clientes
router.get("/", async (req, res) => {
  try {
    const clientes = await listarEntidades(TABLE, PARTITION);
    res.json(clientes);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/clientes
router.post("/", async (req, res) => {
  try {
    const { nome, email, telefone, endereco } = req.body;
    const rowKey = uuidv4();
    await criarEntidade(TABLE, { partitionKey: PARTITION, rowKey, nome, email, telefone, endereco });
    res.status(201).json({ id: rowKey, nome, email, telefone, endereco });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/clientes/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await atualizarEntidade(TABLE, { partitionKey: PARTITION, rowKey: id, ...req.body });
    res.json({ updated: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/clientes/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar todos os pedidos do sistema para encontrar os do cliente
    const todosPedidos: any[] = await listarEntidades(TABLE_PEDIDOS, "pedido");
    const pedidosCliente = todosPedidos.filter(p => p.clienteId === id);

    // Deletar os pedidos do cliente um por um
    for (const pedido of pedidosCliente) {
      await deletarEntidade(TABLE_PEDIDOS, "pedido", pedido.rowKey);
    }

    // Por fim, deletar o cliente
    await deletarEntidade(TABLE, PARTITION, id);
    
    res.json({ deleted: true, pedidosDeletados: pedidosCliente.length });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/clientes/:id/pedidos
router.get("/:id/pedidos", async (req, res) => {
  try {
    const { id } = req.params;
    const todosPedidos: any[] = await listarEntidades(TABLE_PEDIDOS, "pedido");
    const pedidosCliente = todosPedidos.filter(p => p.clienteId === id);
    res.json(pedidosCliente);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
