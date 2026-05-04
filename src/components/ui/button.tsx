'use client';

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { IconLoader2 } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles follow Figma "Buttons" component (pill shape, 40px medium height, 18px label)
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[18px] tracking-[0.03em] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Figma: "Type=Filled" – vertical primary gradient pill with white label
        default:
          "bg-gradient-to-b from-brand-gradient-from to-brand-gradient-to text-white shadow-md hover:opacity-90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        // Figma: "Type=Outlined" – white background with blue border and dark label
        outline:
          "border-2 border-brand-gradient-from bg-background text-foreground shadow-sm hover:bg-accent/40",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        // Figma: "Type=Ghost" – gradient label on transparent background
        // NOTE: Ensure icons remain visible by giving SVGs a solid brand color
        ghost:
          "bg-transparent text-transparent bg-gradient-to-b from-brand-gradient-from to-brand-gradient-to bg-clip-text hover:bg-accent/20 hover:text-transparent [&_svg]:text-brand-gradient-from",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-b from-brand-gradient-from to-brand-gradient-to text-white shadow-md hover:opacity-90",
        "gradient-outline":
          "relative bg-background border-2 border-transparent bg-clip-padding text-foreground before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-r before:from-brand-gradient-from before:to-brand-gradient-to before:rounded-[inherit] hover:bg-accent",
      },
      size: {
        // Figma: Small=32px, Medium=40px, Large=48px
        sm: "h-8 px-4 text-[16px]",
        default: "h-10 px-4", // Medium
        lg: "h-12 px-6",
        xl: "h-12 px-8 text-[20px] md:text-[22px]",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, loadingText, icon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    // When asChild is true, render children only (Slot expects single child)
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    // Regular button rendering with icon and loading support
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {icon && !loading && <span className="mr-2">{icon}</span>}
        {loading && <IconLoader2 className="h-4 w-4 animate-spin" />}
        {loading && loadingText ? loadingText : children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
