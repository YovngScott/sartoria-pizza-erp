// ========================================== //
//           COMPONENTE: BREADCRUMB             //
// ========================================== //

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

// ========================================== //
// COMPONENTE: BREADCRUMB (NAV)               //
// ========================================== //
// Elemento de navegación principal que indica la ubicación actual del usuario.

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode;
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />);
Breadcrumb.displayName = "Breadcrumb";

// ========================================== //
// COMPONENTE: BREADCRUMB LIST (OL)            //
// ========================================== //
// Lista ordenada que contiene los elementos individuales del breadcrumb.

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<"ol">>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
        className,
      )}
      {...props}
    />
  ),
);
BreadcrumbList.displayName = "BreadcrumbList";

// ========================================== //
// COMPONENTE: BREADCRUMB ITEM (LI)            //
// ========================================== //
// Item individual dentro de la lista de navegación.

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("inline-flex items-center gap-1.5", className)} {...props} />
  ),
);
BreadcrumbItem.displayName = "BreadcrumbItem";

// ========================================== //
// COMPONENTE: BREADCRUMB LINK                 //
// ========================================== //
// Enlace interactivo dentro de un item de breadcrumb.
// Soporta 'asChild' para usar componentes personalizados de enrutamiento (ej. Link de React Router).

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean;
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";

  return <Comp ref={ref} className={cn("transition-colors hover:text-foreground", className)} {...props} />;
});
BreadcrumbLink.displayName = "BreadcrumbLink";

// ========================================== //
// COMPONENTE: BREADCRUMB PAGE (SPAN)          //
// ========================================== //
// Texto estático que representa la página actual en el breadcrumb.

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      {...props}
    />
  ),
);
BreadcrumbPage.displayName = "BreadcrumbPage";

// ========================================== //
// COMPONENTE: BREADCRUMB SEPARATOR (LI)       //
// ========================================== //
// Elemento visual que separa los items del breadcrumb (ej. un icono de flecha).

const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<"li">) => (
  <li role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>
    {children ?? <ChevronRight />}
  </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

// ========================================== //
// COMPONENTE: BREADCRUMB ELLIPSIS (SPAN)      //
// ========================================== //
// Icono de puntos suspensivos para indicar niveles de navegación ocultos.

const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
);
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis";

// ========================================== //
// EXPORTACIÓN DE COMPONENTES                  //
// ========================================== //

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
