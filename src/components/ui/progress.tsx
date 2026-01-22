import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const progressVariants = cva("relative w-full overflow-hidden rounded-full", {
  variants: {
    variant: {
      default: "bg-muted",
      lesson: "bg-muted h-4",
      mini: "bg-muted/50 h-2",
    },
    size: {
      default: "h-4",
      sm: "h-2",
      lg: "h-6",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

const indicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-out rounded-full",
  {
    variants: {
      indicatorColor: {
        primary: "bg-primary",
        gradient: "bg-gradient-to-r from-primary to-[hsl(120,70%,40%)]",
        secondary: "bg-secondary",
        golden: "bg-golden",
        destructive: "bg-destructive",
      },
    },
    defaultVariants: {
      indicatorColor: "gradient",
    },
  }
);

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof indicatorVariants> {}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, size, indicatorColor, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressVariants({ variant, size, className }))}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(indicatorVariants({ indicatorColor }))}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
