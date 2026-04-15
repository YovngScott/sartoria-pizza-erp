// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos React para la construcción de componentes y gestión de referencias
import * as React from "react";
// Importamos componentes base de Radix UI para un sistema de pestañas accesible
import * as TabsPrimitive from "@radix-ui/react-tabs";
// Importamos la utilidad cn para combinar clases de Tailwind CSS
import { cn } from "@/lib/utils";

// ========================================== //
// COMPONENTE PRINCIPAL (TABS)
// ========================================== //
/**
 * Tabs: El componente raíz que sincroniza el estado entre la lista y el contenido.
 * Re-exportamos directamente el Root de Radix UI.
 */
const Tabs = TabsPrimitive.Root;

// ========================================== //
// COMPONENTE: TABSLIST (CONTENEDOR DE DISPARADORES)
// ========================================== //
/**
 * TabsList: Contenedor horizontal que agrupa los botones de las pestañas.
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  // Renderizamos la lista primitiva con estilos de diseño tipo "pill" o contenedor oscuro
  <TabsPrimitive.List
    ref={ref}
    {/* Clases: flexbox alineado, altura fija, bordes redondeados, fondo tenue y texto secundario */}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

// ========================================== //
// COMPONENTE: TABSTRIGGER (EL BOTÓN)
// ========================================== //
/**
 * TabsTrigger: El botón interactivo que cambia la pestaña activa.
 */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  // Renderizamos el disparador primitivo con estilos de estado activo/inactivo
  <TabsPrimitive.Trigger
    ref={ref}
    {/* Clases: diseño centrado, tipografía media, transiciones suaves */}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
      // Estilos cuando la pestaña está seleccionada (data-state=active)
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      // Estilos de accesibilidad para foco y estado deshabilitado
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

// ========================================== //
// COMPONENTE: TABSCONTENT (EL PANEL)
// ========================================== //
/**
 * TabsContent: El panel que se muestra u oculta según la pestaña seleccionada.
 */
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  // Renderizamos el contenido primitivo con espaciado y estilos de foco
  <TabsPrimitive.Content
    ref={ref}
    {/* Clases: margen superior para separación, lógica de foco consistente */}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// ========================================== //
// EXPORTACIONES
// ========================================== //
export { Tabs, TabsList, TabsTrigger, TabsContent };
