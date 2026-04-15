// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos React para la funcionalidad base de componentes y tipos
import * as React from "react";
// Importamos componentes base de Radix UI para construir un menú desplegable accesible
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
// Importamos iconos de lucide-react para estados de selección y navegación
import { Check, ChevronRight, Circle } from "lucide-react";
// Importamos la utilidad cn para combinar clases de Tailwind CSS dinámicamente
import { cn } from "@/lib/utils";

// ========================================== //
// SUBCOMPONENTES BASE (RADIX WRAPPERS)
// ========================================== //
// Exportamos componentes de Radix que sirven como cimientos sin estilos propios pesados
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

// ========================================== //
// COMPONENTE: DROPDOWNMENUSUBTRIGGER
// ========================================== //
/**
 * DropdownMenuSubTrigger: Disparador para submenús anidados.
 */
const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean; // Prop opcional para añadir sangría si falta un icono
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    {/* Estilos: flexbox, cursor por defecto, sin selección de texto, padding y estados de foco/abierto */}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[state=open]:bg-accent focus:bg-accent",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {/* Contenido del trigger (texto/icono) */}
    {children}
    {/* Icono de flecha derecha para indicar que hay un submenú */}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

// ========================================== //
// COMPONENTE: DROPDOWNMENUSUBCONTENT
// ========================================== //
/**
 * DropdownMenuSubContent: El panel que contiene los items del submenú.
 */
const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    {/* Estilos: z-index alto, ancho mínimo, bordes, fondo de popover, sombra y animaciones de entrada/salida */}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

// ========================================== //
// COMPONENTE: DROPDOWNMENUCONTENT
// ========================================== //
/**
 * DropdownMenuContent: El contenedor principal de los items del menú desplegable.
 */
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  // Portal asegura que el menú flote sobre el resto del DOM
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      {/* Definimos el espacio de separación respecto al trigger */}
      sideOffset={sideOffset}
      {/* Estilos: similares a SubContent pero con ajustes de sombra específicos */}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

// ========================================== //
// COMPONENTE: DROPDOWNMENUITEM
// ========================================== //
/**
 * DropdownMenuItem: Una opción seleccionable dentro del menú.
 */
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    {/* Estilos: posicionamiento relativo, interacción de hover (foco), transiciones y estado deshabilitado */}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

// ========================================== //
// COMPONENTE: DROPDOWNMENUCHECKBOXITEM
// ========================================== //
/**
 * DropdownMenuCheckboxItem: Un item de menú que puede marcarse o desmarcarse.
 */
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    {/* Estilos: padding extra a la izquierda para el icono de check absoluto */}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    {/* Contenedor absoluto para el icono de estado */}
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

// ========================================== //
// COMPONENTE: DROPDOWNMENURADIOITEM
// ========================================== //
/**
 * DropdownMenuRadioItem: Una opción de selección única dentro de un grupo de radio.
 */
const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    {/* Estilos base consistentes con otros items */}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    {/* Indicador visual de radio (círculo pequeño) */}
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

// ========================================== //
// COMPONENTE: DROPDOWNMENULABEL
// ========================================== //
/**
 * DropdownMenuLabel: Texto no interactivo para agrupar categorías dentro del menú.
 */
const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    {/* Estilos: fuente seminegrita y espaciado estándar */}
    className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

// ========================================== //
// COMPONENTE: DROPDOWNMENUSEPARATOR
// ========================================== //
/**
 * DropdownMenuSeparator: Línea divisoria horizontal para separar grupos de items.
 */
const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    {/* Estilos: altura de 1px, fondo tenue y margen negativo para extenderse a los bordes */}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

// ========================================== //
// COMPONENTE: DROPDOWNMENUSHORTCUT
// ========================================== //
/**
 * DropdownMenuShortcut: Texto alineado a la derecha para indicar atajos de teclado.
 */
const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      {/* Estilos: fuente muy pequeña, alineación derecha y opacidad reducida */}
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

// ========================================== //
// EXPORTACIONES
// ========================================== //
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
