// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos la lógica de Diálogo de Radix como base para el Sheet (panel lateral)
import * as SheetPrimitive from "@radix-ui/react-dialog";
// Importamos utilidades para variantes visuales y tipos asociados
import { cva, type VariantProps } from "class-variance-authority";
// Importamos icono de cierre
import { X } from "lucide-react";
// Importamos React para la funcionalidad base
import * as React from "react";
// Importamos utilidad de unión de clases
import { cn } from "@/lib/utils";

// ========================================== //
// SUBCOMPONENTES BASE (RE-EXPORTACIONES)
// ========================================== //
const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

// ========================================== //
// COMPONENTE: SHEETOVERLAY (FONDO)
// ========================================== //
/**
 * SheetOverlay: Capa oscura que bloquea la interacción con el resto de la página.
 */
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    {/* Estilos: fijo total, fondo negro, animaciones disparadas por data-state */}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

// ========================================== //
// DEFINICIÓN DE VARIANTES (SHEET)
// ========================================== //
/**
 * sheetVariants: Gestiona el posicionamiento y animaciones según el lado de entrada.
 */
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        // Entrada desde arriba (barra superior)
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        // Entrada desde abajo (drawer inferior móvil)
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        // Entrada desde la izquierda (sidebar izquierdo)
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        // Entrada desde la derecha (sidebar derecho estándar)
        right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

// ========================================== //
// COMPONENTE: SHEETCONTENT (EL PANEL)
// ========================================== //
/**
 * SheetContent: El panel lateral real que contiene la información.
 */
interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = "right", className, children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        {/* Aplicamos la variante de lado y animaciones correspondientes */}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {/* Contenido inyectado */}
        {children}
        {/* Botón de cierre absoluto */}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  ),
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

// ========================================== //
// COMPONENTES DE ESTRUCTURA INTERNA
// ========================================== //

/** SheetHeader: Cabecera con espaciado vertical y alineación */
const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

/** SheetFooter: Pie de página con alineación responsiva */
const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
SheetFooter.displayName = "SheetFooter";

/** SheetTitle: Título principal destacado */
const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />
));
SheetTitle.displayName = "SheetTitle";

/** SheetDescription: Texto descriptivo tenue */
const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
SheetDescription.displayName = "SheetDescription";

// ========================================== //
// EXPORTACIONES
// ========================================== //
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
