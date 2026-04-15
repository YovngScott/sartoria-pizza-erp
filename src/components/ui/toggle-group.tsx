// ========================================== //
//           COMPONENTE: TOGGLE GROUP           //
// ========================================== //

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { toggleVariants } from "@/components/ui/toggle";

// ========================================== //
// CONTEXTO DEL GRUPO DE TOGGLE               //
// ========================================== //
// Proporciona variantes de estilo (size, variant) a todos los items del grupo.

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
  size: "default",
  variant: "default",
});

// ========================================== //
// COMPONENTE: TOGGLE GROUP (RAÍZ)            //
// ========================================== //
// Conjunto de botones de tipo interruptor (toggle) que pueden funcionar
// de forma individual o como selección única/múltiple.

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root ref={ref} className={cn("flex items-center justify-center gap-1", className)} {...props}>
    <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

// ========================================== //
// COMPONENTE: TOGGLE GROUP ITEM              //
// ========================================== //
// Botón individual dentro de un grupo de toggle.

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

// ========================================== //
// EXPORTACIÓN DE COMPONENTES                  //
// ========================================== //

export { ToggleGroup, ToggleGroupItem };
