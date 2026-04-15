import { Router, Request, Response } from "express";
import multer from "multer";
import { supabase } from "../config/supabase";
import { uploadImagem, deleteImagem } from "../services/blobService";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function mapper(dbItem: any) {
  if (!dbItem) return dbItem;
  return {
    partitionKey: "produto",
    rowKey: dbItem.id,
    id: dbItem.id,
    marca: dbItem.marca,
    modelo: dbItem.modelo,
    valor: parseFloat(dbItem.valor),
    quantidade: dbItem.quantidade,
    imageUrl: dbItem.image_url,
    nomeArquivo: dbItem.nome_arquivo
  };
}

// GET /api/produtos?marca=&modelo=&valorMin=&valorMax=
router.get("/", async (req, res) => {
  try {
    let query = supabase.from("produtos").select("*");
    
    const { marca, modelo, valorMin, valorMax } = req.query;
    
    if (marca) query = query.ilike("marca", `%${marca}%`);
    if (modelo) query = query.ilike("modelo", `%${modelo}%`);
    if (valorMin) query = query.gte("valor", parseFloat(valorMin as string));
    if (valorMax) query = query.lte("valor", parseFloat(valorMax as string));

    const { data, error } = await query;
    if (error) throw error;

    res.json(data ? data.map(mapper) : []);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/produtos (multipart/form-data)
router.post("/", upload.single("foto") as any, async (req: Request, res: Response) => {
  try {
    const { marca, modelo, valor, quantidade } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Imagem obrigatória" }) as any;

    const { url: imageUrl, nomeArquivo } = await uploadImagem(file.buffer, file.mimetype, file.originalname);

    const { data: insertedData, error } = await supabase.from("produtos").insert({
      marca,
      modelo,
      valor: parseFloat(valor),
      quantidade: parseInt(quantidade),
      image_url: imageUrl,
      nome_arquivo: nomeArquivo
    }).select().single();

    if (error) throw error;

    res.status(201).json(mapper(insertedData));
  } catch (e: any) { 
    res.status(500).json({ error: e.message }); 
  }
});

// PUT /api/produtos/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { marca, modelo, valor, quantidade } = req.body;
    
    const updatePayload: any = {};
    if (marca !== undefined) updatePayload.marca = marca;
    if (modelo !== undefined) updatePayload.modelo = modelo;
    if (valor !== undefined) updatePayload.valor = parseFloat(valor);
    if (quantidade !== undefined) updatePayload.quantidade = parseInt(quantidade);

    const { error } = await supabase.from("produtos").update(updatePayload).eq("id", id);
    if (error) throw error;

    res.json({ updated: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/produtos/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: produto, error: fetchError } = await supabase.from("produtos").select("nome_arquivo").eq("id", id).single();
    if (fetchError) throw fetchError;

    if (produto?.nome_arquivo) {
      await deleteImagem(produto.nome_arquivo);
    }

    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) throw error;

    res.json({ deleted: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
