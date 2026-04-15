// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos utilidades para el manejo de clases dinámicas en Tailwind CSS
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ========================================== //
// UTILIDADES DE ESTILO (TAILWIND)
// ========================================== //

/**
 * cn: Función de utilidad que combina condicionalmente nombres de clases CSS.
 * Utiliza clsx para la lógica condicional y twMerge para resolver conflictos de Tailwind CSS.
 * 
 * @param inputs Lista de clases, objetos o condicionales.
 * @returns Cadena de texto con las clases optimizadas y procesadas.
 * 
 * POR QUÉ: Permite una sintaxis limpia para clases dinámicas y asegura que las clases 
 * finales de Tailwind no tengan duplicados o sobrescrituras ineficientes.
 */
export function cn(...inputs: ClassValue[]) {
  // clsx resuelve: "bg-red-500", condition && "text-white", { "p-4": true }
  // twMerge resuelve: "p-2 p-4" -> "p-4" (evita colisiones de especificidad)
  return twMerge(clsx(inputs));
}
