// ========================================== //
// --- IMPORTACIONES ---
// ========================================== //

// Importa 'useLocation' de react-router-dom para acceder a la información de la URL actual.
// ¿Por qué?: Permite identificar qué ruta intentó acceder el usuario y falló.
import { useLocation } from "react-router-dom";

// Importa 'useEffect' de react para manejar efectos secundarios en el ciclo de vida del componente.
// ¿Por qué?: Se utiliza para registrar el error 404 en la consola cuando el componente se monta.
import { useEffect } from "react";

// ========================================== //
// --- COMPONENTE PRINCIPAL ---
// ========================================== //

// Define el componente funcional 'NotFound' para manejar rutas no encontradas (Error 404).
const NotFound = () => {
  // --- LÓGICA Y HOOKS ---

  // Obtiene el objeto de localización que contiene información sobre la ruta actual.
  // ¿Por qué?: Necesario para extraer 'pathname' y mostrarlo en el log de error.
  const location = useLocation();

  // Efecto que se ejecuta cada vez que cambia la ruta (o cuando se carga el componente).
  // ¿Por qué?: Para fines de depuración, registra un error en la consola indicando la ruta inexistente.
  useEffect(() => {
    // Registra un mensaje de error detallado en la consola del navegador.
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]); // Dependencia: location.pathname para reaccionar ante cambios de ruta.

  // --- RENDERIZADO ---
  return (
    // Contenedor principal centrado que ocupa toda la pantalla.
    <div className="flex min-h-screen items-center justify-center bg-muted">
      {/* Contenedor interno para el texto centrado. */}
      <div className="text-center">
        {/* Título grande indicando el código de error 404. */}
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        {/* Mensaje descriptivo indicando que la página no fue encontrada. */}
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        {/* 
          Enlace para regresar a la página de inicio.
          Utiliza una etiqueta 'a' estándar para una navegación simple hacia la raíz.
        */}
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

// Exporta el componente NotFound por defecto.
export default NotFound;
