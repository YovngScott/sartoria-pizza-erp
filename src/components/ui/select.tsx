// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos React para la creación de componentes y gestión de referencias DOM
import * as React from "react";
// Importamos componentes de Radix UI para un selector (select) accesible y estilizado
import * as SelectPrimitive from "@radix-ui/react-select";
// Importamos iconos de lucide-react para navegación y señalización de selección
import { Check, ChevronDown, ChevronUp } from "lucide-react";
// Importamos la utilidad cn para combinar clases de Tailwind dinámicamente
import { cn } from "@/lib/utils";

// ========================================== //
// SUBCOMPONENTES BASE (RADIX WRAPPERS)
// ========================================== //
// Exportamos directamente las raíces de Radix que no necesitan estilos pesados
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

// ========================================== //
// COMPONENTE: SELECTTRIGGER (EL DISPARADOR)
// ========================================== //
/**
 * SelectTrigger: El botón que abre el menú de opciones del selector.
 */
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    {/* Estilos: flexbox horizontal, justificado, bordes redondeados, borde estándar y estados de foco */}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {/* Texto de la opción seleccionada o placeholder */}
    {children}
    {/* Icono de flecha hacia abajo indicando desplegable */}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

// ========================================== //
// COMPONENTE: SELECTSCROLLUPBUTTON
// ========================================== //
/**
 * SelectScrollUpButton: Botón de desplazamiento hacia arriba para listas largas.
 */
const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    {/* Estilos: centrado y padding vertical */}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

// ========================================== //
// COMPONENTE: SELECTSCROLLDOWNBUTTON
// ========================================== //
/**
 * SelectScrollDownButton: Botón de desplazamiento hacia abajo para listas largas.
 */
const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    {/* Estilos: centrado y padding vertical */}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

// ========================================== //
// COMPONENTE: SELECTCONTENT (EL MENÚ)
// ========================================== //
/**
 * SelectContent: El contenedor flotante que alberga las opciones.
 */
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  // Portal para renderizar fuera del flujo DOM actual
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      {/* Estilos: z-index alto, altura máxima, ancho mínimo, fondo de popover, sombra y animaciones */}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        // Ajuste de transformación si la posición es 'popper'
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      {/* El Viewport es el área visible de desplazamiento */}
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          // Sincronizamos anchos cuando se usa popper
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

// ========================================== //
// COMPONENTE: SELECTLABEL (ETIQUETA DE GRUPO)
// ========================================== //
/**
 * SelectLabel: Texto informativo para agrupar opciones.
 */
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    {/* Estilos: fuente seminegrita y sangría lateral para alinear con items */}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

// ========================================== //
// COMPONENTE: SELECTITEM (UNA OPCIÓN)
// ========================================== //
/**
 * SelectItem: Representa una opción seleccionable dentro del menú.
 */
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    {/* Estilos: flexbox, alineación, interacción de hover/foco y estado deshabilitado */}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    {/* Indicador absoluto del check para la opción seleccionada */}
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    {/* El texto real del item */}
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

// ========================================== //
// COMPONENTE: SELECTSEPARATOR (DIVISOR)
// ========================================== //
/**
 * SelectSeparator: Línea horizontal para separar visualmente grupos de opciones.
 */
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    {/* Estilos: altura mínima, fondo tenue y margen negativo para extender bordes */}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// ========================================== //
// EXPORTACIONES
// ========================================== //
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
