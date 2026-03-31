import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { listarEntidades, buscarEntidade, criarEntidade, atualizarEntidade, deletarEntidade } from "../services/tableService";
import { uploadImagem, deleteImagem } from "../services/blobService";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const TABLE = process.env.TABLE_PRODUTOS!;
const PARTITION = "produto";

// GET /api/produtos?marca=&modelo=&valorMin=&valorMax=
router.get("/", async (req, res) => {
  try {
    let produtos: any[] = await listarEntidades(TABLE, PARTITION);
    const { marca, modelo, valorMin, valorMax } = req.query;
    if (marca) produtos = produtos.filter(p => p.marca?.toLowerCase().includes((marca as string).toLowerCase()));
    if (modelo) produtos = produtos.filter(p => p.modelo?.toLowerCase().includes((modelo as string).toLowerCase()));
    if (valorMin) produtos = produtos.filter(p => p.valor >= parseFloat(valorMin as string));
    if (valorMax) produtos = produtos.filter(p => p.valor <= parseFloat(valorMax as string));
    res.json(produtos);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/produtos (multipart/form-data)
router.post("/", upload.single("foto") as any, async (req: Request, res: Response) => {
  try {
    const { marca, modelo, valor, quantidade } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Imagem obrigatória" }) as any;

    const { url: imageUrl, nomeArquivo } = await uploadImagem(file.buffer, file.mimetype, file.originalname);
    const rowKey = uuidv4();

    await criarEntidade(TABLE, {
      partitionKey: PARTITION, rowKey,
      marca, modelo,
      valor: parseFloat(valor),
      quantidade: parseInt(quantidade),
      imageUrl, nomeArquivo,
    });

    res.status(201).json({ id: rowKey, marca, modelo, valor, quantidade, imageUrl });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/produtos/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await atualizarEntidade(TABLE, { partitionKey: PARTITION, rowKey: id, ...req.body });
    res.json({ updated: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/produtos/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const produto: any = await buscarEntidade(TABLE, PARTITION, id);
    if (produto?.nomeArquivo) await deleteImagem(produto.nomeArquivo);
    await deletarEntidade(TABLE, PARTITION, id);
    res.json({ deleted: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
