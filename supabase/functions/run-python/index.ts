import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ error: "Code is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Try multiple Piston API endpoints for reliability
    const endpoints = [
      "https://emkc.org/api/v2/piston/execute",
      "https://piston-api.e-z.host/api/v2/execute",
    ];

    let lastError = "";

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            language: "python",
            version: "3.10.0",
            files: [{ name: "main.py", content: code }],
          }),
        });

        clearTimeout(timeout);

        if (!response.ok) {
          lastError = `${endpoint} returned ${response.status}`;
          const body = await response.text();
          console.error(lastError, body);
          continue;
        }

        const result = await response.json();

        return new Response(
          JSON.stringify({
            output: result.run?.stdout || "",
            error: result.run?.stderr || null,
            exitCode: result.run?.code || 0,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        console.error(`Piston endpoint ${endpoint} failed:`, lastError);
        continue;
      }
    }

    return new Response(
      JSON.stringify({ error: `All execution endpoints failed. Last error: ${lastError}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
