import { Router } from "express";
import { supabase } from "../config/supabase";

const router = Router();

function mapper(dbItem: any) {
  if (!dbItem) return dbItem;
  return {
    partitionKey: "cliente",
    rowKey: dbItem.id,
    id: dbItem.id,
    nome: dbItem.nome,
    email: dbItem.email,
    telefone: dbItem.telefone,
    endereco: dbItem.endereco
  };
}

// GET /api/clientes
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("clientes").select("*");
    if (error) throw error;
    res.json(data ? data.map(mapper) : []);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/clientes
router.post("/", async (req, res) => {
  try {
    const { nome, email, telefone, endereco } = req.body;
    const { data: insertedData, error } = await supabase.from("clientes").insert({
      nome, email, telefone, endereco
    }).select().single();
    if (error) throw error;
    res.status(201).json(mapper(insertedData));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/clientes/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone, endereco } = req.body;
    
    const updatePayload: any = {};
    if (nome !== undefined) updatePayload.nome = nome;
    if (email !== undefined) updatePayload.email = email;
    if (telefone !== undefined) updatePayload.telefone = telefone;
    if (endereco !== undefined) updatePayload.endereco = endereco;

    const { error } = await supabase.from("clientes").update(updatePayload).eq("id", id);
    if (error) throw error;
    res.json({ updated: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/clientes/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Postgres ON DELETE CASCADE já lida com exclusão dos pedidos vinculados
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) throw error;
    
    res.json({ deleted: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/clientes/:id/pedidos
router.get("/:id/pedidos", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from("pedidos").select("*").eq("cliente_id", id);
    if (error) throw error;
    
    const mapped = data?.map(dbItem => ({
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
    })) || [];
    res.json(mapped);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
