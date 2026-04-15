// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos la biblioteca núcleo de React para componentes y referencias
import * as React from "react";
// Importamos el componente base de Radix UI para un checkbox accesible
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
// Importamos el icono de check para indicar visualmente el estado marcado
import { Check } from "lucide-react";
// Importamos la utilidad cn para la gestión dinámica de estilos CSS
import { cn } from "@/lib/utils";

// ========================================== //
// COMPONENTE PRINCIPAL (CHECKBOX)
// ========================================== //
/**
 * Checkbox: Control de selección binaria con estilos personalizados y accesibilidad integrada.
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  // El Root de Radix gestiona el estado, el foco y los eventos de teclado
  <CheckboxPrimitive.Root
    ref={ref}
    {/* Clases base: tamaño fijo, no encoge, bordes pequeños, color primario y estados visuales dinámicos */}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background transition-colors",
      // Estilos cuando está marcado (data-state=checked)
      "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      // Accesibilidad: anillo visual al navegar con teclado
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      // Estado deshabilitado: cursor bloqueado y opacidad reducida
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {/* El Indicator se muestra solo cuando el checkbox está seleccionado */}
    <CheckboxPrimitive.Indicator
      {/* Estilos: centrado perfecto del icono check */}
      className={cn("flex items-center justify-center text-current")}
    >
      {/* Icono de palomita escalado */}
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

// ========================================== //
// METADATOS Y EXPORTACIÓN
// ========================================== //
// Definimos el nombre basado en la primitiva para depuración
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// Exportamos el componente listo para ser usado en formularios
export { Checkbox };
