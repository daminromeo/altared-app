import { Heart } from "lucide-react";

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Minimal branded header */}
      <header className="border-b border-[#E8E4DF] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-[#8B9F82]" />
            <span
              className="text-lg font-bold text-[#2D2D2D]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Altared
            </span>
          </div>
          <span className="rounded-full bg-[#8B9F82]/10 px-3 py-1 text-xs font-medium text-[#8B9F82]">
            View Only
          </span>
        </div>
      </header>

      {children}
    </div>
  );
}
