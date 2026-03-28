import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "damin.romeo@gmail.com";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify admin status from database
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  // Fallback: also check email for cases where migration hasn't run yet
  if (!profile?.is_admin && user.email !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <a
              href="/admin"
              className="text-xl font-bold tracking-tight text-[#8B9F82]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Altared
            </a>
            <span className="rounded-full bg-[#8B9F82]/10 px-3 py-1 text-xs font-medium text-[#8B9F82]">
              Admin
            </span>
          </div>
          <a
            href="/dashboard"
            className="text-sm text-[#7A7A7A] hover:text-[#2D2D2D] transition-colors"
          >
            Back to App
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
