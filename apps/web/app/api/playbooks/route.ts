import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const { name, description, yaml_source, config } = await request.json();

  if (!name || !yaml_source) {
    return NextResponse.json(
      { error: "name and yaml_source are required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Count steps and guardrails from config
  const steps = config?.steps ?? [];
  const hardStops = config?.guardrails?.hard_stops ?? [];
  const softWarnings = config?.guardrails?.soft_warnings ?? [];
  const compliance = config?.guardrails?.compliance ?? [];

  const { data, error } = await supabase
    .from("playbooks")
    .insert({
      tenant_id: "00000000-0000-0000-0000-000000000000", // default tenant until auth
      name,
      description: description ?? "",
      config: config ?? {},
      yaml_source,
      step_count: steps.length,
      guardrail_count: hardStops.length + softWarnings.length + compliance.length,
      status: "draft",
      created_by: "00000000-0000-0000-0000-000000000000", // anonymous until auth
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("playbooks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
