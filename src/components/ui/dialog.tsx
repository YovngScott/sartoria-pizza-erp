// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos React para la lógica de componentes y manejo de referencias
import * as React from "react";
// Importamos componentes de Radix UI para construir un diálogo (modal) accesible y robusto
import * as DialogPrimitive from "@radix-ui/react-dialog";
// Importamos el icono X para el botón de cierre manual del modal
import { X } from "lucide-react";
// Importamos la utilidad cn para gestionar dinámicamente las clases de Tailwind
import { cn } from "@/lib/utils";

// ========================================== //
// SUBCOMPONENTES BASE (RADIX WRAPPERS)
// ========================================== //
// Exportamos directamente componentes de Radix que no requieren personalización de estilos pesada
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

// ========================================== //
// COMPONENTE: DIALOGOVERLAY (FONDO OSCURECIDO)
// ========================================== //
/**
 * DialogOverlay: Capa semitransparente que bloquea el fondo cuando el modal está abierto.
 */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    {/* Estilos: posicionamiento fijo cubriendo todo el viewport, fondo negro tenue y animaciones de fundido */}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// ========================================== //
// COMPONENTE: DIALOGCONTENT (EL MODAL REAL)
// ========================================== //
/**
 * DialogContent: El contenedor principal que alberga el contenido del modal.
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  // El Portal renderiza el modal fuera de la jerarquía DOM actual (normalmente al final de body)
  <DialogPortal>
    {/* Incluimos la capa de fondo oscuro */}
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      {/* Estilos: centrado absoluto, grid para espaciado, fondo, sombra y animaciones complejas de entrada/salida */}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {/* Renderizado de los hijos pasados al modal */}
      {children}
      {/* Botón de cierre posicionado en la esquina superior derecha */}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        {/* Texto oculto solo para lectores de pantalla */}
        <span className="sr-only">Cerrar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

// ========================================== //
// COMPONENTE: DIALOGHEADER (CABECERA)
// ========================================== //
/**
 * DialogHeader: Estructura la parte superior del modal para títulos y descripciones.
 */
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {/* Clases: flexbox vertical, alineación centrada móvil y izquierda en escritorio */}
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

// ========================================== //
// COMPONENTE: DIALOGFOOTER (PIE)
// ========================================== //
/**
 * DialogFooter: Área inferior para botones de acción (Cancelar, Aceptar).
 */
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {/* Clases: flexbox, orden inverso en móvil para priorizar acción positiva, alineación derecha escritorio */}
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

// ========================================== //
// COMPONENTE: DIALOGTITLE (TÍTULO)
// ========================================== //
/**
 * DialogTitle: Título principal del modal con jerarquía visual alta.
 */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    {/* Estilos: fuente seminegrita, tamaño grande y ajuste de tracking */}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

// ========================================== //
// COMPONENTE: DIALOGDESCRIPTION (DESCRIPCIÓN)
// ========================================== //
/**
 * DialogDescription: Texto explicativo secundario bajo el título.
 */
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    {/* Estilos: fuente pequeña y color atenuado para menor peso visual */}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

// ========================================== //
// EXPORTACIONES
// ========================================== //
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
