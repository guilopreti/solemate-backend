import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ensureAzureResources } from "./config/azure";
import produtosRouter from "./routes/produtos";
import clientesRouter from "./routes/clientes";
import pedidosRouter from "./routes/pedidos";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/produtos", produtosRouter);
app.use("/api/clientes", clientesRouter);
app.use("/api/pedidos", pedidosRouter);

app.get("/", (_, res) => res.json({ status: "ok" }));

ensureAzureResources().then(() => {
  app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`));
});
