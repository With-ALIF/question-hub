export type SupabaseConfig = {
  url: string;
  anonKey: string;
};


export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"]?.trim();
  const anonKey =
    process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]?.trim() ??
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
