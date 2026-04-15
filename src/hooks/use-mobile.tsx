// ========================================== //
//           HOOK: USE MOBILE                   //
// ========================================== //

import * as React from "react";

// ========================================== //
// CONFIGURACIÓN DE PUNTOS DE INTERRUPCIÓN    //
// ========================================== //

const MOBILE_BREAKPOINT = 768;

// ========================================== //
// HOOK PERSONALIZADO: USE IS MOBILE          //
// ========================================== //
// Detecta si el dispositivo actual es móvil basándose en el ancho de la ventana.
// Utiliza window.matchMedia para una detección eficiente y reactiva.

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
