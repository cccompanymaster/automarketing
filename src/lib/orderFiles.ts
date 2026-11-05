// Order attachments (원고·사진 파일) in the private "order-files" bucket.
// Members upload into their own folder (<uid>/<uuid>.<ext>); storage keys are
// ASCII-only, so the original file name travels in OrderFile.name. Admins read
// through short-lived signed URLs. Stub mode keeps only the names.

import { getSupabase } from "@/lib/supabase";
import { FILE_MAX_BYTES, FILES_MAX, type OrderFile } from "@/lib/orderForms";

const BUCKET = "order-files";

/** What the file picker accepts. */
export const ORDER_FILE_ACCEPT = "image/*,.pdf,.doc,.docx,.hwp,.hwpx,.txt,.rtf,.ppt,.pptx,.xls,.xlsx,.zip";

const ALLOWED = /\.(jpe?g|png|gif|webp|heic|heif|bmp|pdf|docx?|hwpx?|txt|rtf|pptx?|xlsx?|zip)$/i;

/** Why a file can't be attached, or null when it's fine. */
export function fileProblem(file: File, already: number): string | null {
  if (already >= FILES_MAX) return `파일은 최대 ${FILES_MAX}개까지 올릴 수 있어요.`;
  if (file.size > FILE_MAX_BYTES) return `${file.name}: 파일당 20MB까지 올릴 수 있어요.`;
  if (!ALLOWED.test(file.name)) return `${file.name}: 이미지·문서(한글·워드·PDF 등)·압축 파일만 올릴 수 있어요.`;
  return null;
}

const uuid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export async function uploadOrderFile(file: File): Promise<OrderFile> {
  const sb = getSupabase();
  const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] ?? "bin").toLowerCase();
  if (!sb) return { path: `local/${uuid()}.${ext}`, name: file.name, size: file.size };
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("로그인이 필요해요.");
  const path = `${uid}/${uuid()}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw new Error(`${file.name}: 올리지 못했어요. 다시 시도해 주세요.`);
  return { path, name: file.name, size: file.size };
}

/** Drop an attachment the member removed before ordering (best effort). */
export async function removeOrderFile(path: string): Promise<void> {
  const sb = getSupabase();
  if (!sb || path.startsWith("local/")) return;
  await sb.storage.from(BUCKET).remove([path]);
}

/** Short-lived download link (owner or admin). */
export async function orderFileUrl(path: string): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error("데모 모드에서는 파일을 열 수 없어요.");
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, 600);
  if (error || !data) throw new Error("파일 링크를 만들지 못했어요.");
  return data.signedUrl;
}

export function formatBytes(n: number): string {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`;
}
