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
    const { adminKey } = await req.json();
    const storedAdminKey = Deno.env.get("ADMIN_KEY");

    if (!storedAdminKey) {
      return new Response(
        JSON.stringify({ valid: false, error: "Admin key not configured" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (adminKey !== storedAdminKey) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid admin key" }),
        { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ valid: false, error: "Not authenticated" }),
        { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // InsForge automatically populates OSS_HOST and API_KEY (service role)
    const ossHost = Deno.env.get("OSS_HOST")!;
    const adminKeySecret = Deno.env.get("API_KEY")!;
    const supabaseClient = createClient(ossHost, adminKeySecret);

    // Verify the JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid token" }),
        { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check if user already has admin role
    const { data: existingRole } = await supabaseClient
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    // If not admin, grant admin role
    if (!existingRole) {
      const { error: insertError } = await supabaseClient
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin" });

      if (insertError) {
        console.error("Error granting admin role:", insertError);
      }
    }

    return new Response(
      JSON.stringify({ valid: true, userId: user.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ valid: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
