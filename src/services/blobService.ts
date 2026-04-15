import { supabase } from "../config/supabase";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();

const bucketName = process.env.SUPABASE_BUCKET!;

export async function uploadImagem(
  buffer: Buffer,
  mimetype: string,
  originalname: string
): Promise<{ url: string; nomeArquivo: string }> {
  const ext = originalname.split(".").pop();
  const nomeArquivo = `${uuidv4()}.${ext}`;
  
  const { error } = await supabase.storage.from(bucketName).upload(nomeArquivo, buffer, {
    contentType: mimetype,
  });

  if (error) throw new Error(`Falha no upload do Supabase: ${error.message}`);

  const { data } = supabase.storage.from(bucketName).getPublicUrl(nomeArquivo);

  return { url: data.publicUrl, nomeArquivo };
}

export async function deleteImagem(nomeArquivo: string): Promise<void> {
  await supabase.storage.from(bucketName).remove([nomeArquivo]);
}
