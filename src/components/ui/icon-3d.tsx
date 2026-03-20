import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Icon3DVariant = "primary" | "warning" | "success" | "destructive" | "purple" | "accent";
type Icon3DSize = "xs" | "sm" | "md" | "lg" | "xl";

interface Icon3DProps {
  icon: LucideIcon;
  variant?: Icon3DVariant;
  size?: Icon3DSize;
  className?: string;
}

const sizeMap: Record<Icon3DSize, { container: string; icon: string }> = {
  xs: { container: "h-6 w-6 rounded-md", icon: "h-3 w-3" },
  sm: { container: "h-7 w-7 rounded-lg", icon: "h-3.5 w-3.5" },
  md: { container: "h-9 w-9 rounded-xl", icon: "h-4 w-4" },
  lg: { container: "h-11 w-11 rounded-xl", icon: "h-5 w-5" },
  xl: { container: "h-14 w-14 rounded-2xl", icon: "h-6 w-6" },
};

const variantMap: Record<Icon3DVariant, string> = {
  primary:
    "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(226,70%,38%)] text-white shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4),inset_0_1px_1px_hsl(0_0%_100%/0.2)]",
  warning:
    "bg-gradient-to-br from-[hsl(38,92%,50%)] to-[hsl(25,85%,42%)] text-white shadow-[0_4px_12px_-2px_hsl(38_92%_50%/0.4),inset_0_1px_1px_hsl(0_0%_100%/0.2)]",
  success:
    "bg-gradient-to-br from-[hsl(142,71%,45%)] to-[hsl(160,60%,32%)] text-white shadow-[0_4px_12px_-2px_hsl(142_71%_45%/0.4),inset_0_1px_1px_hsl(0_0%_100%/0.2)]",
  destructive:
    "bg-gradient-to-br from-[hsl(0,84%,55%)] to-[hsl(0,72%,42%)] text-white shadow-[0_4px_12px_-2px_hsl(0_84%_55%/0.4),inset_0_1px_1px_hsl(0_0%_100%/0.2)]",
  purple:
    "bg-gradient-to-br from-[hsl(258,60%,55%)] to-[hsl(280,55%,42%)] text-white shadow-[0_4px_12px_-2px_hsl(258_60%_55%/0.4),inset_0_1px_1px_hsl(0_0%_100%/0.2)]",
  accent:
    "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(258,60%,48%)] text-white shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.3),inset_0_1px_1px_hsl(0_0%_100%/0.2)]",
};

export function Icon3D({ icon: Icon, variant = "primary", size = "sm", className }: Icon3DProps) {
  const s = sizeMap[size];
  return (
    <div
      className={cn(
        "relative flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
        s.container,
        variantMap[variant],
        className
      )}
    >
      <Icon className={cn(s.icon, "drop-shadow-sm")} />
    </div>
  );
}
