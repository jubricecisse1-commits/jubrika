import { cn } from "@/lib/utils";

type BadgeVariant = "or" | "vert" | "rouge" | "orange" | "gris" | "bleu";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  or: "bg-jubrika-or/15 text-jubrika-or border border-jubrika-or/30",
  vert: "bg-green-500/15 text-green-400 border border-green-500/30",
  rouge: "bg-red-500/15 text-red-400 border border-red-500/30",
  orange: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  gris: "bg-white/10 text-gray-400 border border-white/10",
  bleu: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
};

export default function Badge({ children, variant = "gris", className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium",
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
}
