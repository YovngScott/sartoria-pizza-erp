// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos React para la funcionalidad base de componentes funcionales
import * as React from "react";
// Importamos utilidades para la definición de variantes dinámicas
import { cva, type VariantProps } from "class-variance-authority";
// Importamos la utilidad cn para combinar clases de Tailwind condicionalmente
import { cn } from "@/lib/utils";

// ========================================== //
// DEFINICIÓN DE VARIANTES (BADGE)
// ========================================== //
/**
 * badgeVariants: Gestiona los diferentes estilos visuales de las etiquetas (badges).
 * Define clases base como bordes redondeados totales, espaciado pequeño y fuentes pequeñas.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Estilo por defecto con el color primario del tema
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        // Estilo tenue para información secundaria
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Estilo para errores, alertas o borrados
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        // Estilo con solo borde y texto del color base
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// ========================================== //
// TIPOS Y INTERFACES
// ========================================== //
/**
 * BadgeProps: Extiende los atributos de un div estándar con las variantes definidas arriba.
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

// ========================================== //
// COMPONENTE PRINCIPAL (BADGE)
// ========================================== //
/**
 * Badge: Pequeña etiqueta visual para mostrar categorías, estados o conteos.
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  // Renderizamos un div con las clases procesadas por cva y cn
  return (
    <div
      {/* Aplicamos la variante seleccionada y permitimos clases adicionales */}
      className={cn(badgeVariants({ variant }), className)}
      {/* Propagamos el resto de las propiedades estándar */}
      {...props}
    />
  );
}

// ========================================== //
// EXPORTACIONES
// ========================================== //
export { Badge, badgeVariants };
