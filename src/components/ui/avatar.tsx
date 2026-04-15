// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos React para la funcionalidad base de componentes y manejo de refs
import * as React from "react";
// Importamos componentes base de Radix UI para un sistema de avatar robusto (imagen + fallback)
import * as AvatarPrimitive from "@radix-ui/react-avatar";
// Importamos la utilidad cn para combinar clases de Tailwind condicionalmente
import { cn } from "@/lib/utils";

// ========================================== //
// COMPONENTE PRINCIPAL (AVATAR)
// ========================================== //
/**
 * Avatar: Contenedor raíz que agrupa la imagen del usuario y su texto alternativo.
 */
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  // El Root gestiona la visibilidad entre la imagen y el fallback basándose en la carga
  <AvatarPrimitive.Root
    ref={ref}
    {/* Clases base: posicionamiento relativo, tamaño fijo (10x10), no encoger y forma circular */}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

// ========================================== //
// COMPONENTE: AVATARIMAGE (LA IMAGEN)
// ========================================== //
/**
 * AvatarImage: Renderiza la fotografía del usuario con ajuste automático de proporciones.
 */
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    {/* Clases: mantiene relación de aspecto cuadrada y llena el contenedor circular */}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

// ========================================== //
// COMPONENTE: AVATARFALLBACK (LO QUE SE VE SI FALLA)
// ========================================== //
/**
 * AvatarFallback: Se muestra si la imagen no carga o no existe. Normalmente contiene iniciales.
 */
const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    {/* Clases: flexbox centrado, color de fondo tenue y forma circular para coincidir con el avatar */}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// ========================================== //
// EXPORTACIONES
// ========================================== //
export { Avatar, AvatarImage, AvatarFallback };
