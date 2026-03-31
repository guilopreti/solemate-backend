import { TableServiceClient } from "@azure/data-tables";
import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;

export const tableServiceClient = TableServiceClient.fromConnectionString(connectionString);
export const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

export async function ensureAzureResources() {
  const tables = [
    process.env.TABLE_PRODUTOS!,
    process.env.TABLE_CLIENTES!,
    process.env.TABLE_PEDIDOS!,
  ];
  for (const table of tables) {
    await tableServiceClient.createTable(table).catch(() => {});
  }

  const containerClient = blobServiceClient.getContainerClient(process.env.BLOB_CONTAINER_NAME!);
  await containerClient.createIfNotExists({ access: "blob" });
  console.log("Azure resources OK");
}
