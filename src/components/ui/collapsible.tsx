// ========================================== //
//           COMPONENTE: COLLAPSIBLE            //
// ========================================== //

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

// ========================================== //
// DEFINICIÓN DE COMPONENTES COLLAPSIBLE      //
// ========================================== //
// Utiliza los primitivos de Radix UI para crear secciones que se pueden
// expandir y contraer, útil para FAQs, menús laterales, etc.

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

// ========================================== //
// EXPORTACIÓN DE COMPONENTES                  //
// ========================================== //

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
