import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand-500 text-white shadow-glow hover:bg-brand-600",
        outline: "border-2 border-brand-500 text-brand-600 hover:bg-brand-50",
        ghost: "text-ink hover:bg-brand-50",
        link: "text-brand-600 underline-offset-4 hover:underline normal-case tracking-normal",
        white: "bg-white text-brand-700 hover:bg-brand-50",
      },
      size: {
        default: "h-11 px-6 text-xs rounded-pill",
        sm: "h-9 px-4 text-xs rounded-pill",
        lg: "h-13 px-8 py-3.5 text-sm rounded-pill",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
