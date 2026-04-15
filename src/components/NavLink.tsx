// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos NavLink de react-router-dom para la navegación, renombrándolo para evitar conflictos de nombres
import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
// Importamos forwardRef de React para permitir que el componente reciba y pase referencias a elementos DOM
import { forwardRef } from "react";
// Importamos la utilidad cn para la concatenación condicional de clases de Tailwind CSS
import { cn } from "@/lib/utils";

// ========================================== //
// TIPOS Y INTERFACES
// ========================================== //
/**
 * Interfaz NavLinkCompatProps: Extiende las propiedades estándar de NavLink de react-router-dom.
 * Omitimos "className" para redefinirlo con soporte para clases personalizadas, activas y pendientes.
 */
interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  // Clase base opcional que se aplicará siempre
  className?: string;
  // Clase opcional que se aplicará cuando la ruta esté activa
  activeClassName?: string;
  // Clase opcional que se aplicará cuando la transición de la ruta esté pendiente
  pendingClassName?: string;
}

// ========================================== //
// COMPONENTE PRINCIPAL (NAVLINK)
// ========================================== //
/**
 * NavLink: Un wrapper compatible para el NavLink de React Router que facilita el manejo de clases dinámicas.
 * Utilizamos forwardRef para que los padres puedan acceder al elemento ancla subyacente.
 */
const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  // Desestructuramos las props para extraer nuestras clases personalizadas y el destino 'to'
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    // ========================================== //
    // RENDERIZADO
    // ========================================== //
    return (
      <RouterNavLink
        {/* Pasamos la referencia recibida al componente de React Router */}
        ref={ref}
        {/* Definimos el destino de la navegación */}
        to={to}
        {/* La prop className acepta una función que recibe el estado de la ruta (isActive, isPending) */}
        className={({ isActive, isPending }) =>
          // Utilizamos cn para combinar la clase base con las clases de estado si corresponden
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {/* Propagamos el resto de las propiedades estándar al NavLink subyacente */}
        {...props}
      />
    );
  },
);

// ========================================== //
// METADATOS Y EXPORTACIÓN
// ========================================== //
// Definimos el nombre de visualización para herramientas de desarrollo y depuración
NavLink.displayName = "NavLink";

// Exportamos el componente para su uso en la aplicación
export { NavLink };
