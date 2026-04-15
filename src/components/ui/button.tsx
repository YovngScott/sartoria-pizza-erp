// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos React para la funcionalidad base de componentes
import * as React from "react";
// Importamos Slot de Radix para permitir el patrón "asChild" (renderizar un componente diferente manteniendo estilos)
import { Slot } from "@radix-ui/react-slot";
// Importamos utilidades para definir y tipar variantes de componentes visuales
import { cva, type VariantProps } from "class-variance-authority";
// Importamos la utilidad de unión de clases Tailwind
import { cn } from "@/lib/utils";

// ========================================== //
// DEFINICIÓN DE VARIANTES (BUTTON)
// ========================================== //
/**
 * buttonVariants: Centraliza toda la lógica visual de los botones del sistema.
 * Define estados de hover, foco, deshabilitado y proporciones.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Botón principal con color de marca
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Botón para acciones de borrado o advertencia
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Botón con borde, estilo secundario
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        // Botón con fondo tenue
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Botón sin fondo ni bordes, solo texto con hover
        ghost: "hover:bg-accent hover:text-accent-foreground",
        // Botón con apariencia de enlace tradicional
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Tamaños predefinidos según el contexto de uso
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10", // Cuadrado perfecto para iconos solitarios
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// ========================================== //
// TIPOS Y INTERFACES
// ========================================== //
/**
 * ButtonProps: Combina atributos estándar de botón HTML con las variantes definidas arriba.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // Si es true, el botón actuará como un contenedor para el hijo que se le pase
  asChild?: boolean;
}

// ========================================== //
// COMPONENTE PRINCIPAL (BUTTON)
// ========================================== //
/**
 * Button: Componente versátil para disparar acciones, con soporte completo para Tailwind y variantes.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Seleccionamos dinámicamente el componente a renderizar (Slot o button HTML)
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        {/* Generamos las clases finales uniendo variantes y clases personalizadas */}
        className={cn(buttonVariants({ variant, size, className }))}
        {/* Pasamos la referencia al elemento DOM real */}
        ref={ref}
        {/* Propagamos el resto de atributos estándar (onClick, disabled, etc.) */}
        {...props}
      />
    );
  },
);
// Nombre de visualización para herramientas de desarrollo
Button.displayName = "Button";

// ========================================== //
// EXPORTACIONES
// ========================================== //
export { Button, buttonVariants };
