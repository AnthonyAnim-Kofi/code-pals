// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code, language = "python", version = "*" } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ error: "Code is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    try {
      // Forward the user's Python code to the free Piston Code Execution API
      const pistonResponse = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: language,
          version: version, // Let Piston auto-select the main version if "*" is passed
          files: [
            {
              name: "main.py",
              content: code,
            },
          ],
        }),
      });

      if (!pistonResponse.ok) {
        throw new Error(`Piston API Error: ${pistonResponse.status} ${pistonResponse.statusText}`);
      }

      const pistonResult = await pistonResponse.json();
      
      // Extract stdout and stderr from Piston's run object
      const output = pistonResult.run.stdout || "";
      const error = pistonResult.run.stderr || "";
      const exitCode = pistonResult.run.code || 0;

      // If there's an error string, throw it to jump to the catch block
      if (error && exitCode !== 0) {
        throw new Error(error);
      }

      return new Response(
        JSON.stringify({ 
          output: output.trim(), 
          error: null, 
          exitCode 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );

    } catch (executionError) {
      const message = executionError instanceof Error ? executionError.message : "Execution failed";
      return new Response(
        JSON.stringify({ output: "", error: message, exitCode: 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
