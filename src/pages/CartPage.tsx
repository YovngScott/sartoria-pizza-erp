import { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import Invoice from '@/components/Invoice';
import { useApp } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { pizzaImages } from '@/data/pizzaImages';
import { normalizePizzaImageKey } from '@/lib/erp';

const CartPage = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    processOrder,
    getCartSubtotal,
    getCartItbis,
    getCartTotal,
    lastInvoice,
  } = useApp();
  const { format } = useCurrency();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipo, setTipo] = useState<'Delivery' | 'Recogida'>('Delivery');
  const [direccion, setDireccion] = useState('');
  const [processing, setProcessing] = useState(false);

  const canCheckout =
    nombre.trim() &&
    cart.length > 0 &&
    (tipo === 'Recogida' || direccion.trim()) &&
    !processing;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCheckout) return;

    setProcessing(true);
    try {
      await processOrder(nombre, email, tipo, direccion, telefono);
      toast.success('Pedido confirmado');
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar pedido');
    }
    setProcessing(false);
  };

  if (lastInvoice) return <Invoice />;

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al menu
      </Link>

      <h1 className="mb-8 font-display text-3xl font-bold text-foreground">
        Tu Carrito
      </h1>

      {cart.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Tu carrito esta vacio.</p>
          <Link
            to="/"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Ver menu
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            {cart.map((item) => (
              <motion.div
                key={item.pizza.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-4 rounded-xl border border-border bg-card p-4"
              >
                <img
                  src={
                    item.pizza.imagen_url ||
                    pizzaImages[normalizePizzaImageKey(item.pizza)] ||
                    '/placeholder.svg'
                  }
                  alt={item.pizza.nombre}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">
                      {item.pizza.nombre}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(Number(item.pizza.precio_venta_publico))} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        updateQuantity(item.pizza.id, item.cantidad - 1)
                      }
                      className="rounded-md border border-border bg-secondary p-1 hover:border-primary"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-semibold text-foreground">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.pizza.id, item.cantidad + 1)
                      }
                      className="rounded-md border border-border bg-secondary p-1 hover:border-primary"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.pizza.id)}
                      className="ml-auto text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <span className="font-semibold text-foreground">
                  {format(Number(item.pizza.precio_venta_publico) * item.cantidad)}
                </span>
              </motion.div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                Resumen
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">
                    {format(getCartSubtotal())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ITBIS (18%)</span>
                  <span className="text-foreground">
                    {format(getCartItbis())}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
                  <span className="text-primary">Total</span>
                  <span className="text-primary">{format(getCartTotal())}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Datos de Entrega
              </h2>
              <input
                type="text"
                placeholder="Nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="email"
                placeholder="Correo electronico (opcional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="tel"
                placeholder="Telefono de contacto"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />

              <div className="flex gap-2">
                {(['Delivery', 'Recogida'] as const).map((currentType) => (
                  <button
                    key={currentType}
                    type="button"
                    onClick={() => setTipo(currentType)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${
                      tipo === currentType
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-secondary text-foreground hover:border-primary/40'
                    }`}
                  >
                    {currentType}
                  </button>
                ))}
              </div>

              {tipo === 'Delivery' ? (
                <>
                  <input
                    type="text"
                    placeholder="Direccion en Santiago"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Llegaremos en 20-30 minutos. Pago contra entrega.
                  </p>
                </>
              ) : (
                <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
                  Recoge en Av. Metropolitana, Los Jardines, Santiago. Listo en
                  20 minutos. Pago en el local.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canCheckout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-lg font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {processing && <Loader2 className="h-5 w-5 animate-spin" />}
              {processing ? 'Procesando...' : 'Confirmar Pedido'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
};

export default CartPage;
