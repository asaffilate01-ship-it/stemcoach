import { MessageCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePreferredCoach } from "@/hooks/usePreferredCoach";

const hiddenRoutes = new Set(["/", "/home", "/auth", "/reset-password", "/privacy", "/terms", "/cookies"]);

export function PersistentCoach() {
  const { user } = useAuth();
  const { preferredCoach, preferredCoachId } = usePreferredCoach();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user || hiddenRoutes.has(location.pathname) || location.pathname === "/ai-tutor") return null;

  const target = preferredCoachId === "stemcoach"
    ? "/ai-tutor"
    : `/ai-tutor?subject=${encodeURIComponent(preferredCoachId)}`;

  return (
    <button
      type="button"
      onClick={() => navigate(target)}
      className="group fixed bottom-20 right-3 z-40 flex max-w-[15rem] items-center gap-2 rounded-2xl border border-primary/20 bg-card/95 p-2 pr-3 text-left shadow-lg shadow-primary/10 backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl lg:bottom-5 lg:right-5"
      aria-label={`Ask ${preferredCoach.name}`}
      title={`Ask ${preferredCoach.name}`}
    >
      <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-primary/10 ring-2 ring-primary/10">
        <img src={preferredCoach.image} alt="" className="h-full w-full object-cover" />
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
      </span>
      <span className="hidden min-w-0 sm:block">
        <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-primary">Your persistent coach</span>
        <span className="flex items-center gap-1 text-xs font-semibold">
          <MessageCircle className="h-3 w-3" /> Ask {preferredCoach.name}
        </span>
      </span>
    </button>
  );
}
