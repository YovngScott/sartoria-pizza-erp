// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos la biblioteca núcleo de React para el manejo de componentes y referencias
import * as React from "react";
// Importamos la utilidad cn para combinar clases de Tailwind de forma dinámica y eficiente
import { cn } from "@/lib/utils";

// ========================================== //
// COMPONENTE PRINCIPAL (INPUT)
// ========================================== //
/**
 * Input: Componente de entrada de texto estandarizado con estilos consistentes.
 * Utiliza forwardRef para permitir el acceso al elemento input nativo desde componentes padres.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  // Desestructuramos className y type, manteniendo el resto de propiedades nativas en props
  ({ className, type, ...props }, ref) => {
    // ========================================== //
    // RENDERIZADO
    // ========================================== //
    return (
      <input
        {/* Definimos el tipo de input (text, email, password, etc.) */}
        type={type}
        {/* Aplicamos las clases de diseño base mediante la utilidad cn */}
        className={cn(
          // Diseño base: flexbox, altura fija, ancho total, bordes redondeados, borde estándar, fondo
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background",
          // Estilos para inputs de tipo archivo (file)
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Estilo para el placeholder (texto de ayuda)
          "placeholder:text-muted-foreground",
          // Estados de foco: anillo visual para accesibilidad sin bordes por defecto
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Estado deshabilitado: cambio de cursor y opacidad reducida
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Ajuste de fuente para dispositivos móviles (evita zoom automático en iOS)
          "md:text-sm",
          // Inyectamos clases adicionales pasadas por prop
          className,
        )}
        {/* Asignamos la referencia al elemento DOM */}
        ref={ref}
        {/* Propagamos el resto de atributos estándar del input */}
        {...props}
      />
    );
  },
);

// ========================================== //
// METADATOS Y EXPORTACIÓN
// ========================================== //
// Asignamos el nombre para herramientas de desarrollo
Input.displayName = "Input";

// Exportamos el componente para su uso global
export { Input };
