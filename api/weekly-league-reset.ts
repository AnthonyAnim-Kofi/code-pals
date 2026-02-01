/**
 * Vercel Cron: triggers weekly league promotion/demotion.
 * Schedule in vercel.json: "0 0 * * 0" = every Sunday midnight UTC.
 * Env: SUPABASE_URL, SUPABASE_ANON_KEY (or VITE_SUPABASE_*), CRON_SECRET (optional).
 */
export default async function handler(
  req: { method?: string; headers?: { authorization?: string } },
  res: { status: (n: number) => { json: (d: object) => void } }
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const CRON_SECRET = process.env.CRON_SECRET;
  if (CRON_SECRET && req.headers?.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: "SUPABASE_URL and SUPABASE_ANON_KEY required" });
  }
  const url = `${String(SUPABASE_URL).replace(/\/$/, "")}/functions/v1/weekly-league-reset`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json(data as object);
    }
    return res.status(200).json(data as object);
  } catch (e) {
    console.error("weekly-league-reset error:", e);
    return res.status(500).json({ error: "Failed to trigger weekly league reset" });
  }
}
