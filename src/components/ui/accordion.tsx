// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos la biblioteca núcleo de React para la creación de componentes y tipos
import * as React from "react";
// Importamos los componentes base de Radix UI para construir un acordeón accesible
import * as AccordionPrimitive from "@radix-ui/react-accordion";
// Importamos el icono ChevronDown para indicar visualmente el estado de expansión
import { ChevronDown } from "lucide-react";
// Importamos la utilidad cn para la gestión dinámica de clases CSS de Tailwind
import { cn } from "@/lib/utils";

// ========================================== //
// COMPONENTE PRINCIPAL (ACCORDION)
// ========================================== //
/**
 * Accordion: Componente contenedor principal que gestiona el estado de expansión de sus hijos.
 * Re-exportamos directamente el Root de Radix UI.
 */
const Accordion = AccordionPrimitive.Root;

// ========================================== //
// COMPONENTE: ACCORDIONITEM
// ========================================== //
/**
 * AccordionItem: Representa una sección individual dentro del acordeón.
 */
const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  // Renderizamos el item primitivo con un borde inferior por defecto
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
));
// Asignamos el nombre de visualización para depuración
AccordionItem.displayName = "AccordionItem";

// ========================================== //
// COMPONENTE: ACCORDIONTRIGGER
// ========================================== //
/**
 * AccordionTrigger: El botón que activa la expansión/contracción del contenido.
 */
const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  // El Trigger debe estar envuelto en un Header para accesibilidad semántica
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        // Estilos base: flexbox para separar texto e icono, padding vertical, fuente media
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
        // Lógica CSS para rotar el icono cuando el estado de Radix sea 'open'
        "[&[data-state=open]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {/* Renderizado de los hijos (texto del disparador) */}
      {children}
      {/* Icono de flecha con transición suave de rotación */}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

// ========================================== //
// COMPONENTE: ACCORDIONCONTENT
// ========================================== //
/**
 * AccordionContent: El panel ocultable que contiene la información detallada.
 */
const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      // Estilos base: ocultar desbordamiento, fuente pequeña y animaciones disparadas por data-state
      "overflow-hidden text-sm transition-all",
      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    )}
    {...props}
  >
    {/* Contenedor interno para manejar el padding sin romper la animación de altura */}
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

// ========================================== //
// EXPORTACIONES
// ========================================== //
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
