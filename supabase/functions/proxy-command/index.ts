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
    const { license_key, device_id, lovable_token, project_id, message, model, browser_session_id, attachments, plan_mode } = body;

    if (!license_key) {
      return new Response(JSON.stringify({ ok: false, error: "License key required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate license
    const { data: license } = await supabase
      .from("licenses")
      .select("id, status, expires_at, plan")
      .eq("license_key", license_key.trim())
      .maybeSingle();

    if (!license || license.status === "suspended" || license.status === "expired") {
      return new Response(JSON.stringify({ ok: false, error: "Invalid or expired license" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return new Response(JSON.stringify({ ok: false, error: "License expired" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!lovable_token || !project_id || !message) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableUrl = `https://lovable-api.com/projects/${project_id}/messages`;

    const payload: any = {
      content: message,
      model: model || "gpt-4o",
      plan_mode: plan_mode || false,
    };

    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    const resp = await fetch(lovableUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovable_token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Origin": "https://lovable.dev",
        "Referer": `https://lovable.dev/projects/${project_id}`,
        ...(browser_session_id ? { "X-Browser-Session-ID": browser_session_id } : {}),
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return new Response(JSON.stringify({ ok: resp.ok, status: resp.status, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
