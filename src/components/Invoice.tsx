import { motion } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useApp } from '@/contexts/CartContext';
import { formatPedidoCode } from '@/lib/erp';

const Invoice = () => {
  const { lastInvoice, clearInvoice } = useApp();
  const { format } = useCurrency();

  if (!lastInvoice) return null;

  const pedido = lastInvoice;
  const lineItems = Array.isArray(pedido.items) ? pedido.items : [];
  const fechaLabel = pedido.created_at
    ? new Date(pedido.created_at).toLocaleString('es-DO')
    : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <button
          onClick={clearInvoice}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <CheckCircle className="mx-auto mb-3 h-12 w-12 text-success" />
          <h2 className="font-display text-2xl font-bold text-foreground">
            Pedido confirmado
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Factura digital {formatPedidoCode(pedido.id)} - Sartoria della Pizza
          </p>
        </div>

        <div className="mb-4 space-y-1 rounded-lg bg-secondary p-4 text-sm">
          <p>
            <span className="text-muted-foreground">Cliente:</span>{' '}
            <span className="text-foreground">{pedido.cliente_nombre_snapshot}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Entrega:</span>{' '}
            <span className="text-foreground">{pedido.tipo}</span>
          </p>
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

        <div className="mb-4 space-y-2">
          {lineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Detalle de items no disponible.
            </p>
          ) : (
            lineItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {item.cantidad}x {item.pizza_nombre_snapshot}
                </span>
                <span className="text-foreground">
                  {format(
                    Number(item.precio_unitario) * Number(item.cantidad)
                  )}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">
              {format(Number(pedido.subtotal ?? 0))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ITBIS (18%)</span>
            <span className="text-foreground">
              {format(Number(pedido.impuesto_total ?? 0))}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span className="text-primary">Total</span>
            <span className="text-primary">{format(Number(pedido.total ?? 0))}</span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {pedido.tipo === 'delivery'
            ? 'Llegaremos en 20-30 minutos. Pago contra entrega.'
            : 'Recoge en Av. Metropolitana, Los Jardines, Santiago. Listo en 20 minutos.'}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Invoice;
