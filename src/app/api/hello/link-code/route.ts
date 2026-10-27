import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createUserLinkCode } from "@/lib/hello/client";

// Mints a fresh connect code for the signed-in couple. Codes are single-use
// and expire in about 30 minutes, so the Texting tab asks for one each time.
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sms_link, mode } = await createUserLinkCode(user.id);
    return NextResponse.json({
      sms_link,
      mode,
      project_id: process.env.HELLO_PROJECT_ID,
    });
  } catch (err) {
    console.error("POST /api/hello/link-code error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
