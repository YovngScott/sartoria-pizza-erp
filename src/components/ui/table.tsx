// ========================================== //
// IMPORTACIONES
// ========================================== //
// Importamos React para la creación de la estructura tabular y gestión de referencias
import * as React from "react";
// Importamos la utilidad cn para el manejo dinámico de estilos Tailwind
import { cn } from "@/lib/utils";

// ========================================== //
// COMPONENTE: TABLE (CONTENEDOR)
// ========================================== //
/**
 * Table: Envuelve la tabla HTML en un contenedor con scroll horizontal si es necesario.
 */
const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    // Contenedor responsivo para tablas anchas
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        {/* Estilos base: ancho completo, pie de tabla abajo, fuente pequeña */}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  ),
);
Table.displayName = "Table";

// ========================================== //
// COMPONENTE: TABLEHEADER (CABECERA)
// ========================================== //
/**
 * TableHeader: Define la sección de encabezado de la tabla.
 */
const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      {/* Aseguramos que todas las filas dentro del header tengan borde inferior */}
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  ),
);
TableHeader.displayName = "TableHeader";

// ========================================== //
// COMPONENTE: TABLEBODY (CUERPO)
// ========================================== //
/**
 * TableBody: Contenedor para las filas de datos principales.
 */
const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      {/* Eliminamos el borde de la última fila para una estética limpia */}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  ),
);
TableBody.displayName = "TableBody";

// ========================================== //
// COMPONENTE: TABLEFOOTER (PIE)
// ========================================== //
/**
 * TableFooter: Sección inferior para totales o resúmenes.
 */
const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      {/* Estilos: borde superior, fondo tenue, tipografía media */}
      className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  ),
);
TableFooter.displayName = "TableFooter";

// ========================================== //
// COMPONENTE: TABLEROW (FILA)
// ========================================== //
/**
 * TableRow: Representa una fila individual con efectos de hover.
 */
const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      {/* Estilos: borde inferior, transición de color y hover reactivo */}
      className={cn(
        "border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

// ========================================== //
// COMPONENTE: TABLEHEAD (CELDA DE CABECERA)
// ========================================== //
/**
 * TableHead: Celda de título (TH) con alineación y tipografía específica.
 */
const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      {/* Estilos: altura fija, padding lateral, alineación izquierda, color tenue */}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

// ========================================== //
// COMPONENTE: TABLECELL (CELDA DE DATOS)
// ========================================== //
/**
 * TableCell: Celda de contenido estándar (TD).
 */
const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      {/* Estilos: padding estándar y alineación centrada verticalmente */}
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  ),
);
TableCell.displayName = "TableCell";

// ========================================== //
// COMPONENTE: TABLECAPTION (LEYENDA)
// ========================================== //
/**
 * TableCaption: Texto descriptivo opcional al pie de la tabla.
 */
const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      {/* Estilos: margen superior, fuente pequeña y color tenue */}
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  ),
);
TableCaption.displayName = "TableCaption";

// ========================================== //
// EXPORTACIONES
// ========================================== //
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
