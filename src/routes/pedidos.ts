import { Router } from "express";
import { supabase } from "../config/supabase";

const router = Router();

function mapper(dbItem: any) {
  if (!dbItem) return dbItem;
  return {
    partitionKey: "pedido",
    rowKey: dbItem.id,
    id: dbItem.id,
    clienteId: dbItem.cliente_id,
    clienteNome: dbItem.cliente_nome,
    produtoId: dbItem.produto_id,
    produtoNome: dbItem.produto_nome,
    quantidade: dbItem.quantidade,
    valorUnitario: parseFloat(dbItem.valor_unitario),
    valorTotal: parseFloat(dbItem.valor_total),
    metodoPagamento: dbItem.metodo_pagamento,
    metodoEntrega: dbItem.metodo_entrega,
    status: dbItem.status,
    dataPedido: dbItem.data_pedido
  };
}

// GET /api/pedidos
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("pedidos").select("*");
    if (error) throw error;
    res.json(data ? data.map(mapper) : []);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/pedidos (checkout)
router.post("/", async (req, res) => {
  try {
    const { clienteId, produtoId, quantidade, metodoPagamento, metodoEntrega } = req.body;
    const qtd = parseInt(quantidade);

    const { data: produto, error: errProd } = await supabase.from("produtos").select("*").eq("id", produtoId).single();
    if (errProd || !produto) return res.status(404).json({ error: "Produto não encontrado" }) as any;

    const { data: cliente, error: errCli } = await supabase.from("clientes").select("*").eq("id", clienteId).single();
    if (errCli || !cliente) return res.status(404).json({ error: "Cliente não encontrado" }) as any;

    if (qtd <= 0) return res.status(400).json({ error: "Quantidade inválida" }) as any;
    if (qtd > produto.quantidade) return res.status(400).json({ error: "Estoque insuficiente" }) as any;
    if (parseFloat(produto.valor) <= 0) return res.status(400).json({ error: "Valor inválido" }) as any;

    const valorTotal = qtd * parseFloat(produto.valor);

    const { data: insertedData, error: errInsert } = await supabase.from("pedidos").insert({
      cliente_id: clienteId, 
      cliente_nome: cliente.nome,
      produto_id: produtoId, 
      produto_nome: `${produto.marca} ${produto.modelo}`,
      quantidade: qtd,
      valor_unitario: produto.valor,
      valor_total: valorTotal,
      metodo_pagamento: metodoPagamento, 
      metodo_entrega: metodoEntrega,
      status: "confirmado",
      data_pedido: new Date().toISOString()
    }).select().single();

    if (errInsert) throw errInsert;

    await supabase.from("produtos").update({
      quantidade: produto.quantidade - qtd
    }).eq("id", produtoId);

    res.status(201).json({ id: insertedData.id, valorTotal, status: "confirmado" });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
