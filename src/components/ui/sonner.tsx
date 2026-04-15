// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos hook para detectar el tema actual del sistema/aplicación
import { useTheme } from "next-themes";
// Importamos Toaster y toast de la librería Sonner para notificaciones elegantes
import { Toaster as Sonner, toast } from "sonner";

// ========================================== //
// TIPOS Y PROPIEDADES
// ========================================== //
/**
 * ToasterProps: Extraemos los tipos de las propiedades del componente original de Sonner.
 */
type ToasterProps = React.ComponentProps<typeof Sonner>;

// ========================================== //
// COMPONENTE PRINCIPAL (TOASTER)
// ========================================== //
/**
 * Toaster: Wrapper del componente de notificaciones de Sonner que sincroniza estilos con el tema global.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  // Obtenemos el tema actual ('light', 'dark' o 'system')
  const { theme = "system" } = useTheme();

  // ========================================== //
  // RENDERIZADO
  // ========================================== //
  return (
    <Sonner
      {/* Sincronizamos el tema visual de las notificaciones */}
      theme={theme as ToasterProps["theme"]}
      {/* Asignamos una clase base de grupo para estilizar vía Tailwind selectores anidados */}
      className="toaster group"
      {/* Personalizamos las clases CSS de los elementos internos del toast */}
      toastOptions={{
        classNames: {
          // Contenedor principal del toast: fondo, texto, bordes y sombras del tema
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          // Texto descriptivo secundario
          description: "group-[.toast]:text-muted-foreground",
          // Botón de acción principal
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          // Botón de cancelación o cierre
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {/* Propagamos el resto de configuraciones personalizadas */}
      {...props}
    />
  );
};

// ========================================== //
// EXPORTACIONES
// ========================================== //
export { Toaster, toast };
,
      // Ajustes específicos para vertical: ancho fijo y borde izquierdo
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      // Ajustes específicos para horizontal: alto fijo y borde superior
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className,
    )}
    {...props}
  >
    {/* Thumb es la parte móvil de la barra de desplazamiento */}
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

// ========================================== //
// EXPORTACIONES
// ========================================== //
export { ScrollArea, ScrollBar };
