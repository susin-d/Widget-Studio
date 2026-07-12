import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: "primary" | "ghost" | "danger";
}

export function Button({ icon, variant = "ghost", className = "", children, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-accent text-white hover:brightness-110",
    ghost: "bg-black/5 text-text hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15",
    danger: "bg-red-500/12 text-red-600 hover:bg-red-500/20"
  };
  return (
    <button
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition ${variants[variant]} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
