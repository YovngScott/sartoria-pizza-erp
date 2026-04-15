// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos React para la creación de componentes y tipos de elementos
import * as React from "react";
// Importamos cva para la gestión de variantes de clases basada en propiedades
import { cva, type VariantProps } from "class-variance-authority";
// Importamos la utilidad cn para combinar clases de Tailwind condicionalmente
import { cn } from "@/lib/utils";

// ========================================== //
// DEFINICIÓN DE VARIANTES (ALERT)
// ========================================== //
/**
 * alertVariants: Define los estilos visuales para el contenedor de la alerta.
 * Incluye posicionamiento relativo, bordes redondeados y estilos específicos para iconos hijos.
 */
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        // Variante por defecto: fondo estándar y texto de primer plano
        default: "bg-background text-foreground",
        // Variante destructiva: bordes rojos y texto de error para avisos críticos
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// ========================================== //
// COMPONENTE PRINCIPAL (ALERT)
// ========================================== //
/**
 * Alert: Contenedor semántico para mensajes de retroalimentación del sistema.
 */
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  // Div con rol de alerta para lectores de pantalla, aplicando variantes de estilo
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

// ========================================== //
// COMPONENTE: ALERTTITLE
// ========================================== //
/**
 * AlertTitle: El encabezado corto y destacado de la alerta.
 */
const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    // H5 con espaciado inferior y tipografía seminegrita
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = "AlertTitle";

// ========================================== //
// COMPONENTE: ALERTDESCRIPTION
// ========================================== //
/**
 * AlertDescription: El cuerpo de texto detallado que explica la alerta.
 */
const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    // Div con fuente pequeña y estilos relajados para párrafos internos
    <div
      ref={ref}
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  ),
);
AlertDescription.displayName = "AlertDescription";

// ========================================== //
// EXPORTACIONES
// ========================================== //
export { Alert, AlertTitle, AlertDescription };
