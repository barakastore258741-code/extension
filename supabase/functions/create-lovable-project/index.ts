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
    const { license_key, lovable_token, project_name, prompt, browser_session_id } = body;

    if (!license_key) {
      return new Response(JSON.stringify({ ok: false, error: "License key required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: license } = await supabase
      .from("licenses")
      .select("id, status, expires_at")
      .eq("license_key", license_key.trim())
      .maybeSingle();

    if (!license || license.status === "suspended" || license.status === "expired") {
      return new Response(JSON.stringify({ ok: false, error: "Invalid or expired license" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return new Response(JSON.stringify({ ok: false, error: "License expired" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!lovable_token) {
      return new Response(JSON.stringify({ ok: false, error: "Missing token" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch("https://lovable-api.com/projects", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovable_token}`,
        "Content-Type": "application/json",
        "Origin": "https://lovable.dev",
        "Referer": "https://lovable.dev/",
        ...(browser_session_id ? { "X-Browser-Session-ID": browser_session_id } : {}),
      },
      body: JSON.stringify({ name: project_name || "New Project", prompt: prompt || "" }),
    });

    const text = await resp.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return new Response(JSON.stringify({ ok: resp.ok, status: resp.status, data }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message || "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
