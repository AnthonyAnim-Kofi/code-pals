import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Verify this is being called by the cron scheduler (optional security check)
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    // If CRON_SECRET is set, verify it
    if (cronSecret) {
      const providedSecret = authHeader?.replace("Bearer ", "");
      if (providedSecret !== cronSecret) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { 
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }

    const ossHost = Deno.env.get("OSS_HOST")!;
    const adminKeySecret = Deno.env.get("API_KEY")!;
    const supabaseClient = createClient(ossHost, adminKeySecret);

    // Call the database function to process weekly leagues
    const { data, error } = await supabaseClient.rpc("process_weekly_leagues");

    if (error) {
      console.error("Error processing weekly leagues:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Weekly league reset completed successfully",
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
