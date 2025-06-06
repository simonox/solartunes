"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  orientation?: "horizontal" | "vertical"
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex touch-none select-none items-center",
        orientation === "vertical" ? "h-full w-5 flex-col" : "w-full h-5",
        className,
      )}
      orientation={orientation}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          "relative grow overflow-hidden rounded-full bg-gray-200",
          orientation === "vertical" ? "w-2 h-full" : "h-2 w-full",
        )}
      >
        <SliderPrimitive.Range
          className={cn(
            "absolute bg-gradient-to-r from-green-500 to-emerald-500",
            orientation === "vertical" ? "w-full" : "h-full",
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-green-500 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-lg" />
    </SliderPrimitive.Root>
  ),
)
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
