import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; positive: boolean };
  highlight?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function StatCard({
  title, value, subtitle, icon: Icon, trend, highlight, onClick, className
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-2xl p-4 border transition-all duration-200",
        highlight
          ? "bg-gradient-to-br from-jubrika-or/20 to-jubrika-or-sombre/10 border-jubrika-or/40"
          : "bg-[#111111] border-white/10",
        onClick && "cursor-pointer hover:border-jubrika-or/40 hover:scale-[1.01]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 truncate">{title}</p>
          <p className={cn(
            "text-xl font-black truncate",
            highlight ? "text-jubrika-or" : "text-white"
          )}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs mt-1", trend.positive ? "text-green-400" : "text-red-400")}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "p-2.5 rounded-xl flex-shrink-0",
            highlight ? "bg-jubrika-or/20" : "bg-white/5"
          )}>
            <Icon size={20} className={highlight ? "text-jubrika-or" : "text-gray-400"} />
          </div>
        )}
      </div>
    </div>
  );
}
