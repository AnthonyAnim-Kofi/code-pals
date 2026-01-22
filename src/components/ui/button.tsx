import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 uppercase tracking-wide active:translate-y-[2px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 btn-primary-shadow",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 btn-destructive-shadow",
        outline:
          "border-2 border-border bg-background hover:bg-muted btn-outline-shadow",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 btn-secondary-shadow",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium:
          "bg-premium text-premium-foreground hover:bg-premium/90 shadow-[0_4px_0_hsl(270,70%,45%)]",
        golden:
          "bg-golden text-golden-foreground hover:bg-golden/90 shadow-[0_4px_0_hsl(35,100%,35%)]",
        super:
          "bg-gradient-to-r from-primary to-[hsl(120,70%,40%)] text-primary-foreground hover:opacity-90 btn-primary-shadow",
        locked:
          "bg-muted text-muted-foreground cursor-not-allowed shadow-[0_4px_0_hsl(220,13%,85%)]",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-lg px-4",
        lg: "h-14 rounded-xl px-8 text-base",
        xl: "h-16 rounded-2xl px-10 text-lg",
        icon: "h-12 w-12 rounded-xl",
        rounded: "h-16 w-16 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
