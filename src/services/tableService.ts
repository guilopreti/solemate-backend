import { TableClient, TableEntity, odata } from "@azure/data-tables";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;

function getClient(tableName: string) {
  return TableClient.fromConnectionString(connectionString, tableName);
}

export async function listarEntidades<T>(tableName: string, partitionKey: string): Promise<T[]> {
  const tableClient = getClient(tableName);
  const entities: T[] = [];
  const iter = tableClient.listEntities<TableEntity>({
    queryOptions: { filter: odata`PartitionKey eq ${partitionKey}` },
  });
  for await (const entity of iter) {
    entities.push(entity as unknown as T);
  }
  return entities;
}

export async function buscarEntidade<T>(tableName: string, partitionKey: string, rowKey: string): Promise<T> {
  const tableClient = getClient(tableName);
  const entity = await tableClient.getEntity(partitionKey, rowKey);
  return entity as unknown as T;
}

export async function criarEntidade(tableName: string, entity: TableEntity): Promise<void> {
  const tableClient = getClient(tableName);
  await tableClient.createEntity(entity);
}

export async function atualizarEntidade(tableName: string, entity: TableEntity): Promise<void> {
  const tableClient = getClient(tableName);
  await tableClient.updateEntity(entity, "Merge");
}

export async function deletarEntidade(tableName: string, partitionKey: string, rowKey: string): Promise<void> {
  const tableClient = getClient(tableName);
  await tableClient.deleteEntity(partitionKey, rowKey);
}
