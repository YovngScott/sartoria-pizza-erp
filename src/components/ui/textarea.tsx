// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos React para la funcionalidad base de componentes y referencias DOM
import * as React from "react";
// Importamos la utilidad cn para combinar clases de Tailwind de forma condicional
import { cn } from "@/lib/utils";

// ========================================== //
// TIPOS Y INTERFACES
// ========================================== //
/**
 * TextareaProps: Hereda todos los atributos estándar de un textarea HTML.
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

// ========================================== //
// COMPONENTE PRINCIPAL (TEXTAREA)
// ========================================== //
/**
 * Textarea: Componente de entrada multilínea con estilos consistentes con el resto de la UI.
 * Implementa forwardRef para facilitar la integración con librerías de formularios.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    // ========================================== //
    // RENDERIZADO
    // ========================================== //
    return (
      <textarea
        {/* Aplicamos las clases de diseño y comportamiento base */}
        className={cn(
          // Diseño base: flexbox, altura mínima inicial, ancho total, bordes, fondo y padding
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          // Estilo para el placeholder (texto informativo)
          "placeholder:text-muted-foreground",
          // Estados de foco: anillo de luz para navegación por teclado (accesibilidad)
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Estado deshabilitado: cambio visual para indicar inactividad
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Inyectamos clases adicionales personalizadas si se proporcionan
          className,
        )}
        {/* Asignamos la referencia al elemento nativo del DOM */}
        ref={ref}
        {/* Propagamos el resto de las propiedades estándar (value, onChange, rows, etc.) */}
        {...props}
      />
    );
  },
);

// ========================================== //
// METADATOS Y EXPORTACIÓN
// ========================================== //
// Definimos el nombre para facilitar la identificación en el árbol de componentes
Textarea.displayName = "Textarea";

// Exportamos el componente para su uso en la aplicación
export { Textarea };
