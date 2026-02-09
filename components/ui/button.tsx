import * as React from "react"
// import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean
    variant?: 'default' | 'ghost' | 'outline' | 'glass'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', isLoading, asChild = false, children, ...props }, ref) => {

        // Base styles
        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all duration-300 active:scale-95"

        // Variants
        const variants = {
            default: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
            glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 shadow-lg"
        }

        // Sizes
        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10"
        }

        const Comp = "button"
        return (
            <Comp
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </Comp>
        )
    }
)
Button.displayName = "Button"

export { Button }
