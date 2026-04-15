// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos React para la creación de componentes y gestión de referencias
import * as React from "react";
// Importamos la base accesible de etiquetas de Radix UI
import * as LabelPrimitive from "@radix-ui/react-label";
// Importamos utilidades para definir y tipar variantes de estilos
import { cva, type VariantProps } from "class-variance-authority";
// Importamos la utilidad de concatenación de clases Tailwind
import { cn } from "@/lib/utils";

// ========================================== //
// DEFINICIÓN DE VARIANTES (LABEL)
// ========================================== //
/**
 * labelVariants: Centraliza los estilos de las etiquetas del sistema.
 * Define tamaño pequeño, peso medio, interlineado ajustado y estados vinculados a elementos adyacentes (peer).
 */
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

// ========================================== //
// COMPONENTE PRINCIPAL (LABEL)
// ========================================== //
/**
 * Label: Etiqueta de formulario accesible que hereda las capacidades de Radix UI Root.
 * Implementa forwardRef para integrarse perfectamente con otros componentes de UI.
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  // Renderizamos el componente raíz de Radix aplicando las variantes por defecto
  <LabelPrimitive.Root
    ref={ref}
    {/* Clases: aplicamos las variantes base y permitimos inyectar clases adicionales */}
    className={cn(labelVariants(), className)}
    {/* Propagamos el resto de propiedades estándar (htmlFor, etc.) */}
    {...props}
  />
));

// ========================================== //
// METADATOS Y EXPORTACIÓN
// ========================================== //
// Asignamos el nombre para facilitar la identificación técnica
Label.displayName = LabelPrimitive.Root.displayName;

// Exportamos el componente para su uso global en formularios
export { Label };
