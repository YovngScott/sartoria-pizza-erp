// ========================================== //
// --- IMPORTACIONES ---
// ========================================== //

// Importa 'useState' de react para manejar el estado del formulario de pedido y el procesamiento.
// ¿Por qué?: Permite capturar los datos del cliente (nombre, email, dirección, etc.) localmente.
import { useState } from 'react';

// Importa 'motion' de framer-motion para animaciones en la lista del carrito.
// ¿Por qué?: Proporciona una experiencia visual fluida al añadir o eliminar productos.
import { motion } from 'framer-motion';

// Importa iconos de 'lucide-react' para la interfaz de usuario.
// ¿Por qué?: Ayuda a identificar visualmente acciones como sumar, restar, eliminar o volver.
import { Minus, Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';

// Importa 'Link' de react-router-dom para la navegación interna.
// ¿Por qué?: Permite al usuario navegar de vuelta al menú sin recargar la aplicación.
import { Link } from 'react-router-dom';

// Importa 'toast' de sonner para mostrar notificaciones de éxito o error.
// ¿Por qué?: Proporciona feedback inmediato al usuario tras intentar realizar un pedido.
import { toast } from 'sonner';

// Importa el componente 'Invoice' (Factura).
// ¿Por qué?: Se muestra automáticamente una vez que el pedido ha sido procesado con éxito.
import Invoice from '@/components/Invoice';

// Importa el hook personalizado del contexto del carrito.
// ¿Por qué?: Centraliza toda la lógica de gestión del carrito y el procesamiento de pedidos.
import { useApp } from '@/contexts/CartContext';

// Importa el hook personalizado del contexto de moneda.
// ¿Por qué?: Se encarga de formatear correctamente los precios (RD$, etc.).
import { useCurrency } from '@/contexts/CurrencyContext';

// Importa los datos de imágenes de pizza y la función de normalización.
// ¿Por qué?: Asegura que se muestre la imagen correcta para cada pizza, manejando fallos de URL.
import { pizzaImages } from '@/data/pizzaImages';
import { normalizePizzaImageKey } from '@/lib/erp';

// ========================================== //
// --- COMPONENTE PRINCIPAL ---
// ========================================== //

// Define el componente funcional 'CartPage' para la vista del carrito de compras.
const CartPage = () => {
  // --- LÓGICA Y ESTADO DEL CONTEXTO ---

  // Extrae funciones y estados globales del hook 'useApp'.
  // ¿Por qué?: Permite manipular el carrito y consultar el estado del último pedido realizado.
  const {
    cart,              // Array de productos en el carrito.
    removeFromCart,    // Función para eliminar un producto.
    updateQuantity,    // Función para cambiar la cantidad de un producto.
    processOrder,      // Función asíncrona para enviar el pedido al servidor/ERP.
    getCartSubtotal,   // Calcula el subtotal (antes de impuestos).
    getCartItbis,      // Calcula el ITBIS (18%).
    getCartTotal,      // Calcula el total final con impuestos.
    lastInvoice,       // Contiene la información de la última factura si se acaba de procesar un pedido.
  } = useApp();

  // Obtiene la función de formateo de moneda del contexto.
  const { format } = useCurrency();

  // --- ESTADOS LOCALES DEL FORMULARIO ---

  // Nombre del cliente para el pedido.
  const [nombre, setNombre] = useState('');
  
  // Correo electrónico del cliente (opcional).
  const [email, setEmail] = useState('');
  
  // Teléfono de contacto para la entrega o recogida.
  const [telefono, setTelefono] = useState('');
  
  // Tipo de pedido: 'Delivery' (a domicilio) o 'Recogida' (en local).
  const [tipo, setTipo] = useState<'Delivery' | 'Recogida'>('Delivery');
  
  // Dirección física para el envío (solo requerida en modo Delivery).
  const [direccion, setDireccion] = useState('');
  
  // Estado de carga para indicar que el pedido se está enviando.
  const [processing, setProcessing] = useState(false);

  // --- LÓGICA DE VALIDACIÓN ---

  // Determina si el botón de confirmar pedido debe estar habilitado.
  // ¿Por qué?: Asegura que los campos obligatorios estén llenos antes de procesar.
  const canCheckout =
    nombre.trim() &&                      // Nombre no vacío.
    cart.length > 0 &&                    // Carrito con al menos un item.
    (tipo === 'Recogida' || direccion.trim()) && // Dirección llena si es Delivery.
    !processing;                          // No estar procesando actualmente.

  // --- MANEJADORES DE EVENTOS ---

  // Gestiona el envío del formulario de pedido.
  // ¿Por qué?: Coordina la llamada al ERP y maneja las respuestas de éxito o error.
  const handleSubmit = async (e: React.FormEvent) => {
    // Evita la recarga de la página.
    e.preventDefault();
    
    // Si la validación falla, no hace nada.
    if (!canCheckout) return;

    // Activa el estado de carga.
    setProcessing(true);
    try {
      // Intenta procesar el pedido llamando a la lógica del contexto.
      await processOrder(nombre, email, tipo, direccion, telefono);
      // Muestra notificación de éxito.
      toast.success('Pedido confirmado');
    } catch (err: any) {
      // Muestra el error específico devuelto o un mensaje genérico.
      toast.error(err.message || 'Error al procesar pedido');
    }
    // Finaliza el estado de carga.
    setProcessing(false);
  };

  // --- RENDERIZADO CONDICIONAL (FACTURA) ---

  // Si existe una factura reciente ('lastInvoice'), muestra el componente Invoice en lugar del carrito.
  // ¿Por qué?: Confirma al usuario que su pedido fue recibido y muestra el resumen final.
  if (lastInvoice) return <Invoice />;

  // --- RENDERIZADO PRINCIPAL ---
  return (
    // Contenedor principal de la página del carrito.
    <main className="container mx-auto max-w-4xl px-4 py-8">
      {/* Enlace para regresar a la página principal del menú. */}
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al menu
      </Link>

      {/* Título de la página. */}
      <h1 className="mb-8 font-display text-3xl font-bold text-foreground">
        Tu Carrito
      </h1>

      {/* 
        Renderizado condicional del carrito.
        Si el carrito está vacío, muestra un mensaje amigable.
      */}
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
        /* Grid principal: Lista de productos (izquierda) y Formulario/Resumen (derecha). */
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Columna de items del carrito (ocupa 3 de 5 columnas en pantallas grandes). */}
          <div className="space-y-4 lg:col-span-3">
            {/* Mapea cada item del carrito a un bloque visual animado. */}
            {cart.map((item) => (
              <motion.div
                key={item.pizza.id}
                layout // Permite que Framer Motion anime el reposicionamiento tras cambios.
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-4 rounded-xl border border-border bg-card p-4"
              >
                {/* Imagen de la pizza con lógica de fallback. */}
                <img
                  src={
                    item.pizza.imagen_url ||
                    pizzaImages[normalizePizzaImageKey(item.pizza)] ||
                    '/placeholder.svg'
                  }
                  alt={item.pizza.nombre}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                
                {/* Detalles del producto (Nombre, precio unitario y controles). */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">
                      {item.pizza.nombre}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(Number(item.pizza.precio_venta_publico))} c/u
                    </p>
                  </div>
                  
                  {/* Controles de cantidad y botón de eliminación. */}
                  <div className="flex items-center gap-3">
                    {/* Botón para reducir cantidad. */}
                    <button
                      onClick={() =>
                        updateQuantity(item.pizza.id, item.cantidad - 1)
                      }
                      className="rounded-md border border-border bg-secondary p-1 hover:border-primary"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    {/* Visualización de la cantidad actual. */}
                    <span className="text-sm font-semibold text-foreground">
                      {item.cantidad}
                    </span>
                    {/* Botón para aumentar cantidad. */}
                    <button
                      onClick={() =>
                        updateQuantity(item.pizza.id, item.cantidad + 1)
                      }
                      className="rounded-md border border-border bg-secondary p-1 hover:border-primary"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    {/* Botón para eliminar el item completo del carrito. */}
                    <button
                      onClick={() => removeFromCart(item.pizza.id)}
                      className="ml-auto text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Precio total por línea (Precio unitario * Cantidad). */}
                <span className="font-semibold text-foreground">
                  {format(Number(item.pizza.precio_venta_publico) * item.cantidad)}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Columna de resumen y datos del cliente (ocupa 2 de 5 columnas). */}
          <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-2">
            {/* Bloque de Resumen de Costos. */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                Resumen
              </h2>
              <div className="space-y-2 text-sm">
                {/* Fila de Subtotal. */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">
                    {format(getCartSubtotal())}
                  </span>
                </div>
                {/* Fila de Impuestos (ITBIS). */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ITBIS (18%)</span>
                  <span className="text-foreground">
                    {format(getCartItbis())}
                  </span>
                </div>
                {/* Fila de Total Final destacada. */}
                <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
                  <span className="text-primary">Total</span>
                  <span className="text-primary">{format(getCartTotal())}</span>
                </div>
              </div>
            </div>

            {/* Bloque de Información de Entrega. */}
            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Datos de Entrega
              </h2>
              {/* Campo de Nombre Completo. */}
              <input
                type="text"
                placeholder="Nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {/* Campo de Correo Electrónico. */}
              <input
                type="email"
                placeholder="Correo electronico (opcional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {/* Campo de Teléfono. */}
              <input
                type="tel"
                placeholder="Telefono de contacto"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />

              {/* Selector de Tipo de Pedido (Delivery vs Recogida). */}
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

              {/* Sección dinámica según el tipo de pedido seleccionado. */}
              {tipo === 'Delivery' ? (
                <>
                  {/* Input de dirección (solo visible si es Delivery). */}
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
                /* Información de recogida física. */
                <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
                  Recoge en Av. Metropolitana, Los Jardines, Santiago. Listo en
                  20 minutos. Pago en el local.
                </p>
              )}
            </div>

            {/* Botón de Confirmación Final. */}
            <button
              type="submit"
              disabled={!canCheckout} // Deshabilitado si el formulario es inválido.
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-lg font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {/* Muestra spinner si el pedido está en proceso. */}
              {processing && <Loader2 className="h-5 w-5 animate-spin" />}
              {processing ? 'Procesando...' : 'Confirmar Pedido'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
};

// Exporta el componente CartPage por defecto.
export default CartPage;
