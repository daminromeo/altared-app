import { Heart } from "lucide-react";

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      {/* Minimal branded header */}
      <header className="border-b border-hairline bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-moss" />
            <span
              className="text-lg font-bold text-ink"
              style={{ fontFamily: "var(--font-manrope), sans-serif" }}
            >
              Altared
            </span>
          </div>
          <span className="rounded-full bg-moss/10 px-3 py-1 text-xs font-medium text-moss">
            View Only
          </span>
        </div>
      </header>

      {children}
    </div>
  );
}
