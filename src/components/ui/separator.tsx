// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos React para la funcionalidad base de componentes
import * as React from "react";
// Importamos la primitiva de Separador de Radix UI para asegurar accesibilidad semántica
import * as SeparatorPrimitive from "@radix-ui/react-separator";
// Importamos la utilidad cn para el manejo dinámico de estilos de Tailwind
import { cn } from "@/lib/utils";

// ========================================== //
// COMPONENTE PRINCIPAL (SEPARATOR)
// ========================================== //
/**
 * Separator: Línea visual o semántica para dividir contenido.
 * Soporta orientaciones horizontal y vertical.
 */
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  // Desestructuramos props con valores por defecto (horizontal y decorativo por defecto)
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <SeparatorPrimitive.Root
      {/* Referencia al elemento DOM real */}
      ref={ref}
      {/* Indica si el elemento es meramente visual o tiene significado estructural */}
      decorative={decorative}
      {/* Define el eje de la línea (horizontal/vertical) */}
      orientation={orientation}
      {/* Clases base: no encoger, color de borde estándar y lógica de dimensiones dinámicas */}
      className={cn(
        "shrink-0 bg-border",
        // Si es horizontal: 1px de alto y ancho completo
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        // Clases adicionales pasadas por el padre
        className,
      )}
      {...props}
    />
  ),
);

// ========================================== //
// METADATOS Y EXPORTACIÓN
// ========================================== //
// Nombre de visualización basado en la primitiva de Radix
Separator.displayName = SeparatorPrimitive.Root.displayName;

// Exportación del componente procesado
export { Separator };
