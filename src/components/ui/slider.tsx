// ========================================== //
//           COMPONENTE: SLIDER (DESLIZADOR)    //
// ========================================== //

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

// ========================================== //
// COMPONENTE: SLIDER (RAÍZ)                  //
// ========================================== //
// Entrada de datos que permite seleccionar un valor de un rango desplazando un control.
// Utiliza los primitivos de Radix UI para soporte táctil y accesibilidad.

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

// ========================================== //
// EXPORTACIÓN DEL COMPONENTE                  //
// ========================================== //

export { Slider };
