// ========================================== //
// --- IMPORTACIONES ---
// ========================================== //

// Importa 'motion' de framer-motion for animaciones de entrada del modal.
// ¿Por qué?: Proporciona una transición suave y profesional al mostrar la factura.
import { motion } from 'framer-motion';

// Importa iconos de 'lucide-react' para indicar éxito (CheckCircle) y permitir el cierre (X).
// ¿Por qué?: Mejora la comunicación visual y la usabilidad del componente.
import { CheckCircle, X } from 'lucide-react';

// Importa el hook de moneda para formatear los montos de la factura.
// ¿Por qué?: Asegura que los precios se muestren según la preferencia del usuario.
import { useCurrency } from '@/contexts/CurrencyContext';

// Importa el hook del carrito para acceder a la última factura y limpiar el estado.
import { useApp } from '@/contexts/CartContext';

// Importa la utilidad para formatear el código de pedido de forma amigable.
import { formatPedidoCode } from '@/lib/erp';

// ========================================== //
// --- COMPONENTE PRINCIPAL ---
// ========================================== //

// Define el componente 'Invoice' que actúa como un recibo digital tras una compra exitosa.
const Invoice = () => {
  // --- LÓGICA Y ESTADO ---

  // Obtiene la información de la última factura y la función para cerrarla desde el contexto global.
  const { lastInvoice, clearInvoice } = useApp();

  // Obtiene la función de formateo de moneda.
  const { format } = useCurrency();

  // Si no hay una factura que mostrar, el componente no renderiza nada.
  if (!lastInvoice) return null;

  // Asigna la factura a una variable local para facilitar el acceso a sus propiedades.
  const pedido = lastInvoice;

  // Obtiene los items del pedido, asegurándose de que sea un array para evitar errores.
  const lineItems = Array.isArray(pedido.items) ? pedido.items : [];

  // Formatea la fecha de creación del pedido al local dominicano (es-DO).
  const fechaLabel = pedido.created_at
    ? new Date(pedido.created_at).toLocaleString('es-DO')
    : '';

  // --- RENDERIZADO ---
  return (
    // Overlay oscuro y con desenfoque que cubre toda la pantalla.
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
    >
      {/* Contenedor central del recibo con animación de escala. */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        {/* Botón de cierre en la esquina superior derecha. */}
        <button
          onClick={clearInvoice}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabecera del recibo: Icono de éxito y título. */}
        <div className="mb-6 text-center">
          <CheckCircle className="mx-auto mb-3 h-12 w-12 text-success" />
          <h2 className="font-display text-2xl font-bold text-foreground">
            Pedido confirmado
          </h2>
          {/* Muestra el código de pedido formateado (ej: #00123). */}
          <p className="mt-1 text-sm text-muted-foreground">
            Factura digital {formatPedidoCode(pedido.id)} - Sartoria della Pizza
          </p>
        </div>

        {/* Sección de datos informativos del cliente y la entrega. */}
        <div className="mb-4 space-y-1 rounded-lg bg-secondary p-4 text-sm">
          <p>
            <span className="text-muted-foreground">Cliente:</span>{' '}
            <span className="text-foreground">{pedido.cliente_nombre_snapshot}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Entrega:</span>{' '}
            <span className="text-foreground">{pedido.tipo}</span>
          </p>
          {/* Solo muestra la dirección si el pedido es tipo Delivery. */}
          {pedido.direccion_entrega && (
            <p>
              <span className="text-muted-foreground">Direccion:</span>{' '}
              <span className="text-foreground">
                {pedido.direccion_entrega}
              </span>
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Fecha:</span>{' '}
            <span className="text-foreground">{fechaLabel || '-'}</span>
          </p>
        </div>

        {/* Listado detallado de productos adquiridos. */}
        <div className="mb-4 space-y-2">
          {/* Renderizado condicional por si no hay items cargados. */}
          {lineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Detalle de items no disponible.
            </p>
          ) : (
            /* Mapeo de cada item del pedido a una fila de descripción y precio. */
            lineItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                {/* Muestra cantidad y nombre de la pizza capturado en el momento de la venta. */}
                <span className="text-foreground">
                  {item.cantidad}x {item.pizza_nombre_snapshot}
                </span>
                {/* Calcula y formatea el precio total por línea. */}
                <span className="text-foreground">
                  {format(
                    Number(item.precio_unitario) * Number(item.cantidad)
                  )}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Sección de desglose de costos finales. */}
        <div className="space-y-1 border-t border-border pt-3 text-sm">
          {/* Muestra el subtotal calculado en el servidor. */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">
              {format(Number(pedido.subtotal ?? 0))}
            </span>
          </div>
          {/* Muestra el impuesto (ITBIS) aplicado. */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">ITBIS (18%)</span>
            <span className="text-foreground">
              {format(Number(pedido.impuesto_total ?? 0))}
            </span>
          </div>
          {/* Muestra el total final en negrita y color primario. */}
          <div className="flex justify-between text-lg font-bold">
            <span className="text-primary">Total</span>
            <span className="text-primary">{format(Number(pedido.total ?? 0))}</span>
          </div>
        </div>

        {/* Mensaje de cierre con información de tiempos de entrega/recogida. */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {/* Lógica dinámica según el tipo de pedido. */}
          {pedido.tipo === 'delivery'
            ? 'Llegaremos en 20-30 minutos. Pago contra entrega.'
            : 'Recoge en Av. Metropolitana, Los Jardines, Santiago. Listo en 20 minutos.'}
        </p>
      </motion.div>
    </motion.div>
  );
};

// Exportación por defecto para su uso en CartPage.tsx.
export default Invoice;
