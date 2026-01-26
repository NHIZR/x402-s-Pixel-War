import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-cyber-white text-cyber-black shadow hover:bg-gray-200 hover:shadow-lg",
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-600 hover:shadow-red-500/25",
        outline:
          "border border-gray-600 bg-transparent shadow-sm hover:bg-gray-800 hover:text-cyber-white hover:border-gray-500",
        secondary:
          "bg-gray-800 text-cyber-white shadow-sm hover:bg-gray-700",
        ghost: "hover:bg-gray-800 hover:text-cyber-white",
        link: "text-cyber-white underline-offset-4 hover:underline",
        primary:
          "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/25",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size="sm" className={variant === 'default' ? 'border-gray-800 border-t-transparent' : ''} />
            <span>{loadingText || 'Processing...'}</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
