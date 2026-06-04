import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { license_key, device_id, action } = body;

    if (!license_key) {
      return new Response(JSON.stringify({ valid: false, error: "License key required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the license
    const { data: license, error: licErr } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", license_key.trim())
      .maybeSingle();

    if (licErr || !license) {
      return new Response(JSON.stringify({ valid: false, error: "Invalid license key" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check status
    if (license.status === "suspended") {
      return new Response(JSON.stringify({ valid: false, error: "License suspended" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry (lifetime = no expires_at)
    if (license.expires_at) {
      const expiry = new Date(license.expires_at);
      if (expiry < new Date()) {
        // Auto-update status
        await supabase.from("licenses").update({ status: "expired" }).eq("id", license.id);
        return new Response(JSON.stringify({ valid: false, error: "License expired" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Device tracking (heartbeat)
    if (device_id) {
      const { data: existingDevices } = await supabase
        .from("license_devices")
        .select("id, device_id")
        .eq("license_id", license.id);

      const deviceCount = existingDevices?.length || 0;
      const deviceExists = existingDevices?.some((d: any) => d.device_id === device_id);

      if (!deviceExists && deviceCount >= license.max_devices) {
        return new Response(
          JSON.stringify({ valid: false, error: "Max devices reached. Contact support." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upsert device heartbeat
      await supabase.from("license_devices").upsert(
        { license_id: license.id, device_id, last_seen: new Date().toISOString() },
        { onConflict: "license_id,device_id" }
      );
    }

    // Get role
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("license_id", license.id)
      .maybeSingle();

    const role = roleRow?.role || "user";

    return new Response(
      JSON.stringify({
        valid: true,
        status: license.status,
        plan: license.plan,
        user_name: license.user_name,
        user_email: license.user_email,
        expires_at: license.expires_at,
        activated_at: license.activated_at,
        role,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ valid: false, error: err.message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
