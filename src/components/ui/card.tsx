// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos React para la construcción de componentes funcionales y referencias
import * as React from "react";
// Importamos la utilidad de concatenación de clases optimizada para Tailwind
import { cn } from "@/lib/utils";

// ========================================== //
// COMPONENTE: CARD (CONTENEDOR)
// ========================================== //
/**
 * Card: Bloque base con bordes redondeados, fondo de tarjeta y sombra suave.
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // Clases: bordes definidos, color de fondo temático, texto de contraste y sombra discreta
    className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
    {...props}
  />
));
Card.displayName = "Card";

// ========================================== //
// COMPONENTE: CARDHEADER (CABECERA)
// ========================================== //
/**
 * CardHeader: Contenedor superior para el título y descripción de la tarjeta.
 */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      // Clases: flexbox vertical con espaciado entre elementos y padding interno de 6 (1.5rem)
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

// ========================================== //
// COMPONENTE: CARDTITLE (TÍTULO)
// ========================================== //
/**
 * CardTitle: El título principal de la tarjeta con tipografía destacada.
 */
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      // Clases: tamaño de fuente grande, peso seminegrita y ajuste de interlineado/espaciado
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

// ========================================== //
// COMPONENTE: CARDDESCRIPTION (DESCRIPCIÓN)
// ========================================== //
/**
 * CardDescription: Texto secundario informativo ubicado bajo el título.
 */
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      // Clases: fuente pequeña y color tenue para jerarquía visual
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  ),
);
CardDescription.displayName = "CardDescription";

// ========================================== //
// COMPONENTE: CARDCONTENT (CUERPO)
// ========================================== //
/**
 * CardContent: El área principal para el contenido de la tarjeta.
 */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      // Clases: padding consistente, eliminando el superior para fluir con el header si existe
      className={cn("p-6 pt-0", className)}
      {...props}
    />
  ),
);
CardContent.displayName = "CardContent";

// ========================================== //
// COMPONENTE: CARDFOOTER (PIE)
// ========================================== //
/**
 * CardFooter: Sección inferior para botones de acción o enlaces relacionados.
 */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      // Clases: alineación horizontal centrada y padding consistente
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

// ========================================== //
// EXPORTACIONES
// ========================================== //
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
