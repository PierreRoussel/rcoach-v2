
import { type ToasterProps, Toaster as Sonner } from "sonner";

import { useTheme } from "@/design-system";
import { cn } from "@/lib/utils";

const Toaster = ({ className, style, ...props }: ToasterProps) => {
  const { colorMode } = useTheme();

  return (
    <Sonner
      theme={colorMode === "dark" ? "dark" : "light"}
      className={cn("toaster group", className)}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "color-mix(in srgb, var(--color-success) 12%, var(--popover))",
          "--success-border": "color-mix(in srgb, var(--success) 35%, var(--border))",
          "--success-text": "var(--success)",
          ...style,
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          success: '!border-[var(--success-border)] !bg-[var(--success-bg)] !text-[var(--success-text)]',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
