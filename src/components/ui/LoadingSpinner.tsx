import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({ size = "md", className, fullPage }: LoadingSpinnerProps) {
  const sizes = { sm: "w-5 h-5 border-2", md: "w-8 h-8 border-2", lg: "w-12 h-12 border-3" };

  const spinner = (
    <div className={cn(
      "border-jubrika-or border-t-transparent rounded-full animate-spin",
      sizes[size],
      className
    )} />
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
        {spinner}
        <p className="text-xs text-gray-600 uppercase tracking-widest">Chargement...</p>
      </div>
    );
  }

  return <div className="flex justify-center py-8">{spinner}</div>;
}
