import { blobServiceClient } from "../config/azure";
import { v4 as uuidv4 } from "uuid";

const containerName = process.env.BLOB_CONTAINER_NAME!;

export async function uploadImagem(
  buffer: Buffer,
  mimetype: string,
  originalname: string
): Promise<{ url: string; nomeArquivo: string }> {
  const ext = originalname.split(".").pop();
  const nomeArquivo = `${uuidv4()}.${ext}`;
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(nomeArquivo);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimetype },
  });

  return { url: blockBlobClient.url, nomeArquivo };
}

export async function deleteImagem(nomeArquivo: string): Promise<void> {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(nomeArquivo);
  await blockBlobClient.deleteIfExists();
}
