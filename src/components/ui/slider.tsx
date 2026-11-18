import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className = '', ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={`shadcn-slider ${className}`}
    {...props}
  >
    <SliderPrimitive.Track className="shadcn-slider-track">
      <SliderPrimitive.Range className="shadcn-slider-range" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="shadcn-slider-thumb" aria-label="Scrub timeline" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName
