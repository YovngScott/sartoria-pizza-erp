// ========================================== //
//       PUNTO DE ENTRADA PRINCIPAL (MAIN)     //
// ========================================== //

/**
 * ARCHIVO: main.tsx
 * DESCRIPCIÓN: Este es el corazón de la aplicación. Aquí es donde React se conecta 
 * con el HTML real de la página para empezar a mostrar todo.
 */

// --- IMPORTACIONES DE LIBRERÍAS --- //
// Traemos la función para crear la raíz de la interfaz desde la librería de React para el navegador.
import { createRoot } from "react-dom/client";

// --- IMPORTACIONES DE COMPONENTES --- //
// Importamos el componente "App", que es el contenedor de toda nuestra aplicación.
import App from "./App.tsx";

// --- IMPORTACIONES DE ESTILOS --- //
// Cargamos los estilos CSS globales que afectarán a toda la web (fuentes, colores base, etc.).
import "./index.css";

// ========================================== //
//       INICIALIZACIÓN DE LA APLICACIÓN       //
// ========================================== //

// Buscamos en el archivo index.html el elemento con id="root".
// El signo "!" al final indica que estamos seguros de que ese elemento existe.
// Luego, renderizamos (dibujamos) nuestro componente principal <App /> dentro de ese espacio.
createRoot(document.getElementById("root")!).render(<App />);
