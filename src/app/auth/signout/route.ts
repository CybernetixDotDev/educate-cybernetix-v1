import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = createClient(await cookies());
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", request.url));
}
