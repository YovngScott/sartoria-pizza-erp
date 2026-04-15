// ========================================== //
//           COMPONENTE: PROGRESS (PROGRESO)    //
// ========================================== //

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

// ========================================== //
// COMPONENTE: PROGRESS (RAÍZ)                //
// ========================================== //
// Barra de progreso visual que muestra el avance de una tarea.
// Utiliza los primitivos de Radix UI para asegurar accesibilidad.

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// ========================================== //
// EXPORTACIÓN DEL COMPONENTE                  //
// ========================================== //

export { Progress };
