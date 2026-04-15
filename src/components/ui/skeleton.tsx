// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos la utilidad cn para combinar clases de Tailwind condicionalmente
import { cn } from "@/lib/utils";

// ========================================== //
// COMPONENTE PRINCIPAL (SKELETON)
// ========================================== //
/**
 * Skeleton: Componente que muestra una animación de "latido" (pulse) para indicar carga.
 * Útil para representar marcadores de posición mientras los datos reales se obtienen del backend.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  // ========================================== //
  // RENDERIZADO
  // ========================================== //
  return (
    <div
      {/* Aplicamos las clases base de Skeleton */}
      className={cn(
        // Animación de pulso, bordes redondeados medios y color de fondo tenue
        "animate-pulse rounded-md bg-muted",
        // Permitimos inyectar clases adicionales para definir tamaño y forma (ej: rounded-full)
        className
      )}
      {/* Propagamos cualquier otro atributo estándar de div */}
      {...props}
    />
  );
}

// ========================================== //
// EXPORTACIÓN
// ========================================== //
export { Skeleton };
